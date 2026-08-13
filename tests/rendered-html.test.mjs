import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";
import { parseInlineMarkdown, stripInlineMarkdown } from "../app/inline-markdown.ts";
import { calculateReadingTime, parsePost, readPages, readPosts, serializePost } from "../scripts/content.mjs";
import { readPortfolioAbout, readPortfolioProjects } from "../scripts/portfolio-content.mjs";
import { generateRssFeed } from "../scripts/rss.mjs";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("renders the Thinkinghaus index from published Markdown", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  const posts = await readPosts();

  assert.match(html, /<title>Thinkinghaus<\/title>/i);
  assert.match(html, /class="letter-cascade is-in" aria-label="Thinkinghaus"/);
  for (const post of posts) assert.ok(html.includes(post.title));
  assert.match(html, /href="\/about"/);
  assert.match(html, /href="\/links"/);
  assert.match(html, /href="https:\/\/trackinghaus-alpha\.vercel\.app">Stats<\/a>/);
  assert.match(html, /href="\/rss\.xml" type="application\/rss\+xml">RSS<\/a>/);
  assert.ok(html.indexOf(">Stats</a>") < html.indexOf(">RSS</a>"));
  assert.match(
    html,
    /<link rel="alternate" type="application\/rss\+xml" href="https:\/\/thinking\.haus\/rss\.xml"/,
  );
  assert.match(html, /<link rel="canonical" href="https:\/\/thinking\.haus"/);
  assert.match(
    html,
    /<script[^>]+src="https:\/\/trackinghaus-alpha\.vercel\.app\/tracker\.js"[^>]+data-site="thinkinghaus"[^>]+data-endpoint="https:\/\/trackinghaus-alpha\.vercel\.app\/api\/collect"/,
  );
  assert.doesNotMatch(html, /Thinkinghaus Studio/);
});

test("static homepage links point directly to exported article files", async () => {
  const index = await readFile(new URL("../dist/client/index.html", import.meta.url), "utf8");
  const posts = await readPosts();

  for (const post of posts) {
    assert.match(index, new RegExp(`href="/${post.slug}\\.html"`));
  }
});

