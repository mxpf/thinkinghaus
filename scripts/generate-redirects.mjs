import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { readIdentityManifest, readPosts } from "./content.mjs";

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

export function redirectDocument(target) {
  const href = target;
  const escapedHref = escapeHtml(href);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="robots" content="noindex">
  <link rel="canonical" href="${escapedHref}">
  <meta http-equiv="refresh" content="0; url=${escapedHref}">
  <title>Moved · thinking.haus</title>
</head>
<body>
  <p>This page moved to <a href="${escapedHref}">${escapedHref}</a>.</p>
  <script>location.replace(${JSON.stringify(href)} + location.search + location.hash)</script>
</body>
</html>
`;
}

export async function writeRedirects(outputDirectory = path.resolve("dist/client")) {
  await readPosts();
  const manifest = await readIdentityManifest();
  let count = 0;
  await mkdir(outputDirectory, { recursive: true });
  for (const [alias, target] of Object.entries(manifest.redirects)) {
    await writeFile(
      path.join(outputDirectory, alias.slice(1)),
      redirectDocument(target),
      "utf8",
    );
    count += 1;
  }
  return count;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const count = await writeRedirects(process.argv[2] ? path.resolve(process.argv[2]) : undefined);
  console.log(`Generated ${count} permanent compatibility redirect${count === 1 ? "" : "s"}.`);
}
