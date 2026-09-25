import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

const source = resolve("dist/client");
const output = resolve("dist/public");

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

const hash = (buffer) => createHash("sha256").update(buffer).digest("hex");
const normalizeMarkup = (html) => html
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
  .replace(/<link\b[^>]*rel="modulepreload"[^>]*\/?>(?:\s*)/gi, "")
  .replace(/<style data-write-placid-static-shell>[\s\S]*?<\/style>/gi, "");
const tags = (html, pattern) => [...html.matchAll(pattern)].map((match) => match[0]);
const sourceFiles = await walk(source);
const outputFiles = await walk(output);
const failures = [];
const htmlResults = [];

for (const sourceFile of sourceFiles.filter((file) => file.endsWith(".html"))) {
  const path = relative(source, sourceFile);
  const outputFile = join(output, path);
  const [before, after] = await Promise.all([readFile(sourceFile, "utf8"), readFile(outputFile, "utf8")]);
  if (normalizeMarkup(before) !== normalizeMarkup(after)) failures.push(`${path}: non-script markup changed`);
  for (const [label, pattern] of [
    ["JSON-LD", /<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi],
    ["metadata", /<(?:meta|link)\b(?![^>]*rel="modulepreload")[^>]*>/gi],
  ]) {
    if (JSON.stringify(tags(before, pattern)) !== JSON.stringify(tags(after, pattern))) failures.push(`${path}: ${label} changed`);
  }
  const shellIndex = after.indexOf("data-write-placid-static-shell");
  const stylesheetIndex = after.indexOf('rel="stylesheet"');
  if (shellIndex < 0 || (stylesheetIndex >= 0 && shellIndex > stylesheetIndex)) failures.push(`${path}: early shell is not before stylesheet`);
  const required = [
    ":root{color-scheme:dark;background:#1a1814}",
    "html,body{background:#1a1814}",
    "@media (prefers-reduced-motion:no-preference){@view-transition{navigation:auto}}",
    "/write-placid-enhancements.mjs",
  ];
  if (before.includes("/author-mode.js")) required.push("/author-mode.js");
  if (before.includes("https://trackinghaus-alpha.vercel.app/tracker.js")) required.push(
    "https://trackinghaus-alpha.vercel.app/tracker.js",
    'data-site="thinkinghaus"',
    'data-endpoint="https://trackinghaus-alpha.vercel.app/api/collect"',
  );
  for (const value of required) if (!after.includes(value)) failures.push(`${path}: missing ${value}`);
  if (/::view-transition\s*\{[^}]*background/.test(after)) failures.push(`${path}: unexpected transition overlay background`);
  if (/_next\/static\/chunks|self\.__next_f|vinext\.navigationRuntime|rel="modulepreload"/.test(after)) failures.push(`${path}: framework runtime remains`);
  htmlResults.push(path);
}

const sourceByPath = new Map(sourceFiles.map((file) => [relative(source, file), file]));
const outputByPath = new Map(outputFiles.map((file) => [relative(output, file), file]));
for (const [path, sourceFile] of sourceByPath) {
  if (path.endsWith(".html") || path.endsWith(".rsc") || path.includes("_next/static/chunks")) continue;
  const outputFile = outputByPath.get(path);
  if (!outputFile) failures.push(`${path}: preserved asset missing`);
  else if (hash(await readFile(sourceFile)) !== hash(await readFile(outputFile))) failures.push(`${path}: preserved asset changed`);
}

const sum = async (files) => (await Promise.all(files.map(async (file) => (await stat(file)).size))).reduce((a, b) => a + b, 0);
const sourceBytes = await sum(sourceFiles);
const outputBytes = await sum(outputFiles);
const result = {
  htmlFiles: htmlResults.length,
  sourceFiles: sourceFiles.length,
  outputFiles: outputFiles.length,
  sourceBytes,
  outputBytes,
  reductionBytes: sourceBytes - outputBytes,
  reductionPercent: Number((((sourceBytes - outputBytes) / sourceBytes) * 100).toFixed(1)),
  failures,
};
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exitCode = 1;