test("generates an RSS feed from published posts", async () => {
  const posts = await readPosts();
  const feed = generateRssFeed(posts);
  const generatedFeed = await readFile(new URL("../public/rss.xml", import.meta.url), "utf8");

  assert.equal(generatedFeed, feed);
  assert.match(feed, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(feed, /<rss version="2\.0"/);
  assert.match(
    feed,
    /<atom:link href="https:\/\/thinking\.haus\/rss\.xml" rel="self" type="application\/rss\+xml" \/>/,
  );
  assert.equal(feed.match(/<item>/g)?.length, posts.length);
  for (const post of posts) {
    assert.ok(feed.includes(`<link>https://thinking.haus/${post.slug}</link>`));
  }
  assert.match(feed, /<content:encoded><!\[CDATA\[<p>/);
  assert.match(feed, /<em>/);

  const drafts = (await readPosts({ includeDrafts: true }))
    .filter((post) => post.status === "draft");
  for (const draft of drafts) {
    assert.doesNotMatch(feed, new RegExp(`<link>https://thinking\\.haus/${draft.slug}</link>`));
  }

  const escaped = generateRssFeed([{
    title: "A & B",
    slug: "a-and-b",
    date: "2026-08-10",
    publishedAt: "2026-08-10T12:00:00.000Z",
    paragraphs: ["A *small* [link](https://example.com/?a=1&b=2)."],
  }]);
  assert.match(escaped, /<title>A &amp; B<\/title>/);
  assert.match(escaped, /<em>small<\/em>/);
  assert.match(escaped, /href="https:\/\/example\.com\/\?a=1&amp;b=2"/);
});

test("publishes crawlable canonical routes", async () => {
  const [robots, sitemap, posts, pages] = await Promise.all([
    readFile(new URL("../public/robots.txt", import.meta.url), "utf8"),
    readFile(new URL("../public/sitemap.xml", import.meta.url), "utf8"),
    readPosts(),
    readPages(),
  ]);

  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.match(robots, /^Sitemap: https:\/\/thinking\.haus\/sitemap\.xml$/m);
  assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(sitemap, /<loc>https:\/\/thinking\.haus\/about<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/thinking\.haus\/ai<\/loc>/);
  for (const { slug } of [...pages, ...posts]) {
    assert.ok(sitemap.includes(`<loc>https://thinking.haus/${slug}</loc>`));
  }
});

test("renders standalone About, AI, and Links pages", async () => {
  const pages = await readPages();
  assert.deepEqual(pages.map((page) => page.slug), ["about", "ai", "links"]);

  const aboutResponse = await render("/about");
  assert.equal(aboutResponse.status, 200);
  const aboutHtml = await aboutResponse.text();
  assert.match(aboutHtml, /<title>About — Thinkinghaus<\/title>/i);
  assert.match(aboutHtml, /<link rel="canonical" href="https:\/\/thinking\.haus\/about"/);
  assert.ok(aboutHtml.includes(pages.find((page) => page.slug === "about").paragraphs[0]));
  assert.match(aboutHtml, /href="\/ai"/);

  const aiResponse = await render("/ai");
  assert.equal(aiResponse.status, 200);
  const aiHtml = await aiResponse.text();
  assert.match(aiHtml, /<title>AI — Thinkinghaus<\/title>/i);
  assert.match(aiHtml, /<em>made with AI<\/em>/);
  assert.match(
    aiHtml,
    /href="https:\/\/www\.bydamo\.la\/p\/ai-manifesto" rel="noreferrer"/,
  );
  assert.doesNotMatch(aiHtml, /<nav[^>]*>[\s\S]*?>AI<\/a>/);

  const linksResponse = await render("/links");
  assert.equal(linksResponse.status, 200);
  assert.ok(
    (await linksResponse.text()).includes(
      pages.find((page) => page.slug === "links").paragraphs[0],
    ),
  );
});

test("keeps both publishing libraries readable and the studio local", async () => {
  const posts = await readPosts({ includeDrafts: true });
  const projects = await readPortfolioProjects();
  const about = await readPortfolioAbout();
  assert.ok(posts.length > 0);
  assert.equal(projects.length, 11);
  assert.ok(posts.every((post) => post.body.length > 0));
  assert.ok(posts.every((post) => /^[a-z0-9-]+$/.test(post.slug)));
  assert.ok(projects.every((project) => project.body.length > 0));
  assert.equal(about.slug, "about");
  assert.match(about.email, /@/);

  const studio = await readFile(new URL("../studio/index.html", import.meta.url), "utf8");
  assert.match(studio, /Publishing Studio/);
  assert.match(studio, /data-site="thinkinghaus"/);
  assert.match(studio, /data-site="portfolio"/);
  assert.match(studio, /Publish/);
  assert.match(studio, /id="delete-button"/);

  const [siteStyles, studioStyles, studioScript, articlePage] = await Promise.all([
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../studio/studio.css", import.meta.url), "utf8"),
    readFile(new URL("../studio/studio.js", import.meta.url), "utf8"),
    readFile(new URL("../app/[slug]/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(siteStyles, /--step-article-title/);
  assert.match(siteStyles, /--reading-measure: 56ch/);
  assert.match(siteStyles, /\.site\s*\{[^}]*font-size: 16px/s);
  assert.match(siteStyles, /:root\s*\{[^}]*--blog-background: #1c1c1a;[^}]*--blog-foreground: #eeede9;[^}]*color-scheme: dark;/s);
  assert.doesNotMatch(siteStyles, /prefers-color-scheme/);
  assert.match(siteStyles, /\.letter-cascade\s*\{[^}]*gap: 0;[^}]*letter-spacing: 0;/s);
  assert.match(siteStyles, /font-family: "Untitled Sans";[^}]*UntitledSansWeb-Regular\.woff2/s);
  assert.match(siteStyles, /font-family: "Untitled Sans";[^}]*UntitledSansWeb-RegularItalic\.woff[^}]*font-style: italic/s);
  assert.match(siteStyles, /font-family: "Untitled Sans";[^}]*TestUntitledSansWeb-Light\.woff2[^}]*font-weight: 300/s);
  assert.match(siteStyles, /font-family: "Untitled Sans";[^}]*TestUntitledSansWeb-LightItalic\.woff2[^}]*font-style: italic[^}]*font-weight: 300/s);
  assert.match(siteStyles, /font-family: "Untitled Sans";[^}]*TestUntitledSansWeb-Medium\.woff2[^}]*font-weight: 500/s);
  assert.match(siteStyles, /font-family: "Untitled Sans";[^}]*TestUntitledSansWeb-Bold\.woff2[^}]*font-weight: 700/s);
  assert.match(siteStyles, /\.site\s*\{[^}]*font-size: 16px[^}]*font-weight: 300[^}]*line-height: 24px/s);
  assert.match(siteStyles, /\.article-body em\s*\{[^}]*font-family: "Untitled Sans"[^}]*font-style: italic[^}]*font-weight: 300/s);
  assert.match(siteStyles, /\.site \.desktop-brand\s*\{[^}]*font-weight: 500/s);
  assert.match(siteStyles, /\.index-frame\s*\{[^}]*font-size: 16px[^}]*font-weight: 400[^}]*line-height: 24px/s);
  assert.doesNotMatch(siteStyles, /font-size:\s*15px/);
  assert.match(siteStyles, /\.site \.index-frame \.desktop-brand\s*\{[^}]*font-weight: 400/s);
  assert.match(siteStyles, /\.site \.post-list a\s*\{[^}]*font-weight: 400/s);
  assert.match(siteStyles, /\.site \.footer\s*\{[^}]*font-weight: 400/s);
  assert.match(siteStyles, /\.site \.footer-brand\s*\{[^}]*font-weight: 700/s);
  assert.doesNotMatch(`${siteStyles}${studioStyles}`, /Untitled Sans Italic/);
  assert.match(siteStyles, /\.site \.article-header h1\s*\{[^}]*font-size: 16px[^}]*font-weight: 500[^}]*line-height: 24px[^}]*text-wrap: balance/s);
  assert.match(siteStyles, /\.site \.article-header p\s*\{[^}]*font-size: 12px/s);
  assert.match(siteStyles, /\.article-body p\s*\{[^}]*hanging-punctuation: first[^}]*text-wrap: pretty/s);
  assert.match(siteStyles, /\.article-body p\.optical-margin-fallback\s*\{[^}]*text-indent: -0\.42em/s);
  assert.match(studioStyles, /--step-editor-title: clamp\(30px, 1\.5rem \+ 1\.5vw, 46px\)/);
  assert.match(studioStyles, /\.body-input\s*\{[^}]*font-size: 16px/s);
  assert.match(studioStyles, /\.preview-article\s*\{[^}]*font-size: 16px/s);
  assert.doesNotMatch(studioStyles, /font-size:\s*18px/);
  assert.match(studioStyles, /:root\s*\{[^}]*--paper: #1c1c1a;[^}]*--ink: #eeede9;[^}]*color-scheme: dark;/s);
  assert.doesNotMatch(studioStyles, /data-theme|theme-toggle/);
  assert.doesNotMatch(studioScript, /setTheme|toggleTheme|themeToggle/);
  assert.match(studioStyles, /\.preview-article p\s*\{[^}]*hanging-punctuation: first[^}]*text-wrap: pretty/s);
  assert.match(studioStyles, /\.preview-article\s*\{[^}]*font-size: 16px[^}]*font-weight: 300[^}]*line-height: 24px/s);
  assert.match(studioStyles, /\.preview-article h1\s*\{[^}]*font-size: 16px[^}]*font-weight: 500[^}]*line-height: 24px/s);
  assert.doesNotMatch(studioStyles, /\.preview-article header[^}]*font-weight: 300/s);
  assert.match(studioScript, /optical-margin-fallback/);
  assert.match(articlePage, /optical-margin-fallback/);
});

