const elements = {
  navigation: document.querySelector("#post-navigation"),
  history: document.querySelector("#history-list"),
  newButton: document.querySelector("#new-button"),
  publishButton: document.querySelector("#publish-button"),
  saveState: document.querySelector("#save-state"),
  postState: document.querySelector("#post-state"),
  title: document.querySelector("#title-input"),
  date: document.querySelector("#date-input"),
  body: document.querySelector("#body-input"),
  sourceLabel: document.querySelector("#source-label-input"),
  sourceUrl: document.querySelector("#source-url-input"),
  italicButton: document.querySelector("#italic-button"),
  linkButton: document.querySelector("#link-button"),
  linkDialog: document.querySelector("#link-dialog"),
  linkForm: document.querySelector("#link-form"),
  linkText: document.querySelector("#link-text-input"),
  linkUrl: document.querySelector("#link-url-input"),
  linkCancel: document.querySelector("#link-cancel-button"),
  previewTitle: document.querySelector("#preview-title"),
  previewDate: document.querySelector("#preview-date"),
  previewReadingTime: document.querySelector("#preview-reading-time"),
  previewBody: document.querySelector("#preview-body"),
  notice: document.querySelector("#notice"),
};

let posts = [];
let current = null;
let saveTimer = null;
let savingPromise = null;
let saveAgain = false;
let noticeTimer = null;
let editRevision = 0;
let linkSelection = { start: 0, end: 0 };

function today() {
  return new Date().toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isSafeHref(href) {
  if (href.startsWith("/") || href.startsWith("#")) return true;
  try {
    const protocol = new URL(href).protocol;
    return protocol === "http:" || protocol === "https:" || protocol === "mailto:";
  } catch {
    return false;
  }
}

function renderInline(value) {
  const pattern = /\[([^\]]+)\]\(([^)\s]+)\)|\*([^*\n]+)\*|_([^_\n]+)_/g;
  let output = "";
  let cursor = 0;

  for (const match of value.matchAll(pattern)) {
    const index = match.index ?? 0;
    output += escapeHtml(value.slice(cursor, index));
    if (match[1] && match[2] && isSafeHref(match[2])) {
      output += `<a href="${escapeHtml(match[2])}" rel="noreferrer">${renderInline(match[1])}</a>`;
    } else if (match[3] || match[4]) {
      output += `<em>${escapeHtml(match[3] || match[4])}</em>`;
    } else {
      output += escapeHtml(match[0]);
    }
    cursor = index + match[0].length;
  }
  return output + escapeHtml(value.slice(cursor));
}

function formatDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function readingTime(value) {
  const words = value.trim().match(/[\p{L}\p{N}’'-]+/gu)?.length ?? 0;
  const minutes = Math.max(1, Math.ceil(words / 180));
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

function showNotice(message, duration = 3200) {
  clearTimeout(noticeTimer);
  elements.notice.textContent = message;
  elements.notice.classList.add("is-visible");
  noticeTimer = setTimeout(() => elements.notice.classList.remove("is-visible"), duration);
}

function updateCurrentFromFields() {
  if (!current) return;
  current.title = elements.title.value;
  current.date = elements.date.value || today();
  current.body = elements.body.value;
  current.source =
    elements.sourceLabel.value.trim() && elements.sourceUrl.value.trim()
      ? { label: elements.sourceLabel.value, href: elements.sourceUrl.value }
      : undefined;
}

function renderPreview() {
  if (!current) return;
  updateCurrentFromFields();
  elements.previewTitle.textContent = current.title.trim() || "Untitled";
  elements.previewDate.textContent = formatDate(current.date);
  elements.previewReadingTime.textContent = readingTime(current.body);

  const paragraphs = current.body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\n/g, " ").trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${renderInline(paragraph)}</p>`)
    .join("");
  const source = current.source
    ? `<p class="preview-source"><a href="${escapeHtml(current.source.href)}" target="_blank" rel="noreferrer">${escapeHtml(current.source.label)}</a></p>`
    : "";
  elements.previewBody.innerHTML = paragraphs + source;
  elements.publishButton.disabled = !current.title.trim() || !current.body.trim();
}

function sectionMarkup(title, items) {
  if (!items.length) return "";
  return `
    <section class="library-section">
      <h2 class="library-heading">${title}</h2>
      <ol class="post-links">
        ${items
          .map(
            (post) => `
              <li>
                <button class="post-link ${current?.slug === post.slug ? "is-active" : ""}" type="button" data-slug="${escapeHtml(post.slug)}">
                  <span>${escapeHtml(post.title || "Untitled")}</span>
                  <small>${formatDate(post.date)}</small>
                </button>
              </li>`,
          )
          .join("")}
      </ol>
    </section>`;
}

function renderNavigation() {
  const drafts = posts.filter((post) => post.status === "draft");
  const published = posts.filter((post) => post.status === "published");
  elements.navigation.innerHTML = sectionMarkup("Drafts", drafts) + sectionMarkup("Published", published);

  for (const button of elements.navigation.querySelectorAll("[data-slug]")) {
    button.addEventListener("click", async () => {
      await flushSave();
      selectPost(button.dataset.slug);
    });
  }
}

function renderHistory(items) {
  elements.history.innerHTML = items.length
    ? items
        .map(
          (item) => `<li>${escapeHtml(item.message)}<time datetime="${item.date}">${formatDate(item.date)}</time></li>`,
        )
        .join("")
    : "<li>No publishing history yet.</li>";
}

function fillFields() {
  elements.title.value = current?.title || "";
  elements.date.value = current?.date || today();
  elements.body.value = current?.body || "";
  elements.sourceLabel.value = current?.source?.label || "";
  elements.sourceUrl.value = current?.source?.href || "";
  elements.postState.textContent = current?.status === "published" ? "Published" : "Draft";
  elements.postState.classList.toggle("is-published", current?.status === "published");
  renderPreview();
  renderNavigation();
}

function selectPost(slug) {
  current = posts.find((post) => post.slug === slug) || posts[0] || createBlankPost();
  fillFields();
}

function createBlankPost() {
  return {
    title: "",
    slug: "",
    date: today(),
    status: "draft",
    body: "",
  };
}

function setSaveState(label) {
  elements.saveState.textContent = label;
}

function scheduleSave() {
  editRevision += 1;
  updateCurrentFromFields();
  renderPreview();
  setSaveState("Unsaved changes");
  clearTimeout(saveTimer);
  if (!current.title.trim()) return;
  saveTimer = setTimeout(saveCurrent, 700);
}

function replaceBodySelection(text, selectionStart, selectionEnd) {
  const start = elements.body.selectionStart;
  const end = elements.body.selectionEnd;
  elements.body.setRangeText(text, start, end, "end");
  elements.body.focus();
  elements.body.setSelectionRange(
    start + selectionStart,
    start + selectionEnd,
  );
  scheduleSave();
}

function applyItalic() {
  const start = elements.body.selectionStart;
  const end = elements.body.selectionEnd;
  const selected = elements.body.value.slice(start, end);
  const content = selected || "italic text";
  replaceBodySelection(`*${content}*`, 1, content.length + 1);
}

function openLinkDialog() {
  const start = elements.body.selectionStart;
  const end = elements.body.selectionEnd;
  linkSelection = { start, end };
  elements.linkText.value = elements.body.value.slice(start, end);
  elements.linkUrl.value = "";
  elements.linkDialog.showModal();
  (elements.linkText.value ? elements.linkUrl : elements.linkText).focus();
}

function addLink() {
  const label = elements.linkText.value.trim();
  const href = elements.linkUrl.value.trim();
  if (!label || !isSafeHref(href)) {
    showNotice("Use a web address beginning with https://, http://, mailto:, /, or #.");
    return;
  }

  elements.linkDialog.close();
  elements.body.focus();
  elements.body.setSelectionRange(linkSelection.start, linkSelection.end);
  const markdown = `[${label}](${href})`;
  replaceBodySelection(markdown, markdown.length, markdown.length);
}

async function saveCurrent() {
  clearTimeout(saveTimer);
  if (!current?.title.trim()) return;
  if (savingPromise) {
    saveAgain = true;
    await savingPromise;
    if (saveAgain) {
      saveAgain = false;
      return saveCurrent();
    }
    return;
  }

  const postBeingSaved = current;
  const snapshot = JSON.parse(JSON.stringify(current));
  const revisionBeingSaved = editRevision;
  setSaveState("Saving…");

  savingPromise = (async () => {
    const response = await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshot),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);

    if (current === postBeingSaved) {
      if (revisionBeingSaved === editRevision) current = result.post;
      else current.slug = result.post.slug;
    }

    const storedPost = current === postBeingSaved ? current : result.post;
    const index = posts.findIndex(
      (post) => post.slug === snapshot.slug || post.slug === result.post.slug,
    );
    if (index === -1) posts.unshift(storedPost);
    else posts[index] = storedPost;
    renderNavigation();

    if (revisionBeingSaved === editRevision) setSaveState("Saved locally");
    else saveAgain = true;
  })();

  try {
    await savingPromise;
  } catch (error) {
    setSaveState("Could not save");
    showNotice(error.message || "Could not save this draft.");
  } finally {
    savingPromise = null;
    if (saveAgain) {
      saveAgain = false;
      await saveCurrent();
    }
  }
}

async function flushSave() {
  clearTimeout(saveTimer);
  if (current?.title.trim()) await saveCurrent();
}

async function publishCurrent() {
  if (!current?.title.trim() || !current.body.trim()) return;
  await flushSave();
  const question = current.status === "published"
    ? `Publish the latest changes to “${current.title}”?`
    : `Publish “${current.title}” to Thinkinghaus?`;
  if (!window.confirm(question)) return;

  elements.publishButton.disabled = true;
  elements.publishButton.textContent = "Publishing…";
  setSaveState("Publishing to thinking.haus…");

  try {
    const response = await fetch("/api/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: current.slug }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    posts = result.posts;
    current = posts.find((post) => post.slug === current.slug);
    renderHistory(result.history);
    fillFields();
    setSaveState("Published");
    showNotice("Published. The live site is updating now.", 5000);
  } catch (error) {
    setSaveState("Publishing paused");
    showNotice(error.message || "Publishing did not finish.", 6500);
  } finally {
    elements.publishButton.textContent = "Publish";
    renderPreview();
  }
}

for (const input of [elements.title, elements.date, elements.body, elements.sourceLabel, elements.sourceUrl]) {
  input.addEventListener("input", scheduleSave);
}

elements.newButton.addEventListener("click", async () => {
  await flushSave();
  current = createBlankPost();
  fillFields();
  elements.title.focus();
});

elements.publishButton.addEventListener("click", publishCurrent);
elements.italicButton.addEventListener("click", applyItalic);
elements.linkButton.addEventListener("click", openLinkDialog);
elements.linkCancel.addEventListener("click", () => elements.linkDialog.close());
elements.linkForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addLink();
});
elements.body.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "i") {
    event.preventDefault();
    applyItalic();
  }
});

window.addEventListener("beforeunload", (event) => {
  if (elements.saveState.textContent === "Unsaved changes") {
    event.preventDefault();
  }
});

async function initialize() {
  try {
    const response = await fetch("/api/posts");
    const result = await response.json();
    posts = result.posts;
    renderHistory(result.history);
    selectPost(posts[0]?.slug);
    setSaveState("Saved locally");
  } catch {
    showNotice("The studio could not read the writing folder.", 6000);
  }
}

initialize();
