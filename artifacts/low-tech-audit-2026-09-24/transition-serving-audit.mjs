import { createServer as createHttpServer } from "node:http";
import { createSecureServer } from "node:http2";
import { execFile, spawn } from "node:child_process";
import { mkdtemp, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join, normalize, resolve } from "node:path";
import WebSocket from "ws";

const root = resolve("artifacts/low-tech-audit-2026-09-24/static-first-prototype-v2");
const output = resolve("artifacts/low-tech-audit-2026-09-24/transition-serving-audit");
await mkdir(output, { recursive: true });
const temporary = await mkdtemp(join(tmpdir(), "thinkinghaus-h2-"));
const keyPath = join(temporary, "key.pem");
const certPath = join(temporary, "cert.pem");
await new Promise((resolvePromise, reject) => execFile("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-keyout", keyPath, "-out", certPath, "-days", "1", "-subj", "/CN=localhost", "-addext", "subjectAltName=DNS:localhost,IP:127.0.0.1"], (error) => error ? reject(error) : resolvePromise()));

const contentTypes = { ".css": "text/css; charset=utf-8", ".html": "text/html; charset=utf-8", ".js": "application/javascript; charset=utf-8", ".mjs": "application/javascript; charset=utf-8", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png" };
async function resource(pathname) {
  let requested = decodeURIComponent(pathname.split("?")[0]);
  const isolation = requested.match(/^\/(noscripts|no-enhancement|no-author|no-tracker)(\/.*)$/);
  const variant = isolation?.[1] || null;
  if (isolation) requested = isolation[2];
  if (requested.endsWith("/")) requested += "index.html";
  if (!extname(requested)) requested += ".html";
  const path = normalize(join(root, requested));
  if (!path.startsWith(root)) throw new Error("Invalid path");
  let [body, metadata] = await Promise.all([readFile(path), stat(path)]);
  if (variant && extname(path) === ".html") {
    let html = body.toString("utf8");
    if (variant === "noscripts") html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
    if (variant === "no-enhancement") html = html.replace(/<script\b[^>]*prototype-enhancements\.mjs[^>]*><\/script>/gi, "");
    if (variant === "no-author") html = html.replace(/<script\b[^>]*author-mode\.js[^>]*><\/script>/gi, "");
    if (variant === "no-tracker") html = html.replace(/<script\b[^>]*trackinghaus-alpha\.vercel\.app[^>]*><\/script>/gi, "");
    html = html.replace(/href="\/(?![_a-z-]+\/|\/)/g, `href="/${variant}/`);
    body = Buffer.from(html);
  }
  const hashed = requested.startsWith("/_next/static/");
  return { body, headers: { "access-control-allow-origin": "*", "cache-control": hashed ? "public, max-age=31536000, immutable" : "max-age=600", "content-length": String(body.length), "content-type": contentTypes[extname(path)] || "application/octet-stream", "last-modified": metadata.mtime.toUTCString(), "vary": "Accept-Encoding" } };
}

const http1 = createHttpServer(async (request, response) => {
  try { const result = await resource(new URL(request.url || "/", "http://localhost").pathname); response.writeHead(200, result.headers); response.end(result.body); }
  catch { response.writeHead(404).end("Not found"); }
});
await new Promise((resolvePromise) => http1.listen(4315, "127.0.0.1", resolvePromise));

const http2 = createSecureServer({ key: await readFile(keyPath), cert: await readFile(certPath), allowHTTP1: true });
http2.on("stream", async (stream, headers) => {
  try { const result = await resource(new URL(headers[":path"] || "/", "https://localhost").pathname); stream.respond({ ":status": 200, ...result.headers }); stream.end(result.body); }
  catch { stream.respond({ ":status": 404, "content-type": "text/plain" }); stream.end("Not found"); }
});
await new Promise((resolvePromise) => http2.listen(4316, "127.0.0.1", resolvePromise));

const profile = await mkdtemp(join(tmpdir(), "thinkinghaus-transition-serving-"));
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--remote-debugging-port=9335", `--user-data-dir=${profile}`, "--ignore-certificate-errors", "--no-first-run", "--no-default-browser-check", "--disable-background-networking", "--disable-component-update", "--disable-extensions", "--disable-sync", "about:blank"], { stdio: "ignore" });
for (let attempt = 0; attempt < 200; attempt += 1) { try { if ((await fetch("http://127.0.0.1:9335/json/version")).ok) break; } catch {} await new Promise((resolvePromise) => setTimeout(resolvePromise, 100)); if (attempt === 199) throw new Error("Chrome debugger did not start"); }

class Cdp {
  constructor(url) { this.socket = new WebSocket(url); this.id = 1; this.pending = new Map(); this.listeners = new Map(); }
  async open() { await new Promise((resolvePromise, reject) => { this.socket.once("open", resolvePromise); this.socket.once("error", reject); }); this.socket.on("message", raw => { const message=JSON.parse(String(raw)); if(message.id){const pending=this.pending.get(message.id); if(!pending)return; this.pending.delete(message.id); message.error?pending.reject(new Error(message.error.message)):pending.resolve(message.result); return;} for(const listener of this.listeners.get(message.method)||[])listener(message.params); }); }
  send(method,params={}){const id=this.id++; return new Promise((resolvePromise,reject)=>{this.pending.set(id,{resolve:resolvePromise,reject});this.socket.send(JSON.stringify({id,method,params}));});}
  on(method,listener){if(!this.listeners.has(method))this.listeners.set(method,new Set());this.listeners.get(method).add(listener);}
  once(method){return new Promise(resolvePromise=>{const listener=params=>{this.listeners.get(method).delete(listener);resolvePromise(params);};this.on(method,listener);});}
  close(){this.socket.close();}
}
async function evaluate(cdp,expression){const result=await cdp.send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.text);return result.result.value;}

const init = `(() => {
  const save = (name, event) => { const value={ at:performance.now(), hasViewTransition:!!event.viewTransition, activation:event.activation?{from:event.activation.from?.url||null,entry:event.activation.entry?.url||null,navigationType:event.activation.navigationType}:null }; window['__'+name]=value; try{sessionStorage.setItem('serving-'+name,JSON.stringify(value));}catch{} };
  addEventListener('pageswap',event=>save('pageswap',event)); addEventListener('pagereveal',event=>save('pagereveal',event));
  addEventListener('DOMContentLoaded',()=>{const start=performance.now();window.__intro=[];const tick=()=>{const first=document.querySelector('.post-list li');window.__intro.push({elapsed:performance.now()-start,opacity:first?getComputedStyle(first).opacity:null});if(performance.now()-start<300)requestAnimationFrame(tick);};requestAnimationFrame(tick);});
})();`;

async function run(name, base, width) {
  const target=await(await fetch("http://127.0.0.1:9335/json/new?about:blank",{method:"PUT"})).json();const cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.open();
  await Promise.all([cdp.send("Page.enable"),cdp.send("Runtime.enable"),cdp.send("Network.enable")]);await cdp.send("Network.setCacheDisabled",{cacheDisabled:true});await cdp.send("Network.setBlockedURLs",{urls:["*trackinghaus-alpha.vercel.app/api/collect*"]});await cdp.send("Emulation.setDeviceMetricsOverride",{width,height:width<768?844:1000,deviceScaleFactor:1,mobile:width<768});await cdp.send("Page.addScriptToEvaluateOnNewDocument",{source:init});
  const responses=[];cdp.on("Network.responseReceived",({response,type})=>{if(type==="Document"||type==="Stylesheet")responses.push({url:response.url,status:response.status,mimeType:response.mimeType,protocol:response.protocol,headers:response.headers});});
  let loaded=cdp.once("Page.loadEventFired");await cdp.send("Page.navigate",{url:`${base}/`});await loaded;await new Promise(r=>setTimeout(r,450));const initial=await evaluate(cdp,`({pagereveal:window.__pagereveal||null,intro:window.__intro||[],styleSheets:[...document.styleSheets].map(s=>s.href)})`);
  const before=responses.length;const selector=name.startsWith("minimal-")?"a":".post-list a";await evaluate(cdp,`document.querySelector(${JSON.stringify(selector)}).click()`);await new Promise(r=>setTimeout(r,650));const forward=await evaluate(cdp,`({url:location.href,pageswap:JSON.parse(sessionStorage.getItem('serving-pageswap')||'null'),pagereveal:window.__pagereveal||JSON.parse(sessionStorage.getItem('serving-pagereveal')||'null'),active:!!document.activeViewTransition,intro:window.__intro||[],animations:document.getAnimations({subtree:true}).map(a=>({name:a.animationName||'view-transition',pseudo:a.effect?.pseudoElement||null,currentTime:a.currentTime,playState:a.playState}))})`);
  const result={name,base,width,initial,forward,responses:responses.slice(before)};cdp.close();return result;
}

const origins=[["production","https://thinking.haus"],["prototype-http10","http://127.0.0.1:4314"],["prototype-http11","http://127.0.0.1:4315"],["prototype-h2","https://localhost:4316"],["minimal-http11","http://127.0.0.1:4315/vt-minimal"],["minimal-h2","https://localhost:4316/vt-minimal"],["noscripts-http11","http://127.0.0.1:4315/noscripts"],["no-enhancement-http11","http://127.0.0.1:4315/no-enhancement"],["no-author-http11","http://127.0.0.1:4315/no-author"],["no-tracker-http11","http://127.0.0.1:4315/no-tracker"]];
const results=[];for(const [name,base] of origins)for(const width of [1440,390])results.push(await run(`${name}-${width}`,base,width));
await writeFile(join(output,"serving-observations.json"),`${JSON.stringify(results,null,2)}\n`);
console.log(JSON.stringify(results.map(r=>({name:r.name,initialReveal:r.initial.pagereveal,firstIntro:r.initial.intro.slice(0,4),forward:r.forward,responses:r.responses.map(x=>({url:x.url,protocol:x.protocol,mimeType:x.mimeType,cacheControl:x.headers['cache-control']}))})),null,2));

chrome.kill("SIGTERM");http1.close();http2.close();
