import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const source = resolve("artifacts/low-tech-audit-2026-09-24/static-first-prototype-v2");
const staging = resolve("artifacts/low-tech-audit-2026-09-24/staging-preview");
const output = join(staging, ".vercel", "output");
const published = join(output, "static");

await rm(staging, { recursive: true, force: true });
await mkdir(published, { recursive: true });
await cp(source, published, { recursive: true });

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

const trackerUrl = process.env.STAGING_TRACKER_URL?.trim();
const siteKey = process.env.STAGING_SITE_KEY?.trim();
const endpoint = process.env.STAGING_COLLECT_ENDPOINT?.trim();
const completeContract = trackerUrl && siteKey && endpoint;

for (const path of await htmlFiles(published)) {
  let html = await readFile(path, "utf8");
  html = html.replace(/<script\b[^>]*trackinghaus-alpha\.vercel\.app[^>]*><\/script>/gi, "");
  if (completeContract) {
    const tag = `<script defer src="${trackerUrl}" data-site="${siteKey}" data-endpoint="${endpoint}"></script>`;
    html = html.replace("</body>", `${tag}</body>`);
  } else {
    html = html.replace("</head>", '<meta name="trackinghaus-staging" content="disabled-pending-isolated-contract"/></head>');
  }
  await writeFile(path, html);
}

await writeFile(join(output, "config.json"), `${JSON.stringify({
  version: 3,
  routes: [
    { handle: "filesystem" },
    { src: "/", dest: "/index.html" },
    { src: "/(.+)", dest: "/$1.html", check: true },
  ],
}, null, 2)}\n`);

console.log(completeContract
  ? "Built staging preview with the supplied isolated Trackinghaus contract."
  : "Built safe bootstrap preview with Trackinghaus disabled pending an isolated contract.");
