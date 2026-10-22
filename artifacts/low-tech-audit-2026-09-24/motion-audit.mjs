import { execFile, spawn } from "node:child_process";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import WebSocket from "ws";

const output = resolve("artifacts/low-tech-audit-2026-09-24/motion-audit");
await mkdir(output, { recursive: true });

const profile = await mkdtemp(join(tmpdir(), "thinkinghaus-motion-"));
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", "--remote-debugging-port=9334", `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "--disable-background-networking",
  "--disable-component-update", "--disable-extensions", "--disable-sync", "about:blank",
], { stdio: "ignore" });

for (let attempt = 0; attempt < 200; attempt += 1) {
  try {
    if ((await fetch("http://127.0.0.1:9334/json/version")).ok) break;
  } catch {}
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
  if (attempt === 199) throw new Error("Chrome debugger did not start");
}

class Cdp {
  constructor(url) { this.socket = new WebSocket(url); this.id = 1; this.pending = new Map(); this.listeners = new Map(); }
  async open() {
    await new Promise((resolvePromise, reject) => { this.socket.once("open", resolvePromise); this.socket.once("error", reject); });
    this.socket.on("message", (raw) => {
      const message = JSON.parse(String(raw));
      if (message.id) {
        const pending = this.pending.get(message.id); if (!pending) return;
        this.pending.delete(message.id); message.error ? pending.reject(new Error(message.error.message)) : pending.resolve(message.result); return;
      }
      for (const listener of this.listeners.get(message.method) || []) listener(message.params);
    });
  }
  send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolvePromise, reject) => { this.pending.set(id, { resolve: resolvePromise, reject }); this.socket.send(JSON.stringify({ id, method, params })); });
  }
  on(method, listener) { if (!this.listeners.has(method)) this.listeners.set(method, new Set()); this.listeners.get(method).add(listener); }
  once(method) { return new Promise((resolvePromise) => { const listener = (params) => { this.listeners.get(method).delete(listener); resolvePromise(params); }; this.on(method, listener); }); }
  close() { this.socket.close(); }
}

async function client({ width = 1440, height = 1000, reduced = false, javascript = true } = {}) {
  const target = await (await fetch("http://127.0.0.1:9334/json/new?about:blank", { method: "PUT" })).json();
  const cdp = new Cdp(target.webSocketDebuggerUrl); await cdp.open();
  await Promise.all([cdp.send("Page.enable"), cdp.send("Runtime.enable"), cdp.send("Network.enable")]);
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.setBlockedURLs", { urls: ["*trackinghaus-alpha.vercel.app/api/collect*"] });
  await cdp.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 768 });
  await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: reduced ? "reduce" : "no-preference" }] });
  if (!javascript) await cdp.send("Emulation.setScriptExecutionDisabled", { value: true });
  if (javascript) await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: `
    (() => {
      const record = (name, event) => {
        const data = { name, at: performance.now(), hasViewTransition: !!event?.viewTransition };
        try { sessionStorage.setItem('motion-' + name, JSON.stringify(data)); } catch {}
      };
      addEventListener('pageswap', event => record('pageswap', event));
      addEventListener('pagereveal', event => record('pagereveal', event));
      addEventListener('DOMContentLoaded', () => {
        const started = performance.now(); window.__motionFrames = [];
        const tick = () => {
          const brand = document.querySelector('.desktop-brand');
          const first = document.querySelector('.post-list li');
          const tenth = document.querySelector('.post-list li:nth-child(10)');
          const footer = document.querySelector('.index-column > .footer');
          window.__motionFrames.push({
            elapsed: performance.now() - started,
            brandOpacity: brand ? getComputedStyle(brand).opacity : null,
            brandTransform: brand ? getComputedStyle(brand).transform : null,
            firstOpacity: first ? getComputedStyle(first).opacity : null,
            firstTransform: first ? getComputedStyle(first).transform : null,
            tenthOpacity: tenth ? getComputedStyle(tenth).opacity : null,
            tenthTransform: tenth ? getComputedStyle(tenth).transform : null,
            footerOpacity: footer ? getComputedStyle(footer).opacity : null,
            animations: document.getAnimations({ subtree: true }).map(animation => ({
              name: animation.animationName || animation.effect?.target?.className || 'view-transition',
              currentTime: animation.currentTime,
              playState: animation.playState,
              pseudoElement: animation.effect?.pseudoElement || null,
            })),
          });
          if (performance.now() - started < 850) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    })();
  ` });
  return cdp;
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function navigate(cdp, url) { const loaded = cdp.once("Page.loadEventFired"); await cdp.send("Page.navigate", { url }); await loaded; await new Promise((r) => setTimeout(r, 900)); }