test("supports safe inline italics and links", async () => {
  assert.deepEqual(parseInlineMarkdown("A *strange* [path](https://example.com)."), [
    { type: "text", value: "A " },
    { type: "italic", value: "strange" },
    { type: "text", value: " " },
    { type: "link", value: "path", href: "https://example.com" },
    { type: "text", value: "." },
  ]);
  assert.equal(stripInlineMarkdown("A *strange* [path](https://example.com)."), "A strange path.");
  assert.equal(stripInlineMarkdown("A *[strange path](https://example.com)*."), "A strange path.");
  assert.equal(stripInlineMarkdown("A [*strange path*](https://example.com)."), "A strange path.");
  assert.deepEqual(parseInlineMarkdown("[No](javascript:alert(1))"), [
    { type: "text", value: "[No](javascript:alert(1)" },
    { type: "text", value: ")" },
  ]);

  const italicFont = await stat(
    new URL("../public/fonts/UntitledSansWeb-RegularItalic.woff", import.meta.url),
  );
  assert.equal(italicFont.size, 47346);
  const regularFont = await stat(
    new URL("../public/fonts/UntitledSansWeb-Regular.woff2", import.meta.url),
  );
  assert.equal(regularFont.size, 23275);
  const lightFont = await stat(
    new URL("../public/fonts/TestUntitledSansWeb-Light.woff2", import.meta.url),
  );
  assert.equal(lightFont.size, 5349);
  const lightItalicFont = await stat(
    new URL("../public/fonts/TestUntitledSansWeb-LightItalic.woff2", import.meta.url),
  );
  assert.equal(lightItalicFont.size, 5554);
  const mediumFont = await stat(
    new URL("../public/fonts/TestUntitledSansWeb-Medium.woff2", import.meta.url),
  );
  assert.equal(mediumFont.size, 9298);
  const boldFont = await stat(
    new URL("../public/fonts/TestUntitledSansWeb-Bold.woff2", import.meta.url),
  );
  assert.equal(boldFont.size, 9392);
});

test("calculates reading time and preserves draft status", () => {
  assert.equal(calculateReadingTime("word ".repeat(180)), "1 minute");
  assert.equal(calculateReadingTime("word ".repeat(181)), "2 minutes");
  assert.equal(
    calculateReadingTime("Read [this note](https://example.com/a/very/long/address) *slowly*."),
    "1 minute",
  );

  const draft = parsePost(serializePost({
    title: "A private thought",
    slug: "a-private-thought",
    date: "2026-08-06",
    status: "draft",
    body: "Not ready yet.",
  }));
  assert.equal(draft.status, "draft");
  assert.equal(draft.readingTime, "1 minute");
});
