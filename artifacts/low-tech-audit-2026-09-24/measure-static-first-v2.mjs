import { createServer } from "node:http";
import { execFile, spawn } from "node:child_process";
import { mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join, normalize, resolve } from "node:path";
import { promisify } from "node:util";
import { brotliCompress } from "node:zlib";
import WebSocket from "ws";

const brotli = promisify(brotliCompress);
const root = resolve("artifacts/low-tech-audit-2026-09-24/static-first-prototype-v2");
const resultsDirectory = resolve("artifacts/low-tech-audit-2026-09-24/static-first-v2-results");
await execFileAsync("mkdir", ["-p", resultsDirectory]);

function execFileAsync(command, args) {
  return new Promise((resolvePromise, reject) => {
    execFile(command, args, (error, stdout, stderr) => error ? reject(error) : resolvePromise({ stdout, stderr }));
  });
}

const mime = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".xml": "application/xml; charset=utf-8",
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === "/") pathname = "/index.html";
    if (!extname(pathname)) pathname += ".html";
    const file = normalize(join(root, pathname));
    if (!file.startsWith(root)) throw new Error("Invalid path");
    const body = await readFile(file);
    const type = mime[extname(file)] || "application/octet-stream";
    const compressible = /^(text\/|application\/(?:json|xml))/.test(type);
    const payload = compressible ? await brotli(body) : body;
    const headers = {
      "Cache-Control": "no-store",
      "Content-Length": payload.length,
      "Content-Security-Policy": "connect-src 'none'; default-src 'self' https://trackinghaus-alpha.vercel.app; font-src 'self'; img-src 'self' data:; script-src 'self' https://trackinghaus-alpha.vercel.app; style-src 'self' 'unsafe-inline'",
      "Content-Type": type,
    };
    if (compressible) headers["Content-Encoding"] = "br";
    response.writeHead(200, headers);
    response.end(payload);
  } catch {
    response.writeHead(404).end("Not found");
  }
});
await new Promise((resolvePromise) => server.listen(4314, "127.0.0.1", resolvePromise));

const profile = await mkdtemp(join(tmpdir(), "thinkinghaus-static-first-"));
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new",
  "--remote-debugging-port=9333",
  `--user-data-dir=${profile}`,
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-background-networking",
  "--disable-component-update",
  "--disable-extensions",
  "--disable-sync",
  "--metrics-recording-only",
  "about:blank",
], { stdio: "ignore" });

async function waitForDebugger() {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    try {
      const response = await fetch("http://127.0.0.1:9333/json/version");
      if (response.ok) return;
    } catch {}
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
  }
  throw new Error("Chrome debugger did not start");
}
await waitForDebugger();