const snapshotExpression = `(() => ({
  url: location.href,
  navigationType: performance.getEntriesByType('navigation').at(-1)?.type || null,
  crossDocumentViewTransitions: CSS.supports('view-transition-name: root') && 'onpagereveal' in window,
  pageswap: JSON.parse(sessionStorage.getItem('motion-pageswap') || 'null'),
  pagereveal: JSON.parse(sessionStorage.getItem('motion-pagereveal') || 'null'),
  frames: window.__motionFrames || [],
  activeAnimations: document.getAnimations({ subtree: true }).map(animation => ({ name: animation.animationName || 'view-transition', currentTime: animation.currentTime, playState: animation.playState, pseudoElement: animation.effect?.pseudoElement || null })),
  motionStyles: {
    linkTransition: getComputedStyle(document.querySelector('.site a')).transition,
    dateTransition: document.querySelector('.post-date') ? getComputedStyle(document.querySelector('.post-date')).transition : null,
    imageTransition: document.querySelector('.article-image') ? getComputedStyle(document.querySelector('.article-image')).transition : null,
  },
}))()`;

async function focusSamples(cdp) {
  const values = [];
  const sample = async (label) => values.push(await evaluate(cdp, `(() => { const link=document.querySelector('.post-list a'); const date=link.nextElementSibling; return { label:${JSON.stringify(label)}, active:document.activeElement===link, linkColor:getComputedStyle(link).color, dateOpacity:getComputedStyle(date).opacity }; })()`));
  const point = await evaluate(cdp, `(() => { const rect=document.querySelector('.post-list a').getBoundingClientRect(); return { x:rect.left + rect.width/2, y:rect.top + rect.height/2 }; })()`);
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: point.x, y: point.y });
  await sample("hover-0"); await new Promise((r) => setTimeout(r, 90)); await sample("hover-90"); await new Promise((r) => setTimeout(r, 130)); await sample("hover-220");
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 5, y: 900 });
  await sample("unhover-0"); await new Promise((r) => setTimeout(r, 220)); await sample("unhover-220"); await new Promise((r) => setTimeout(r, 240)); await sample("unhover-460");
  await evaluate(cdp, `document.activeElement?.blur()`);
  for (let index = 0; index < 2; index += 1) {
    await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
  }
  await sample("focus-visible-0"); await new Promise((r) => setTimeout(r, 90)); await sample("focus-visible-90"); await new Promise((r) => setTimeout(r, 130)); await sample("focus-visible-220");
  return values;
}

async function scrollSamples(cdp) {
  return evaluate(cdp, `(async () => {
    const image = document.querySelector('.article-image'); const footer = document.querySelector('.footer--end-reveal'); const progress = document.querySelector('.scroll-progress');
    const sample = label => ({ label, imageOpacity: image ? getComputedStyle(image).opacity : null, progress: progress ? getComputedStyle(progress).transform : null, footerOpacity: footer ? getComputedStyle(footer).opacity : null, footerTransform: footer ? getComputedStyle(footer).transform : null, footerClasses: footer?.className || null });
    const values = [];
    if (image) {
      scrollTo(0, image.offsetTop + image.offsetHeight + 100); await new Promise(r => setTimeout(r, 120)); values.push(sample('image-past'));
      scrollTo(0, image.offsetTop - innerHeight / 3); values.push(sample('image-return-0')); await new Promise(r => setTimeout(r, 40)); values.push(sample('image-return-40')); await new Promise(r => setTimeout(r, 80)); values.push(sample('image-return-120'));
    }
    scrollTo(0, document.documentElement.scrollHeight); values.push(sample('end-0')); await new Promise(r => setTimeout(r, 60)); values.push(sample('end-60')); await new Promise(r => setTimeout(r, 200)); values.push(sample('end-260'));
    return values;
  })()`);
}

