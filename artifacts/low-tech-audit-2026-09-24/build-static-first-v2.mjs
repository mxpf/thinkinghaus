import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repository = resolve(here, "../..");
const source = join(repository, "dist/client");
const output = join(here, "static-first-prototype-v2");
const sharedScrollFade = join(
  repository,
  "node_modules/@mxpf/write-placid-core/packages/core/site/scroll-fade.mjs",
);

await rm(output, { force: true, recursive: true });
await cp(source, output, { recursive: true });

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

const files = await walk(output);
for (const file of files) {
  if (file.endsWith(".rsc") || file.includes(`${join("_next", "static", "chunks")}`)) {
    await rm(file, { force: true });
  }
}

const scripts = [
  '<script type="module" src="/prototype-enhancements.mjs"></script>',
  '<script defer src="/author-mode.js"></script>',
  '<script defer src="https://trackinghaus-alpha.vercel.app/tracker.js" data-site="thinkinghaus" data-endpoint="https://trackinghaus-alpha.vercel.app/api/collect"></script>',
].join("");

for (const file of files.filter((path) => path.endsWith(".html"))) {
  const sourceHtml = await readFile(file, "utf8");
  const jsonLd = [];
  let html = sourceHtml.replace(
    /<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi,
    (match) => `__TH_JSON_LD_${jsonLd.push(match) - 1}__`,
  );
  html = html
    .replace(/<link\b[^>]*rel="modulepreload"[^>]*\/?>(?:\s*)/gi, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/__TH_JSON_LD_(\d+)__/g, (_, index) => jsonLd[Number(index)])
    .replace("</body>", `${scripts}</body>`);
  await writeFile(file, html);
}

await cp(sharedScrollFade, join(output, "write-placid-scroll-fade-v1.4.0.mjs"));
await cp(join(here, "prototype-enhancements.mjs"), join(output, "prototype-enhancements.mjs"));

const kept = (await walk(output)).map((path) => relative(output, path));
const moduleChunks = kept.filter((path) => path.includes("_next/static/chunks"));
if (moduleChunks.length) throw new Error(`Unexpected framework chunks remain: ${moduleChunks.join(", ")}`);

for (const file of kept.filter((path) => path.endsWith(".html"))) {
  const html = await readFile(join(output, file), "utf8");
  if (/vinext|_R_|bootstrap\.rsc|type="module" async/.test(html)) {
    throw new Error(`Framework bootstrap remains in ${file}`);
  }
  for (const required of [
    "/prototype-enhancements.mjs",
    "/author-mode.js",
    "https://trackinghaus-alpha.vercel.app/tracker.js",
    'data-site="thinkinghaus"',
    'data-endpoint="https://trackinghaus-alpha.vercel.app/api/collect"',
  ]) {
    if (!html.includes(required)) throw new Error(`${basename(file)} is missing ${required}`);
  }
}

console.log(`Built ${output}`);