class Cdp {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
  }
  async open() {
    await new Promise((resolvePromise, reject) => {
      this.socket.once("open", resolvePromise);
      this.socket.once("error", reject);
    });
    this.socket.on("message", (raw) => {
      const message = JSON.parse(String(raw));
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
        return;
      }
      for (const listener of this.listeners.get(message.method) || []) listener(message.params);
    });
  }
  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolvePromise, reject) => {
      this.pending.set(id, { resolve: resolvePromise, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  once(method) {
    return new Promise((resolvePromise) => {
      const listener = (params) => {
        this.listeners.get(method).delete(listener);
        resolvePromise(params);
      };
      if (!this.listeners.has(method)) this.listeners.set(method, new Set());
      this.listeners.get(method).add(listener);
    });
  }
  on(method, listener) {
    if (!this.listeners.has(method)) this.listeners.set(method, new Set());
    this.listeners.get(method).add(listener);
  }
  close() { this.socket.close(); }
}

async function newClient() {
  const target = await (await fetch("http://127.0.0.1:9333/json/new?about:blank", { method: "PUT" })).json();
  const client = new Cdp(target.webSocketDebuggerUrl);
  await client.open();
  await Promise.all([client.send("Page.enable"), client.send("Runtime.enable"), client.send("Network.enable")]);
  await client.send("Network.setCacheDisabled", { cacheDisabled: true });
  await client.send("Network.setBlockedURLs", { urls: ["*trackinghaus-alpha.vercel.app/api/collect*"] });
  return client;
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function measure({ name, url, width = 1440, height = 1000, javascript = true, reducedMotion = false, observerFailure = false, screenshot = false, scrollChecks = false }) {
  const client = await newClient();
  const requests = new Map();
  const failures = [];
  const consoleErrors = [];
  client.on("Network.requestWillBeSent", ({ requestId, request, type }) => requests.set(requestId, { url: request.url, type, bytes: 0 }));
  client.on("Network.loadingFinished", ({ requestId, encodedDataLength }) => {
    const request = requests.get(requestId);
    if (request) request.bytes = encodedDataLength;
  });
  client.on("Network.loadingFailed", ({ requestId, errorText, blockedReason }) => {
    const request = requests.get(requestId);
    if (request?.url.includes("/api/collect")) return;
    failures.push({ url: request?.url, errorText, blockedReason });
  });
  client.on("Runtime.exceptionThrown", ({ exceptionDetails }) => consoleErrors.push(exceptionDetails.text));
  await client.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 768 });
  await client.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: reducedMotion ? "reduce" : "no-preference" }] });
  if (!javascript) await client.send("Emulation.setScriptExecutionDisabled", { value: true });
  if (observerFailure) {
    await client.send("Page.addScriptToEvaluateOnNewDocument", { source: "globalThis.IntersectionObserver = class { constructor() { throw new Error('prototype observer failure'); } };" });
  }
  const loaded = client.once("Page.loadEventFired");
  await client.send("Page.navigate", { url });
  await loaded;
  await evaluate(client, `(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].filter(image => image.currentSrc).map(image => image.complete ? null : new Promise(resolve => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', resolve, { once: true });
    })));
    return true;
  })()`);
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 300));
  const state = await evaluate(client, `(() => {
    const image = document.querySelector('.article-image');
    const footer = document.querySelector('.footer--end-reveal');
    const edit = document.querySelector('.author-edit-action');
    return {
      title: document.title,
      textLength: document.body.innerText.length,
      links: document.links.length,
      image: image ? { active: image.hasAttribute('data-scroll-fade-active'), opacity: getComputedStyle(image).opacity, value: image.style.getPropertyValue('--article-image-opacity') } : null,
      progress: document.querySelector('.scroll-progress') ? getComputedStyle(document.querySelector('.scroll-progress')).transform : null,
      footer: footer ? { armed: footer.classList.contains('is-armed'), revealed: footer.classList.contains('is-revealed') } : null,
      editVisible: edit ? !edit.hidden : null,
      trackerContract: [...document.scripts].some(script => script.src === 'https://trackinghaus-alpha.vercel.app/tracker.js' && script.dataset.site === 'thinkinghaus' && script.dataset.endpoint === 'https://trackinghaus-alpha.vercel.app/api/collect'),
      typographyGuarded: document.body.innerText.includes('screen‑time') || document.body.innerText.includes('decision‑making'),
    };
  })()`);
  if (screenshot) {
    const capture = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    await writeFile(join(resultsDirectory, `${name}.png`), Buffer.from(capture.data, "base64"));
  }
  let scrollState = null;
  if (scrollChecks) {
    scrollState = {};
    for (const [step, expression] of [
      ["threshold", `window.scrollTo(0, document.querySelector('.article-image').offsetTop - (window.innerHeight / 3))`],
      ["past", `window.scrollTo(0, document.querySelector('.article-image').offsetTop + document.querySelector('.article-image').offsetHeight + 100)`],
      ["reverse", `window.scrollTo(0, document.querySelector('.article-image').offsetTop - (window.innerHeight / 3))`],
      ["end", `window.scrollTo(0, document.documentElement.scrollHeight)`],
    ]) {
      await evaluate(client, expression);
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
      scrollState[step] = await evaluate(client, `(() => {
        const image = document.querySelector('.article-image');
        const footer = document.querySelector('.footer--end-reveal');
        return {
          scrollY: window.scrollY,
          imageOpacity: image ? getComputedStyle(image).opacity : null,
          progress: document.querySelector('.scroll-progress') ? getComputedStyle(document.querySelector('.scroll-progress')).transform : null,
          footerRevealed: footer?.classList.contains('is-revealed') || false,
        };
      })()`);
    }
  }
  const records = [...requests.values()].filter((request) => !request.url.startsWith("data:"));
  const result = {
    name,
    url,
    viewport: { width, height },
    javascript,
    reducedMotion,
    requestCount: records.length,
    transferredBytes: Math.round(records.reduce((sum, request) => sum + request.bytes, 0)),
    javascriptBytes: Math.round(records.filter((request) => /(?:\.m?js(?:\?|$)|tracker\.js)/.test(request.url)).reduce((sum, request) => sum + request.bytes, 0)),
    failedRequests: failures,
    consoleErrors,
    resources: records.map(({ url: resourceUrl, type, bytes }) => ({ url: resourceUrl, type, bytes })).sort((a, b) => b.bytes - a.bytes),
    state,
    scrollState,
  };
  client.close();
  return result;
}

const pagePaths = ["/", "/over-the-loop.html", "/deep-minimal.html"];
const results = [];
for (const [index, path] of pagePaths.entries()) {
  const slug = index === 0 ? "home" : path.split("/").pop().replace(".html", "");
  results.push(await measure({ name: `live-${slug}`, url: `https://thinking.haus${path}`, scrollChecks: slug === "deep-minimal" }));
  results.push(await measure({ name: `prototype-${slug}`, url: `http://127.0.0.1:4314${path}`, screenshot: slug === "home" || slug === "deep-minimal", scrollChecks: slug === "deep-minimal" }));
}
results.push(await measure({ name: "prototype-home-mobile", url: "http://127.0.0.1:4314/", width: 390, height: 844, screenshot: true }));
results.push(await measure({ name: "prototype-deep-minimal-mobile", url: "http://127.0.0.1:4314/deep-minimal.html", width: 390, height: 844, screenshot: true }));
results.push(await measure({ name: "prototype-deep-minimal-nojs", url: "http://127.0.0.1:4314/deep-minimal.html", javascript: false }));
results.push(await measure({ name: "prototype-deep-minimal-reduced", url: "http://127.0.0.1:4314/deep-minimal.html", reducedMotion: true }));
results.push(await measure({ name: "prototype-deep-minimal-observer-failure", url: "http://127.0.0.1:4314/deep-minimal.html", observerFailure: true }));
results.push(await measure({ name: "prototype-deep-minimal-author", url: "http://127.0.0.1:4314/deep-minimal.html#edit" }));

await writeFile(join(resultsDirectory, "measurements.json"), `${JSON.stringify(results, null, 2)}\n`);
console.log(JSON.stringify(results.map(({ name, requestCount, transferredBytes, javascriptBytes, state, failedRequests, consoleErrors }) => ({ name, requestCount, transferredBytes, javascriptBytes, state, failures: failedRequests.length, errors: consoleErrors.length })), null, 2));

server.close();
chrome.kill("SIGTERM");