async function auditSurface(label, base, { width = 1440, height = 1000, reduced = false } = {}) {
  const cdp = await client({ width, height, reduced });
  const documents = [];
  cdp.on("Network.requestWillBeSent", ({ request, type }) => { if (type === "Document") documents.push(request.url); });
  await navigate(cdp, `${base}/`);
  const initial = await evaluate(cdp, snapshotExpression);
  const focus = await focusSamples(cdp);
  const beforeNavigationDocuments = documents.length;
  await evaluate(cdp, `document.querySelector('.post-list a').click()`);
  await new Promise((r) => setTimeout(r, 1000));
  const forward = await evaluate(cdp, snapshotExpression);
  const forwardDocuments = documents.slice(beforeNavigationDocuments);
  const articleScroll = await scrollSamples(cdp);
  const beforeBackDocuments = documents.length;
  await evaluate(cdp, `history.back()`);
  await new Promise((r) => setTimeout(r, 1000));
  const back = await evaluate(cdp, snapshotExpression);
  const backDocuments = documents.slice(beforeBackDocuments);
  await evaluate(cdp, `location.reload()`);
  await new Promise((r) => setTimeout(r, 1000));
  const reload = await evaluate(cdp, snapshotExpression);
  await navigate(cdp, `${base}/now.html`);
  const shortPageDimensions = await evaluate(cdp, `({ scrollHeight:document.documentElement.scrollHeight, clientHeight:document.documentElement.clientHeight })`);
  const shortPageScroll = await scrollSamples(cdp);
  const result = { label, base, width, height, reduced, documents, initial, focus, forward, forwardDocuments, articleScroll, back, backDocuments, reload, shortPageDimensions, shortPageScroll };
  cdp.close(); return result;
}

async function auditNoJs(label, url) {
  const cdp = await client({ javascript: false }); await navigate(cdp, url);
  const result = await evaluate(cdp, `(() => { const image=document.querySelector('.article-image'); const footer=document.querySelector('.footer--end-reveal'); return { textLength:document.body.innerText.length, links:document.links.length, imageOpacity:image?getComputedStyle(image).opacity:null, footerOpacity:footer?getComputedStyle(footer).opacity:null, progress:getComputedStyle(document.querySelector('.scroll-progress')).transform, animations:document.getAnimations({subtree:true}).length }; })()`);
  cdp.close(); return { label, result };
}

const results = [];
for (const [label, base] of [["production", "https://thinking.haus"], ["prototype", "http://127.0.0.1:4314"]]) {
  results.push(await auditSurface(`${label}-desktop`, base));
  results.push(await auditSurface(`${label}-mobile`, base, { width: 390, height: 844 }));
  results.push(await auditSurface(`${label}-reduced`, base, { reduced: true }));
  results.push(await auditNoJs(`${label}-nojs`, `${base}/deep-minimal.html`));
}
await writeFile(join(output, "motion-observations.json"), `${JSON.stringify(results, null, 2)}\n`);
console.log(JSON.stringify(results.map((result) => result.result ? result : ({ label: result.label, forwardDocuments: result.forwardDocuments, backDocuments: result.backDocuments, initialAnimations: result.initial.frames[0]?.animations?.map(a => a.name), forwardEvents: { pageswap: result.forward.pageswap, pagereveal: result.forward.pagereveal }, focus: result.focus, articleScroll: result.articleScroll })), null, 2));

chrome.kill("SIGTERM");
