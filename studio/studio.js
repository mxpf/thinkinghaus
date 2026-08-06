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
  previewTitle: document.querySelector("#preview-title"),
  previewDate: document.querySelector("#preview-date"),
  previewReadingTime: document.querySelector("#preview-reading-time"),
  previewBody: document.querySelector("#preview-body"),
  notice: document.querySelector("#notice"),
};

let posts = [];
let current = null;
let saveTimer = null;
let saving = false;
let saveAgain = false;
let noticeTimer = null;

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
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
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
  updateCurrentFromFields();
  renderPreview();
  setSaveState("Unsaved changes");
  clearTimeout(saveTimer);
  if (!current.title.trim()) return;
  saveTimer = setTimeout(saveCurrent, 700);
}

async function saveCurrent() {
  clearTimeout(saveTimer);
  if (!current?.title.trim()) return;
  if (saving) {
    saveAgain = true;
    return;
  }

  saving = true;
  setSaveState("Saving…");
  try {
    const response = await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(current),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);

    const previousSlug = current.slug;
    current = result.post;
    const index = posts.findIndex((post) => post.slug === previousSlug || post.slug === current.slug);
    if (index === -1) posts.unshift(current);
    else posts[index] = current;
    setSaveState("Saved locally");
    fillFields();
  } catch (error) {
    setSaveState("Could not save");
    showNotice(error.message || "Could not save this draft.");
  } finally {
    saving = false;
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
