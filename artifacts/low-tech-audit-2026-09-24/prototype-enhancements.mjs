import { attachScrollFade } from "/write-placid-scroll-fade-v1.4.0.mjs";

const reducedMotion = (() => {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
})();

const hyphenBetweenWords = /(?<=[\p{L}\p{N}])-(?=[\p{L}\p{N}])/gu;
const unguardedEnDash = /(?<!\u2060)–(?!\u2060)/gu;
const skippedTags = new Set([
  "BUTTON", "CODE", "INPUT", "OPTION", "PRE", "SCRIPT", "SELECT", "STYLE", "SVG", "TEXTAREA",
]);

function guardTypography(node) {
  for (let element = node.parentElement; element; element = element.parentElement) {
    if (skippedTags.has(element.tagName) || element.isContentEditable || element.hasAttribute("data-preserve-typography")) return;
  }
  if (!node.nodeValue) return;
  node.nodeValue = node.nodeValue
    .replace(hyphenBetweenWords, "‑")
    .replace(unguardedEnDash, "\u2060–\u2060");
}

function guardTypographyIn(root) {
  if (root.nodeType === Node.TEXT_NODE) {
    guardTypography(root);
    return;
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) guardTypography(node);
}

guardTypographyIn(document.body);
const typographyObserver = new MutationObserver((records) => {
  for (const record of records) {
    if (record.type === "characterData") guardTypography(record.target);
    else for (const node of record.addedNodes) guardTypographyIn(node);
  }
});
typographyObserver.observe(document.body, { characterData: true, childList: true, subtree: true });

const progress = document.querySelector(".scroll-progress");
if (progress) {
  let animationFrame = 0;
  const updateProgress = () => {
    animationFrame = 0;
    const root = document.documentElement;
    const scrollableHeight = root.scrollHeight - root.clientHeight;
    const value = scrollableHeight > 0 ? Math.min(1, Math.max(0, root.scrollTop / scrollableHeight)) : 0;
    progress.style.setProperty("--scroll-progress", String(value));
  };
  const scheduleUpdate = () => {
    if (!animationFrame) animationFrame = window.requestAnimationFrame(updateProgress);
  };
  scheduleUpdate();
  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate);
}

document.querySelectorAll(".article-image").forEach((image) => attachScrollFade(image));

const footer = document.querySelector(".footer--end-reveal");
if (footer && !reducedMotion) {
  const revealAtEnd = () => {
    const distance = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
    if (distance <= 1) footer.classList.add("is-revealed");
  };
  requestAnimationFrame(() => {
    footer.classList.add("is-armed");
    revealAtEnd();
  });
  window.addEventListener("scroll", revealAtEnd, { passive: true });
  window.addEventListener("resize", revealAtEnd);
}
