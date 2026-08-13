import { writeFile } from "node:fs/promises";
import path from "node:path";
import { projectRoot } from "./content.mjs";

const siteUrl = "https://thinking.haus";

function generateSitemap(posts, pages) {
  const paths = [
    "/",
    "/now",
    ...pages.map(({ slug }) => `/${slug}`),
    ...posts.map(({ slug }) => `/${slug}`),
  ];

  const urls = paths
    .map((pathname) => `  <url><loc>${new URL(pathname, siteUrl).href}</loc></url>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export async function writeSitemap(posts, pages) {
  await writeFile(
    path.join(projectRoot, "public", "sitemap.xml"),
    generateSitemap(posts, pages),
    "utf8",
  );
}
