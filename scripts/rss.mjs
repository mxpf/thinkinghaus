import { writeFile } from "node:fs/promises";
import path from "node:path";
import { generateRssFeed as generateCoreRssFeed } from "@mxpf/write-placid-core/site";
import { RSS_PATH, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "../site-config.mjs";
import { projectRoot } from "./content.mjs";

const feedOptions = {
  siteName: SITE_NAME,
  siteUrl: SITE_URL,
  description: SITE_DESCRIPTION,
  rssPath: RSS_PATH,
  feedId: "thinkinghaus",
};

export function generateRssFeed(posts, nowEntries = []) {
  return generateCoreRssFeed(posts, nowEntries, feedOptions);
}

export async function writeRssFeed(posts, nowEntries = []) {
  await writeFile(
    path.join(projectRoot, "public", path.basename(RSS_PATH)),
    generateRssFeed(posts, nowEntries),
    "utf8",
  );
}
