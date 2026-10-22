import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const source = resolve("artifacts/low-tech-audit-2026-09-24/static-first-prototype-v2");
const published = resolve("artifacts/low-tech-audit-2026-09-24/staging-preview/.vercel/output/static");
const trackerUrl = "https://trackinghaus.vercel.app/tracker.js";
const endpoint = "https://trackinghaus.vercel.app/api/collect";
const siteKey = "thinkinghaus-low-js-staging";
const trackerSource = await (await fetch(trackerUrl)).text();

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(path));
    else if (extname(path) === ".html") files.push(path);
  }
  return files;
}

async function buildVariant(name, trackerMarkup, headMarkup = "", headStartMarkup = "") {
  const destination = join(published, name);
  await mkdir(destination, { recursive: true });
  await cp(source, destination, { recursive: true });
  for (const path of await htmlFiles(destination)) {
    let html = await readFile(path, "utf8");
    html = html.replace(/<script\b[^>]*trackinghaus-alpha\.vercel\.app[^>]*><\/script>/gi, "");
    html = html.replace(/href="\/(?![_a-z-]+\/|\/)/g, `href="/${name}/`);
    if (headStartMarkup) html = html.replace("<head>", `<head>${headStartMarkup}`);
    if (headMarkup) html = html.replace("</head>", `${headMarkup}</head>`);
    html = html.replace("</body>", `${trackerMarkup}</body>`);
    await writeFile(path, html);
  }
}

await buildVariant("diag-no-tracker", "");
await buildVariant("diag-remote-guarded", `<script>Object.defineProperty(navigator,"globalPrivacyControl",{value:true,configurable:true});</script><script defer src="${trackerUrl}" data-site="${siteKey}" data-endpoint="${endpoint}"></script>`);
await buildVariant("diag-local-tracker", `<script defer src="/diag-local-tracker/tracker.js" data-site="${siteKey}" data-endpoint="${endpoint}"></script>`);
await writeFile(join(published, "diag-local-tracker", "tracker.js"), trackerSource);
await buildVariant("diag-inline-vt", `<script defer src="${trackerUrl}" data-site="${siteKey}" data-endpoint="${endpoint}"></script>`, `<style>@media (prefers-reduced-motion:no-preference){@view-transition{navigation:auto}}</style>`);

const observer = `<script>(()=>{const key="thinkinghaus-vt-diagnostics";const read=()=>{try{return JSON.parse(sessionStorage.getItem(key)||"[]")}catch{return[]}};const persist=rows=>{const value=JSON.stringify(rows.slice(-100));sessionStorage.setItem(key,value);document.documentElement.setAttribute("data-vt-records",value)};const write=(kind,event)=>{const nav=performance.getEntriesByType("navigation")[0];const rootStyle=getComputedStyle(document.documentElement);const bodyStyle=document.body?getComputedStyle(document.body):null;const row={kind,at:performance.now(),url:location.href,viewTransition:!!event?.viewTransition,activation:event?.activation?{from:event.activation.from?.url||null,entry:event.activation.entry?.url||null,navigationType:event.activation.navigationType}:null,navigation:nav?{type:nav.type,redirectCount:nav.redirectCount,transferSize:nav.transferSize,activationStart:nav.activationStart,responseStart:nav.responseStart,domInteractive:nav.domInteractive}:null,inlineOptIn:[...document.querySelectorAll("style")].some(style=>(style.textContent||"").includes("@view-transition")),rootBackground:rootStyle.backgroundColor,bodyBackground:bodyStyle?.backgroundColor||null,colorScheme:rootStyle.colorScheme,visibility:document.visibilityState};const rows=read();rows.push(row);persist(rows);document.documentElement.setAttribute("data-vt-last",JSON.stringify(row))};addEventListener("pageswap",event=>write("pageswap",event));addEventListener("pagereveal",event=>write("pagereveal",event));addEventListener("pageshow",event=>write(event.persisted?"pageshow-bfcache":"pageshow",event));addEventListener("error",event=>{const rows=read();rows.push({kind:"error",url:location.href,message:String(event.error||event.message)});persist(rows)});write("bootstrap")})();</script>`;
const isolatedTracker = `<script defer src="${trackerUrl}" data-site="${siteKey}" data-endpoint="${endpoint}"></script>`;
await buildVariant("diag-observed-base", isolatedTracker, "", observer);
await buildVariant("diag-observed-inline", isolatedTracker, `<style>@media (prefers-reduced-motion:no-preference){@view-transition{navigation:auto}}</style>`, observer);
const earlyCanvas = `<style>:root{color-scheme:dark;background:#1a1814}html,body{background:#1a1814}@media (prefers-reduced-motion:no-preference){@view-transition{navigation:auto}}</style>`;
const earlyCanvasAndTransition = `<style>:root{color-scheme:dark;background:#1a1814}html,body{background:#1a1814}@media (prefers-reduced-motion:no-preference){@view-transition{navigation:auto}::view-transition{background:#1a1814}}</style>`;
await buildVariant("diag-observed-early-canvas", isolatedTracker, "", `${earlyCanvas}${observer}`);
await buildVariant("diag-observed-early-canvas-transition", isolatedTracker, "", `${earlyCanvasAndTransition}${observer}`);

console.log("Built tracker transition diagnostic variants.");
