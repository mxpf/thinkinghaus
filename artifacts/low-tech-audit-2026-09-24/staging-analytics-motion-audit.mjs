import { spawn } from "node:child_process";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import WebSocket from "ws";

const base = process.env.STAGING_BASE || "https://thinkinghaus-low-js-staging.vercel.app";
const runLabel = process.env.STAGING_RUN_LABEL || "root";
const bypassSecret = process.env.STAGING_BYPASS_SECRET;
const output = resolve("artifacts/low-tech-audit-2026-09-24/staging-analytics-motion-audit");
await mkdir(output, { recursive: true });

const profile = await mkdtemp(join(tmpdir(), "thinkinghaus-staging-audit-"));
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", "--remote-debugging-port=9337", `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "--disable-background-networking",
  "--disable-component-update", "--disable-extensions", "--disable-sync", "about:blank",
], { stdio: "ignore" });

for (let attempt = 0; attempt < 200; attempt += 1) {
  try { if ((await fetch("http://127.0.0.1:9337/json/version")).ok) break; } catch {}
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
  if (attempt === 199) throw new Error("Chrome debugger did not start");
}

class Cdp {
  constructor(url) { this.socket = new WebSocket(url); this.id = 1; this.pending = new Map(); this.listeners = new Map(); }
  async open() { await new Promise((resolvePromise, reject) => { this.socket.once("open", resolvePromise); this.socket.once("error", reject); }); this.socket.on("message", raw => { const message = JSON.parse(String(raw)); if (message.id) { const pending = this.pending.get(message.id); if (!pending) return; this.pending.delete(message.id); message.error ? pending.reject(new Error(message.error.message)) : pending.resolve(message.result); return; } for (const listener of this.listeners.get(message.method) || []) listener(message.params); }); }
  send(method, params = {}) { const id = this.id++; return new Promise((resolvePromise, reject) => { this.pending.set(id, { resolve: resolvePromise, reject }); this.socket.send(JSON.stringify({ id, method, params })); }); }
  on(method, listener) { if (!this.listeners.has(method)) this.listeners.set(method, new Set()); this.listeners.get(method).add(listener); }
  once(method) { return new Promise(resolvePromise => { const listener = params => { this.listeners.get(method).delete(listener); resolvePromise(params); }; this.on(method, listener); }); }
  close() { this.socket.close(); }
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

const instrumentation = `(() => {
  const save = (name, event) => { const value = { at: performance.now(), hasViewTransition: !!event.viewTransition, activation: event.activation ? { from: event.activation.from?.url || null, entry: event.activation.entry?.url || null, navigationType: event.activation.navigationType } : null }; window['__' + name] = value; try { sessionStorage.setItem('staging-' + name, JSON.stringify(value)); } catch {} };
  addEventListener('pageswap', event => save('pageswap', event));
  addEventListener('pagereveal', event => save('pagereveal', event));
  addEventListener('error', event => { (window.__errors ||= []).push(String(event.error || event.message)); });
  addEventListener('unhandledrejection', event => { (window.__errors ||= []).push(String(event.reason)); });
  addEventListener('DOMContentLoaded', () => { const start = performance.now(); window.__frames = []; const tick = () => { const brand = document.querySelector('.desktop-brand'); const first = document.querySelector('.post-list li'); const tenth = document.querySelector('.post-list li:nth-child(10)'); const footer = document.querySelector('.index-column > .footer'); window.__frames.push({ elapsed: performance.now() - start, brandOpacity: brand ? getComputedStyle(brand).opacity : null, firstOpacity: first ? getComputedStyle(first).opacity : null, tenthOpacity: tenth ? getComputedStyle(tenth).opacity : null, footerOpacity: footer ? getComputedStyle(footer).opacity : null, animations: document.getAnimations({ subtree: true }).map(animation => ({ name: animation.animationName || 'view-transition', currentTime: animation.currentTime, playState: animation.playState, pseudo: animation.effect?.pseudoElement || null })) }); if (performance.now() - start < 850) requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
})();`;

async function client({ width, height, reduced = false, javascript = true }) {
  const target = await (await fetch("http://127.0.0.1:9337/json/new?about:blank", { method: "PUT" })).json();
  const cdp = new Cdp(target.webSocketDebuggerUrl); await cdp.open();
  await Promise.all([cdp.send("Page.enable"), cdp.send("Runtime.enable"), cdp.send("Network.enable")]);
  if (bypassSecret) {
    await cdp.send("Fetch.enable", { patterns: [{ urlPattern: `${base}/*`, requestStage: "Request" }] });
    cdp.on("Fetch.requestPaused", async ({ requestId, request }) => {
      const headers = Object.entries(request.headers).map(([name, value]) => ({ name, value: String(value) }));
      headers.push({ name: "x-vercel-protection-bypass", value: bypassSecret });
      try { await cdp.send("Fetch.continueRequest", { requestId, headers }); } catch {}
    });
  }
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 768 });
  await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: reduced ? "reduce" : "no-preference" }] });
  if (!javascript) await cdp.send("Emulation.setScriptExecutionDisabled", { value: true });
  if (javascript) await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: instrumentation });
  return cdp;
}

async function navigate(cdp, url, delay = 1800) { const loaded = cdp.once("Page.loadEventFired"); await cdp.send("Page.navigate", { url }); await loaded; await new Promise(resolvePromise => setTimeout(resolvePromise, delay)); }

