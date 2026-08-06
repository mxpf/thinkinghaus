const elements = {
  siteButtons: [...document.querySelectorAll("[data-site]")],
  navigation: document.querySelector("#post-navigation"),
  history: document.querySelector("#history-list"),
  newButton: document.querySelector("#new-button"),
  publishButton: document.querySelector("#publish-button"),
  liveLink: document.querySelector(".quiet-button"),
  saveState: document.querySelector("#save-state"),
  postState: document.querySelector("#post-state"),
  title: document.querySelector("#title-input"),
  date: document.querySelector("#date-input"),
  dateField: document.querySelector(".date-field"),
  body: document.querySelector("#body-input"),
  sourceDetails: document.querySelector(".source-details"),
  sourceLabel: document.querySelector("#source-label-input"),
  sourceUrl: document.querySelector("#source-url-input"),
  captionEditor: document.querySelector("#caption-editor"),
  captionFields: document.querySelector("#caption-fields"),
  contactEditor: document.querySelector("#contact-editor"),
  contactEmail: document.querySelector("#contact-email-input"),
  contactLocation: document.querySelector("#contact-location-input"),
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
  previewMedia: document.querySelector("#preview-media"),
  notice: document.querySelector("#notice"),
};

const sites = {
  thinkinghaus: {
    items: [],
    current: null,
    history: [],
    label: "Thinkinghaus",
    url: "https://thinking.haus",
  },
  portfolio: {
    items: [],
    current: null,
    history: [],
    label: "Portfolio",
    url: "https://maxpfennig.haus",
  },
};

let activeSite = "thinkinghaus";
let saveTimer = null;
let savingPromise = null;
let saveAgain = false;
let noticeTimer = null;
let editRevision = 0;
let linkSelection = { start: 0, end: 0 };

function site() {
  return sites[activeSite];
}

function current() {
  return site().current;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value ?? "")
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
  for (const match of String(value).matchAll(pattern)) {
    const index = match.index ?? 0;
    output += escapeHtml(value.slice(cursor, index));
    if (match[1] && match[2] && isSafeHref(match[2])) {
      output += `<a href="${escapeHtml(match[2])}" rel="noreferrer">${renderInline(match[1])}</a>`;
    } else if (match[3] || match[4]) {
      output += `<em>${escapeHtml(match[3] || match[4])}</em>`;
    } else output += escapeHtml(match[0]);
    cursor = index + match[0].length;
  }
  return output + escapeHtml(String(value).slice(cursor));
}

function renderBlocks(value) {
  return String(value)
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const line = block.replace(/\n/g, " ");
      if (/^#\s+/.test(line)) return `<h2>${renderInline(line.replace(/^#\s+/, ""))}</h2>`;
      if (/^##\s+/.test(line)) return `<h3>${renderInline(line.replace(/^##\s+/, ""))}</h3>`;
      return `<p>${renderInline(line)}</p>`;
    })
    .join("")
    .replaceAll("&lt;br&gt;", "<br>");
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
  const item = current();
  if (!item) return;
  item.title = elements.title.value;
  item.body = elements.body.value;
  if (activeSite === "thinkinghaus") {
    item.date = elements.date.value || today();
    item.source =
      elements.sourceLabel.value.trim() && elements.sourceUrl.value.trim()
        ? { label: elements.sourceLabel.value, href: elements.sourceUrl.value }
        : undefined;
  } else {
    if (item.type === "about") {
      item.email = elements.contactEmail.value;
      item.location = elements.contactLocation.value;
    } else {
      for (const input of elements.captionFields.querySelectorAll("[data-caption-id]")) {
        const media = item.media.find((entry) => entry.id === input.dataset.captionId);
        if (media) media.caption = input.value;
      }
    }
  }
}

function portfolioMediaUrl(src) {
  return src?.startsWith("/") ? `/portfolio-media${src}` : "";
}

function renderPortfolioPreview() {
  const item = current();
  elements.previewDate.textContent = "";
  elements.previewReadingTime.textContent = "";
  const body = item.body
    .replaceAll("{{email}}", item.email || "")
    .replaceAll("{{location}}", item.location || "");
  elements.previewBody.innerHTML = renderBlocks(body);
  if (item.type === "about") {
    elements.previewBody.insertAdjacentHTML(
      "beforeend",
      `<dl class="preview-contact"><div><dt>Email</dt><dd>${escapeHtml(item.email)}</dd></div><div><dt>Location</dt><dd>${escapeHtml(item.location)}</dd></div></dl>`,
    );
    elements.previewMedia.hidden = true;
    elements.previewMedia.innerHTML = "";
    return;
  }
  elements.previewMedia.hidden = false;
  elements.previewMedia.innerHTML = item.media
    .map((media, index) => {
      const source = portfolioMediaUrl(media.src);
      const visual = source
        ? media.kind === "video"
          ? `<video src="${escapeHtml(source)}" muted playsinline controls preload="metadata"></video>`
          : `<img src="${escapeHtml(source)}" alt="${escapeHtml(media.alt || media.title || "")}" loading="lazy" />`
        : `<div class="preview-media-placeholder">${escapeHtml(media.kind || "Media")}</div>`;
      const caption = media.caption.trim()
        ? `<figcaption>${renderInline(media.caption)}</figcaption>`
        : "";
      return `<figure data-media-index="${index}">${visual}${caption}</figure>`;
    })
    .join("");
}

