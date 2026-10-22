import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { mkdtemp, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";
import WebSocket from "ws";

const root = resolve("artifacts/low-tech-audit-2026-09-24/staging-preview/.vercel/output/static");
const output = resolve("artifacts/low-tech-audit-2026-09-24/transition-filmstrips");
const port = 3114;
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".woff2": "font/woff2", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml" };

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://127.0.0.1:${port}`);
    let path = join(root, decodeURIComponent(url.pathname));
    if ((await stat(path)).isDirectory()) path = join(path, "index.html");
    const body = await readFile(path);
    response.writeHead(200, { "content-type": types[extname(path)] || "application/octet-stream", "cache-control": "max-age=600" });
    response.end(body);
  } catch {
    response.writeHead(404).end("Not found");
  }
});
await new Promise(resolvePromise => server.listen(port, "127.0.0.1", resolvePromise));

const profile = await mkdtemp(join(tmpdir(), "thinkinghaus-filmstrip-"));
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", "--remote-debugging-port=9341", `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "--disable-background-networking",
  "--disable-component-update", "--disable-extensions", "--disable-sync", "about:blank",
], { stdio: "ignore" });

for (let attempt = 0; attempt < 200; attempt += 1) {
  try { if ((await fetch("http://127.0.0.1:9341/json/version")).ok) break; } catch {}
  await new Promise(resolvePromise => setTimeout(resolvePromise, 50));
}

class Cdp {
  constructor(url) { this.socket = new WebSocket(url); this.id = 1; this.pending = new Map(); this.listeners = new Map(); }
  async open() { await new Promise((resolvePromise, reject) => { this.socket.once("open", resolvePromise); this.socket.once("error", reject); }); this.socket.on("message", raw => { const message = JSON.parse(String(raw)); if (message.id) { const pending = this.pending.get(message.id); if (!pending) return; this.pending.delete(message.id); message.error ? pending.reject(new Error(message.error.message)) : pending.resolve(message.result); return; } for (const listener of this.listeners.get(message.method) || []) listener(message.params); }); }
  send(method, params = {}) { const id = this.id++; return new Promise((resolvePromise, reject) => { this.pending.set(id, { resolve: resolvePromise, reject }); this.socket.send(JSON.stringify({ id, method, params })); }); }
  on(method, listener) { if (!this.listeners.has(method)) this.listeners.set(method, new Set()); this.listeners.get(method).add(listener); }
  once(method) { return new Promise(resolvePromise => { const listener = params => { this.listeners.get(method).delete(listener); resolvePromise(params); }; this.on(method, listener); }); }
  close() { this.socket.close(); }
}

async function navigate(cdp, url) {
  const loaded = cdp.once("Page.loadEventFired");
  await cdp.send("Page.navigate", { url });
  await loaded;
}

async function captureVariant(name) {
  const target = await (await fetch("http://127.0.0.1:9341/json/new?about:blank", { method: "PUT" })).json();
  const cdp = new Cdp(target.webSocketDebuggerUrl); await cdp.open();
  await Promise.all([cdp.send("Page.enable"), cdp.send("Runtime.enable"), cdp.send("Network.enable")]);
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1094, height: 633, deviceScaleFactor: 1, mobile: false });
  const home = `http://127.0.0.1:${port}/${name}/`;
  await navigate(cdp, home);
  await new Promise(resolvePromise => setTimeout(resolvePromise, 250));
  const destinationLoaded = cdp.once("Page.loadEventFired");
  await cdp.send("Runtime.evaluate", { expression: "document.querySelector('.post-list a').click()" });
  const directory = join(output, name); await mkdir(directory, { recursive: true });
  const frames = [];
  for (let index = 0; index < 22; index += 1) {
    const captured = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true });
    const path = join(directory, `frame-${String(index).padStart(2, "0")}.png`);
    await writeFile(path, Buffer.from(captured.data, "base64"));
    frames.push(path);
    await new Promise(resolvePromise => setTimeout(resolvePromise, 12));
  }
  await destinationLoaded;
  cdp.close();
  return frames;
}

const variants = ["diag-observed-inline", "diag-observed-early-canvas", "diag-observed-early-canvas-transition"];
const result = {};
for (const variant of variants) result[variant] = await captureVariant(variant);
await writeFile(join(output, "manifest.json"), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
chrome.kill("SIGTERM");
server.close();
