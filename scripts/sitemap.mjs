import { writeFile } from "node:fs/promises";
import path from "node:path";
import { generateSitemap } from "@mxpf/write-placid-core/site";
import { SITE_URL } from "../site-config.mjs";
import { projectRoot } from "./content.mjs";

export async function writeSitemap(posts, pages) {
  await writeFile(
    path.join(projectRoot, "public", "sitemap.xml"),
    generateSitemap(posts, pages, { siteUrl: SITE_URL }),
    "utf8",
  );
}