function renderPreview() {
  const item = current();
  if (!item) return;
  updateCurrentFromFields();
  elements.previewTitle.textContent = item.title.trim() || "Untitled";

  if (activeSite === "portfolio") renderPortfolioPreview();
  else {
    elements.previewDate.textContent = formatDate(item.date);
    elements.previewReadingTime.textContent = readingTime(item.body);
    const source = item.source
      ? `<p class="preview-source"><a href="${escapeHtml(item.source.href)}" target="_blank" rel="noreferrer">${escapeHtml(item.source.label)}</a></p>`
      : "";
    elements.previewBody.innerHTML = renderBlocks(item.body) + source;
    elements.previewMedia.hidden = true;
    elements.previewMedia.innerHTML = "";
  }
  elements.publishButton.disabled = !item.title.trim() || !item.body.trim();
}

function sectionMarkup(title, items) {
  if (!items.length) return "";
  return `<section class="library-section"><h2 class="library-heading">${title}</h2><ol class="post-links">${items
    .map(
      (item) => `<li><button class="post-link ${current()?.slug === item.slug ? "is-active" : ""}" type="button" data-slug="${escapeHtml(item.slug)}"><span>${escapeHtml(item.title || "Untitled")}</span><small>${activeSite === "portfolio" ? item.type === "about" ? "Page" : `Project ${String(item.order).padStart(2, "0")}` : formatDate(item.date)}</small></button></li>`,
    )
    .join("")}</ol></section>`;
}

function renderNavigation() {
  if (activeSite === "portfolio") {
    elements.navigation.innerHTML =
      sectionMarkup("Site", site().items.filter((item) => item.type === "about")) +
      sectionMarkup("Projects", site().items.filter((item) => item.type !== "about"));
  } else {
    const drafts = site().items.filter((item) => item.status === "draft");
    const published = site().items.filter((item) => item.status === "published");
    elements.navigation.innerHTML = sectionMarkup("Drafts", drafts) + sectionMarkup("Published", published);
  }
  for (const button of elements.navigation.querySelectorAll("[data-slug]")) {
    button.addEventListener("click", async () => {
      await flushSave();
      selectItem(button.dataset.slug);
    });
  }
}

function renderHistory(items) {
  elements.history.innerHTML = items.length
    ? items.map((item) => `<li>${escapeHtml(item.message)}<time datetime="${item.date}">${formatDate(item.date)}</time></li>`).join("")
    : "<li>No publishing history yet.</li>";
}

function renderCaptionFields() {
  if (activeSite !== "portfolio" || !current() || current().type === "about") {
    elements.captionFields.innerHTML = "";
    return;
  }
  elements.captionFields.innerHTML = current().media
    .map(
      (media, index) => `<label class="caption-field"><span><b>${String(index + 1).padStart(2, "0")}</b> ${escapeHtml(media.title || media.id)} <small>${escapeHtml(media.kind)}</small></span><textarea rows="3" data-caption-id="${escapeHtml(media.id)}" placeholder="No caption">${escapeHtml(media.caption)}</textarea></label>`,
    )
    .join("");
  for (const input of elements.captionFields.querySelectorAll("textarea")) input.addEventListener("input", scheduleSave);
}

function fillFields() {
  const item = current();
  elements.title.value = item?.title || "";
  elements.date.value = item?.date || today();
  elements.body.value = item?.body || "";
  elements.sourceLabel.value = item?.source?.label || "";
  elements.sourceUrl.value = item?.source?.href || "";
  elements.contactEmail.value = item?.email || "";
  elements.contactLocation.value = item?.location || "";
  elements.newButton.hidden = activeSite === "portfolio";
  elements.dateField.hidden = activeSite === "portfolio";
  elements.sourceDetails.hidden = activeSite === "portfolio";
  elements.captionEditor.hidden = activeSite !== "portfolio" || item?.type === "about";
  elements.contactEditor.hidden = activeSite !== "portfolio" || item?.type !== "about";
  elements.postState.textContent = activeSite === "portfolio" ? item?.type === "about" ? "Page" : "Project" : item?.status === "published" ? "Published" : "Draft";
  elements.postState.classList.toggle("is-published", activeSite === "thinkinghaus" && item?.status === "published");
  elements.body.placeholder = activeSite === "portfolio" ? item?.type === "about" ? "About and contact text" : "Project introduction" : "Begin anywhere.";
  renderCaptionFields();
  renderPreview();
  renderNavigation();
}

function selectItem(slug) {
  site().current = site().items.find((item) => item.slug === slug) || site().items[0] || createBlankPost();
  fillFields();
}

function createBlankPost() {
  return { title: "", slug: "", date: today(), status: "draft", body: "" };
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
  if (!current()?.title.trim()) return;
  saveTimer = setTimeout(saveCurrent, 700);
}