const snapshot = `(() => ({ url: location.href, pageswap: JSON.parse(sessionStorage.getItem('staging-pageswap') || 'null'), pagereveal: window.__pagereveal || JSON.parse(sessionStorage.getItem('staging-pagereveal') || 'null'), frames: window.__frames || [], errors: window.__errors || [], tracker: [...document.scripts].filter(script => script.src.includes('trackinghaus')).map(script => ({ src: script.src, site: script.dataset.site, endpoint: script.dataset.endpoint })), activeAnimations: document.getAnimations({ subtree: true }).map(animation => ({ name: animation.animationName || 'view-transition', playState: animation.playState, pseudo: animation.effect?.pseudoElement || null })) }))()`;

async function focusSamples(cdp) {
  const values = [];
  const sample = async label => values.push(await evaluate(cdp, `(() => { const link=document.querySelector('.post-list a'); const date=link.nextElementSibling; return { label:${JSON.stringify(label)}, color:getComputedStyle(link).color, dateOpacity:getComputedStyle(date).opacity }; })()`));
  const point = await evaluate(cdp, `(() => { const rect=document.querySelector('.post-list a').getBoundingClientRect(); return { x:rect.left+rect.width/2, y:rect.top+rect.height/2 }; })()`);
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: point.x, y: point.y }); await sample("hover-0"); await new Promise(r => setTimeout(r, 220)); await sample("hover-220");
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 5, y: heightFor(cdp) - 5 }); await sample("out-0"); await new Promise(r => setTimeout(r, 460)); await sample("out-460");
  return values;
}

const clientHeights = new WeakMap();
function heightFor(cdp) { return clientHeights.get(cdp) || 844; }

async function articleSamples(cdp) {
  return evaluate(cdp, `(async () => { const image=document.querySelector('.article-image'); const footer=document.querySelector('.footer--end-reveal'); const progress=document.querySelector('.scroll-progress'); const caption=document.querySelector('figcaption'); const sample=label=>({ label, imageOpacity:image?getComputedStyle(image).opacity:null, progress:progress?getComputedStyle(progress).transform:null, footerOpacity:footer?getComputedStyle(footer).opacity:null, footerTransform:footer?getComputedStyle(footer).transform:null, captionColor:caption?getComputedStyle(caption).color:null }); const values=[]; if(image){scrollTo(0,image.offsetTop+image.offsetHeight+100);await new Promise(r=>setTimeout(r,120));values.push(sample('image-out'));scrollTo(0,image.offsetTop-innerHeight/3);await new Promise(r=>setTimeout(r,120));values.push(sample('image-in'));} scrollTo(0,document.documentElement.scrollHeight);values.push(sample('end-0'));await new Promise(r=>setTimeout(r,260));values.push(sample('end-260'));return values;})()`);
}

async function audit(label, width, height, { reduced = false, javascript = true } = {}) {
  const cdp = await client({ width, height, reduced, javascript }); clientHeights.set(cdp, height);
  const network = []; const documents = [];
  cdp.on("Network.requestWillBeSent", ({ request, type }) => { if (type === "Document") documents.push(request.url); if (request.url.includes("trackinghaus")) network.push({ phase: "request", url: request.url, method: request.method, type }); });
  cdp.on("Network.responseReceived", ({ response, type }) => { if (response.url.includes("trackinghaus")) network.push({ phase: "response", url: response.url, status: response.status, type, protocol: response.protocol }); });
  await navigate(cdp, `${base}/`);
  if (!javascript) { const noJs = await evaluate(cdp, `({ textLength:document.body.innerText.length, links:document.links.length, trackerScripts:[...document.scripts].filter(s=>s.src.includes('trackinghaus')).length, contentVisible:getComputedStyle(document.querySelector('.site')).visibility })`); cdp.close(); return { label, width, height, reduced, javascript, network, noJs }; }
  const initial = await evaluate(cdp, snapshot); const focus = width >= 768 ? await focusSamples(cdp) : [];
  const before = documents.length; await evaluate(cdp, `document.querySelector('.post-list a').click()`); await new Promise(r => setTimeout(r, 1900));
  const forward = await evaluate(cdp, snapshot); const forwardDocuments = documents.slice(before); const article = await articleSamples(cdp);
  const beforeBack = documents.length; await evaluate(cdp, `history.back()`); await new Promise(r => setTimeout(r, 1200)); const back = await evaluate(cdp, snapshot); const backDocuments = documents.slice(beforeBack);
  const result = { label, width, height, reduced, javascript, documents, network, initial, focus, forward, forwardDocuments, article, back, backDocuments };
  cdp.close(); return result;
}

const results = [];
results.push(await audit("chrome-desktop", 1440, 1000));
results.push(await audit("chrome-mobile-emulation", 390, 844));
results.push(await audit("chrome-reduced-motion", 1440, 1000, { reduced: true }));
results.push(await audit("chrome-no-js", 1440, 1000, { javascript: false }));
await writeFile(join(output, `${runLabel}-observations.json`), `${JSON.stringify(results, null, 2)}\n`);
console.log(JSON.stringify(results.map(result => ({ label: result.label, collectResponses: result.network.filter(item => item.phase === 'response' && item.url.includes('/api/collect')), tracker: result.initial?.tracker, forwardEvents: result.forward ? { pageswap: result.forward.pageswap, pagereveal: result.forward.pagereveal } : null, article: result.article, errors: result.forward?.errors || result.noJs })), null, 2));
chrome.kill("SIGTERM");
