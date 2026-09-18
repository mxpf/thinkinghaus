import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { redirectDocument as generateRedirectDocument } from "@mxpf/write-placid-core/site";
import { readIdentityManifest, readPosts } from "./content.mjs";

export function redirectDocument(target) {
  return generateRedirectDocument(target, { siteName: "thinking.haus" });
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