function replaceBodySelection(text, selectionStart, selectionEnd) {
  const start = elements.body.selectionStart;
  const end = elements.body.selectionEnd;
  elements.body.setRangeText(text, start, end, "end");
  elements.body.focus();
  elements.body.setSelectionRange(start + selectionStart, start + selectionEnd);
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
  linkSelection = { start: elements.body.selectionStart, end: elements.body.selectionEnd };
  elements.linkText.value = elements.body.value.slice(linkSelection.start, linkSelection.end);
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

function savePayload(item) {
  if (activeSite === "thinkinghaus") return JSON.parse(JSON.stringify(item));
  return {
    type: item.type,
    slug: item.slug,
    title: item.title,
    body: item.body,
    email: item.email,
    location: item.location,
    captions: Object.fromEntries(item.media.map((media) => [media.id, media.caption || ""])),
  };
}

async function saveCurrent() {
  clearTimeout(saveTimer);
  const item = current();
  if (!item?.title.trim()) return;
  if (savingPromise) {
    saveAgain = true;
    await savingPromise;
    if (saveAgain) {
      saveAgain = false;
      return saveCurrent();
    }
    return;
  }

  const siteBeingSaved = activeSite;
  const itemBeingSaved = item;
  const snapshot = savePayload(item);
  const revisionBeingSaved = editRevision;
  setSaveState("Saving…");

  savingPromise = (async () => {
    const endpoint = siteBeingSaved === "portfolio" ? "/api/portfolio/save" : "/api/save";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshot),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    const saved = result.project || result.post;
    const targetSite = sites[siteBeingSaved];
    const index = targetSite.items.findIndex((entry) => entry.slug === snapshot.slug || entry.slug === saved.slug);
    if (index === -1) targetSite.items.unshift(saved);
    else targetSite.items[index] = saved;
    if (activeSite === siteBeingSaved && current() === itemBeingSaved) targetSite.current = saved;
    if (activeSite === siteBeingSaved) renderNavigation();
    if (revisionBeingSaved === editRevision) setSaveState("Saved locally");
    else saveAgain = true;
  })();

  try {
    await savingPromise;
  } catch (error) {
    setSaveState("Could not save");
    showNotice(error.message || "Could not save these changes.");
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
  if (current()?.title.trim()) await saveCurrent();
}

async function publishCurrent() {
  const item = current();
  if (!item?.title.trim() || !item.body.trim()) return;
  await flushSave();
  const destination = site().label;
  if (!window.confirm(`Publish the latest changes to “${item.title}” on ${destination}?`)) return;

  elements.publishButton.disabled = true;
  elements.publishButton.textContent = "Publishing…";
  setSaveState(`Publishing ${destination}…`);
  try {
    const endpoint = activeSite === "portfolio" ? "/api/portfolio/publish" : "/api/publish";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: item.slug }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    site().items = result.posts || (result.about ? [result.about, ...result.projects] : result.projects);
    site().history = result.history || [];
    site().current = site().items.find((entry) => entry.slug === item.slug) || site().items[0];
    renderHistory(site().history);
    fillFields();
    setSaveState("Published");
    showNotice(`Published. ${destination} is updating now.`, 5000);
  } catch (error) {
    setSaveState("Publishing paused");
    showNotice(error.message || "Publishing did not finish.", 6500);
  } finally {
    elements.publishButton.textContent = "Publish";
    renderPreview();
  }
}

async function switchSite(nextSite) {
  if (nextSite === activeSite) return;
  await flushSave();
  activeSite = nextSite;
  for (const button of elements.siteButtons) button.classList.toggle("is-active", button.dataset.site === activeSite);
  elements.liveLink.href = site().url;
  renderHistory(site().history);
  selectItem(site().current?.slug || site().items[0]?.slug);
  setSaveState("Saved locally");
}

for (const input of [elements.title, elements.date, elements.body, elements.sourceLabel, elements.sourceUrl, elements.contactEmail, elements.contactLocation]) {
  input.addEventListener("input", scheduleSave);
}
for (const button of elements.siteButtons) button.addEventListener("click", () => switchSite(button.dataset.site));
elements.newButton.addEventListener("click", async () => {
  await flushSave();
  site().current = createBlankPost();
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
  if (elements.saveState.textContent === "Unsaved changes") event.preventDefault();
});

async function initialize() {
  try {
    const [writingResponse, portfolioResponse] = await Promise.all([
      fetch("/api/posts"),
      fetch("/api/portfolio/projects"),
    ]);
    const writing = await writingResponse.json();
    const portfolio = await portfolioResponse.json();
    if (!writingResponse.ok) throw new Error(writing.error);
    if (!portfolioResponse.ok) throw new Error(portfolio.error);
    sites.thinkinghaus.items = writing.posts;
    sites.thinkinghaus.history = writing.history;
    sites.portfolio.items = [portfolio.about, ...portfolio.projects];
    sites.portfolio.history = portfolio.history;
    renderHistory(site().history);
    selectItem(site().items[0]?.slug);
    setSaveState("Saved locally");
  } catch (error) {
    showNotice(error.message || "The studio could not read the site content.", 6000);
  }
}

initialize();
