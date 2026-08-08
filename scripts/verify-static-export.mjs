import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

const outputDirectory = path.resolve(process.argv[2] || "dist/client");
const missing = new Set();

async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const location = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await visit(location);
      continue;
    }
    if (!entry.name.endsWith(".html")) continue;

    const html = await readFile(location, "utf8");
    for (const match of html.matchAll(/(?:href|src)="(\/_next\/[^"?#]+)(?:[?#][^"]*)?"/g)) {
      const asset = path.join(outputDirectory, decodeURIComponent(match[1]).replace(/^\/+/, ""));
      try {
        await access(asset);
      } catch {
        missing.add(match[1]);
      }
    }
  }
}

await visit(outputDirectory);
if (missing.size) {
  throw new Error(`Static export references missing assets:\n${[...missing].join("\n")}`);
}

console.log("Static export asset references are complete.");
