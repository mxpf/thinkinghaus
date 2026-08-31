import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { parseContentBlocks, parseInlineMarkdown, stripInlineMarkdown } from "../lib/markdown.mjs";
import { calculateReadingTime, comparePostsByDate, parsePost, readNowEntries, readPages, readPosts, serializePost } from "../scripts/content.mjs";
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

test("renders the thinking.haus index from published Markdown", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  const posts = await readPosts();

  assert.match(html, /<title>thinking\.haus<\/title>/);
  assert.match(html, /class="letter-cascade is-in" aria-label="thinking\.haus"/);
  for (const post of posts) assert.ok(html.includes(post.title));
  assert.match(html, /href="\/about"/);
  assert.match(html, /href="https:\/\/maxpfennig\.haus\/" rel="me">Work<\/a>/);
  assert.match(html, /href="\/links"/);
  assert.match(html, /href="\/now"/);
  assert.match(html, /href="https:\/\/trackinghaus-alpha\.vercel\.app">Stats<\/a>/);
  assert.match(html, /href="\/rss\.xml" type="application\/rss\+xml">RSS<\/a>/);
  assert.ok(html.indexOf(">Stats</a>") < html.indexOf(">RSS</a>"));
  assert.ok(html.indexOf(">Links</a>") < html.indexOf(">Now</a>"));
  assert.ok(html.indexOf(">Now</a>") < html.indexOf(">Stats</a>"));
  assert.match(
    html,
    /<link rel="alternate" type="application\/rss\+xml" href="https:\/\/thinking\.haus\/rss\.xml"/,
  );
  assert.match(
    html,
    /<link rel="webmention" href="https:\/\/webmention\.io\/thinking\.haus\/webmention"/,
  );
  assert.match(html, /<link rel="me" href="https:\/\/github\.com\/mxpf"/);
  assert.match(html, /<link rel="canonical" href="https:\/\/thinking\.haus"/);
  assert.match(html, /<meta property="og:image" content="https:\/\/thinking\.haus\/og\.png"/);
  assert.match(html, /<meta name="application-name" content="thinking\.haus"/);
  assert.match(html, /<meta property="og:site_name" content="thinking\.haus"/);
  assert.match(html, /<meta property="og:title" content="thinking\.haus"/);
  assert.match(html, /<meta name="twitter:image" content="https:\/\/thinking\.haus\/og\.png"/);
  assert.match(html, /<meta name="twitter:title" content="thinking\.haus"/);
  assert.match(
    html,
    /<script[^>]+src="https:\/\/trackinghaus-alpha\.vercel\.app\/tracker\.js"[^>]+data-site="thinkinghaus"[^>]+data-endpoint="https:\/\/trackinghaus-alpha\.vercel\.app\/api\/collect"/,
  );
  assert.match(html, /<script[^>]+src="\/author-mode\.js"/);
  assert.doesNotMatch(html, />Mentioned by</);
  assert.match(html, /<meta name="author" content="Max Pfennighaus"/);
  assert.match(html, /<meta name="creator" content="Max Pfennighaus"/);
  assert.match(html, /<meta name="publisher" content="Max Pfennighaus"/);
  assert.match(html, /<script type="application\/ld\+json">[^<]*"@type":"Person"/);
  assert.match(html, /<script type="application\/ld\+json">[^<]*"@type":"WebSite"[^<]*"name":"thinking\.haus"/);
  assert.doesNotMatch(html, /Thinkinghaus Studio/);
});

test("omits the visible author byline from published notes", async () => {
  const post = (await readPosts())[0];
  const response = await render(`/${post.slug}`);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.doesNotMatch(html, /By <a href="https:\/\/maxpfennig\.haus\/" rel="author">/);
  assert.match(html, /<meta property="og:image" content="https:\/\/thinking\.haus\/og\.png"/);
  assert.match(html, /<meta name="twitter:image" content="https:\/\/thinking\.haus\/og\.png"/);
  assert.match(html, /class="scroll-progress"/);
});

test("static homepage links point directly to exported article files", async () => {
  const index = await readFile(new URL("../dist/client/index.html", import.meta.url), "utf8");
  const posts = await readPosts();

  for (const post of posts) {
    assert.match(index, new RegExp(`href="/${post.slug}\\.html"`));
  }
});

test("keeps edit controls private until author mode is activated", async () => {
  const source = await readFile(new URL("../public/author-mode.js", import.meta.url), "utf8");

  function runAuthorMode(hash, stored = null) {
    const values = new Map(stored ? [["thinkinghaus-author-mode", stored]] : []);
    const link = { href: "" };
    const action = { hidden: true, querySelector: () => link };
    const article = {
      dataset: { contentSlug: "where-the-work-is", contentTitle: "Where the work is" },
      querySelector: () => action,
    };
    const window = {
      location: { hash, pathname: "/where-the-work-is.html", search: "" },
      history: { replaceState() {} },
      localStorage: {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
        removeItem: (key) => values.delete(key),
      },
    };
    vm.runInNewContext(source, {
      URL,
      window,
      document: { querySelector: () => article },
    });
    return { action, link, values };
  }

  assert.equal(runAuthorMode("").action.hidden, true);

  const activated = runAuthorMode("#edit");
  assert.equal(activated.action.hidden, false);
  assert.equal(activated.values.get("thinkinghaus-author-mode"), "on");
  assert.match(activated.link.href, /[?&]slug=where-the-work-is/);
  assert.match(activated.link.href, /[?&]title=Where(?:\+|%20)the(?:\+|%20)work(?:\+|%20)is/);

  assert.equal(runAuthorMode("", "on").action.hidden, false);
  assert.equal(runAuthorMode("#edit-off", "on").action.hidden, true);
});

test("generates an RSS feed from published posts", async () => {
  const posts = await readPosts();
  const nowEntries = await readNowEntries();
  const feed = generateRssFeed(posts, nowEntries);
  const generatedFeed = await readFile(new URL("../public/rss.xml", import.meta.url), "utf8");

  assert.equal(generatedFeed, feed);
  assert.match(feed, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(feed, /<rss version="2\.0"/);
  assert.match(feed, /<channel>\s*<title>thinking\.haus<\/title>/);
  assert.match(
    feed,
    /<atom:link href="https:\/\/thinking\.haus\/rss\.xml" rel="self" type="application\/rss\+xml" \/>/,
  );
  assert.equal(feed.match(/<item>/g)?.length, posts.length + nowEntries.length);
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

  const withNow = generateRssFeed([], [{
    type: "now",
    title: "Now",
    slug: "now-20260813150000",
    date: "2026-08-13",
    publishedAt: "2026-08-13T15:00:00.000Z",
    paragraphs: ["A small current note."],
  }]);
  assert.match(withNow, /<title>Now — August 13, 2026<\/title>/);
  assert.match(withNow, /<link>https:\/\/thinking\.haus\/now<\/link>/);
  assert.match(withNow, /<guid isPermaLink="false">thinkinghaus:now:now-20260813150000<\/guid>/);
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
  assert.match(sitemap, /<loc>https:\/\/thinking\.haus\/now<\/loc>/);
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
  assert.match(aboutHtml, /<title>thinking\.haus - About<\/title>/);
  assert.match(aboutHtml, /<link rel="canonical" href="https:\/\/thinking\.haus\/about"/);
  assert.ok(aboutHtml.includes(pages.find((page) => page.slug === "about").paragraphs[0]));
  assert.match(aboutHtml, /href="\/ai"/);
  assert.match(aboutHtml, /href="https:\/\/maxpfennig\.haus\/"[^>]*>My professional work lives at maxpfennig\.haus\.<\/a>/);
  assert.doesNotMatch(aboutHtml, /class="scroll-progress"/);

  const aiResponse = await render("/ai");
  assert.equal(aiResponse.status, 200);
  const aiHtml = await aiResponse.text();
  assert.match(aiHtml, /<title>thinking\.haus - AI<\/title>/);
  assert.match(aiHtml, /<em>made with AI<\/em>/);
  assert.match(
    aiHtml,
    /href="https:\/\/www\.bydamo\.la\/p\/ai-manifesto" rel="noreferrer"/,
  );
  assert.doesNotMatch(aiHtml, /I was here\./);
  assert.doesNotMatch(aiHtml, /<nav[^>]*>[\s\S]*?>AI<\/a>/);

  const linksResponse = await render("/links");
  assert.equal(linksResponse.status, 200);
  assert.ok(
    (await linksResponse.text()).includes(
      pages.find((page) => page.slug === "links").paragraphs[0],
    ),
  );
});

test("renders only the newest published Now entry on its stable route", async () => {
  const response = await render("/now");
  assert.equal(response.status, 200);
  const html = await response.text();
  const entries = await readNowEntries();
  assert.match(html, /<title>thinking\.haus - Now<\/title>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/thinking\.haus\/now"/);
  assert.doesNotMatch(html, /class="scroll-progress"/);
  if (entries[0]) {
    assert.ok(html.includes(entries[0].paragraphs[0]));
    assert.match(html, /<ul class="article-list"><li>Reading <a href="https:\/\/pushkinpress\.com\/book\/strange-houses\/"/);
    assert.equal((html.match(/<li>/g) ?? []).length, 4);
    assert.doesNotMatch(html, /<p>- Reading/);
    assert.match(html, /href="https:\/\/sive\.rs\/nowff"[^>]*>Derek Sivers(?:&apos;|&#x27;|') \/now idea<\/a>/);
    assert.match(html, /a simple page for what (?:you(?:&apos;|&#x27;|')re|you’re) actually paying attention to right now\./);
    for (const archived of entries.slice(1)) {
      assert.ok(!html.includes(archived.paragraphs[0]));
    }
  } else {
    assert.match(html, /Nothing here yet\./);
  }
});

test("keeps published writing readable and the visual system intentional", async () => {
  const posts = await readPosts({ includeDrafts: true });
  assert.ok(posts.length > 0);
  assert.ok(posts.every((post) => post.body.length > 0));
  assert.ok(posts.every((post) => /^[a-z0-9-]+$/.test(post.slug)));

  const [siteStyles, articleBody, articlePage, authorEditAction, authorMode, scrollProgress] = await Promise.all([
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/ArticleBody.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/AuthorEditAction.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/author-mode.js", import.meta.url), "utf8"),
    readFile(new URL("../app/ScrollProgress.tsx", import.meta.url), "utf8"),
  ]);
  const typographyGuards = await readFile(new URL("../app/TypographyGuards.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(siteStyles, /--step-article-title/);
  assert.doesNotMatch(siteStyles, /--reading-measure/);
  assert.match(siteStyles, /\.site\s*\{[^}]*font-size: 16px/s);
  assert.match(siteStyles, /:root\s*\{[^}]*--blog-background: #1a1814;[^}]*--blog-foreground: #f1ede3;[^}]*--blog-muted: #9a9285;[^}]*--blog-body: #b3aca2;[^}]*color-scheme: dark;/s);
  assert.doesNotMatch(siteStyles, /prefers-color-scheme/);
  assert.match(siteStyles, /\.letter-cascade\s*\{[^}]*gap: 0;[^}]*letter-spacing: 0;/s);
  assert.match(siteStyles, /font-family: "Untitled Sans";[^}]*UntitledSansWeb-Regular\.woff2/s);
  assert.match(siteStyles, /font-family: "Untitled Sans";[^}]*UntitledSansWeb-RegularItalic\.woff[^}]*font-style: italic/s);
  assert.match(siteStyles, /font-family: "Untitled Sans";[^}]*TestUntitledSansWeb-Light\.woff2[^}]*font-weight: 300/s);
  assert.match(siteStyles, /font-family: "Untitled Sans";[^}]*TestUntitledSansWeb-LightItalic\.woff2[^}]*font-style: italic[^}]*font-weight: 300/s);
  assert.match(siteStyles, /font-family: "Untitled Sans";[^}]*TestUntitledSansWeb-Medium\.woff2[^}]*font-weight: 500/s);
  assert.match(siteStyles, /font-family: "Untitled Sans";[^}]*TestUntitledSansWeb-Bold\.woff2[^}]*font-weight: 700/s);
  assert.match(siteStyles, /\.site\s*\{[^}]*font-size: 16px[^}]*font-weight: 300[^}]*line-height: 24px/s);
  assert.match(siteStyles, /\.article-body em\s*\{[^}]*font-style: italic[^}]*font-weight: 400/s);
  assert.match(siteStyles, /\.site \.desktop-brand\s*\{[^}]*font-weight: 400/s);
  assert.match(siteStyles, /\.scroll-progress\s*\{[^}]*position: fixed[^}]*inset: 0 0 auto[^}]*height: 1px[^}]*background: var\(--blog-body\)[^}]*transform: scaleX\(var\(--scroll-progress\)\)[^}]*transform-origin: left/s);
  assert.match(siteStyles, /html\s*\{[^}]*scrollbar-width: none/s);
  assert.match(siteStyles, /html::-webkit-scrollbar\s*\{[^}]*display: none/s);
  assert.match(siteStyles, /\.index-frame,\s*\.article-frame\s*\{[^}]*grid-template-columns: minmax\(0, 38fr\) minmax\(0, 62fr\)/s);
  assert.match(siteStyles, /\.article-column\s*\{[^}]*width: 62%;[^}]*min-height: calc\(100svh - 48px\)/s);
  assert.match(siteStyles, /\.index-frame\s*\{[^}]*font-weight: 400/s);
  assert.doesNotMatch(siteStyles, /font-size:\s*15px/);
  assert.match(siteStyles, /\.site \.post-list a\s*\{[^}]*font-weight: 400/s);
  assert.match(siteStyles, /\.site \.footer\s*\{[^}]*font-weight: 400/s);
  assert.match(siteStyles, /\.site \.footer-brand\s*\{[^}]*font-weight: 400/s);
  assert.doesNotMatch(siteStyles, /Untitled Sans Italic/);
  assert.match(siteStyles, /\.site \.article-header h1\s*\{[^}]*font-size: 16px[^}]*font-weight: 400[^}]*line-height: 24px[^}]*text-wrap: balance/s);
  assert.match(siteStyles, /\.article-body p\s*\{[^}]*hanging-punctuation: first[^}]*text-wrap: pretty/s);
  assert.match(siteStyles, /\.article-body\s*\{[^}]*color: var\(--blog-body\)[^}]*font-weight: 400/s);
  assert.match(siteStyles, /@media \(max-width: 767px\)[\s\S]*\.site\s*\{[^}]*font-size: 18px[^}]*line-height: 28px/s);
  assert.match(siteStyles, /@media \(max-width: 767px\)[\s\S]*\.post-list li\s*\{[^}]*min-height: 56px/s);
  assert.match(siteStyles, /@media \(max-width: 767px\)[\s\S]*\.site \.article-header h1\s*\{[^}]*font-size: 18px[^}]*line-height: 28px/s);
  assert.match(siteStyles, /\.article-body a\s*\{[^}]*transition: color 160ms ease/s);
  assert.match(siteStyles, /\.article-body a:hover,\s*\.article-body a:focus-visible\s*\{[^}]*color: var\(--blog-foreground\)[^}]*opacity: 1/s);
  assert.match(siteStyles, /@view-transition\s*\{\s*navigation: auto;/s);
  assert.match(siteStyles, /::view-transition-old\(root\)\s*\{[^}]*page-fade-out/s);
  assert.match(siteStyles, /::view-transition-new\(root\)\s*\{[^}]*page-fade-in/s);
  assert.match(siteStyles, /\.index-frame \.desktop-brand,\s*\.index-column \.post-list li,\s*\.index-column > \.footer\s*\{[^}]*index-entry-reveal/s);
  assert.match(siteStyles, /\.index-column \.post-list li:nth-child\(1\)\s*\{ animation-delay: 20ms; \}/s);
  assert.match(siteStyles, /\.index-column \.post-list li:nth-child\(9\)\s*\{ animation-delay: 180ms; \}/s);
  assert.match(siteStyles, /\.index-frame \.desktop-brand,\s*\.index-column > \.footer\s*\{\s*animation-delay: 0ms;/s);
  assert.match(siteStyles, /\.article-column > \.footer\.footer--end-reveal\.is-armed\s*\{[^}]*opacity: 0[^}]*translateY\(6px\)/s);
  assert.match(siteStyles, /\.article-column > \.footer\.footer--end-reveal\.is-revealed\s*\{[^}]*article-footer-reveal/s);
  const footerSource = await readFile(new URL("../app/Footer.tsx", import.meta.url), "utf8");
  assert.match(footerSource, /distanceToEnd <= 1/);
  assert.match(footerSource, /window\.addEventListener\("scroll", revealAtScrollEnd/);
  assert.match(siteStyles, /\.site \.article-body h2\s*\{[^}]*margin: 48px 0 24px[^}]*color: var\(--blog-muted\)[^}]*font-size: 12px[^}]*font-weight: 400[^}]*letter-spacing: 0\.06em[^}]*line-height: 24px[^}]*text-transform: uppercase/s);
  assert.match(siteStyles, /\.article-body blockquote\s*\{[^}]*position: relative[^}]*padding: 0 0 0 24px[^}]*margin: 36px 0/s);
  assert.match(siteStyles, /\.article-body blockquote::before\s*\{[^}]*inset-block: 0[^}]*inset-inline-start: 0[^}]*width: 1px[^}]*background: var\(--blog-muted\)/s);
  assert.match(siteStyles, /\.article-body \.article-numbered-list\s*\{[^}]*padding-inline-start: 2em[^}]*list-style: decimal/s);
  assert.match(siteStyles, /\.article-body \.article-numbered-list li::marker\s*\{[^}]*color: var\(--blog-muted\)[^}]*font-size: 12px[^}]*font-variant-numeric: tabular-nums[^}]*font-weight: 400/s);
  assert.match(siteStyles, /\.article-body p\.optical-margin-fallback\s*\{[^}]*text-indent: -0\.42em/s);
  assert.match(siteStyles, /\.article-body \.article-source,\s*\.site \.article-last-edited\s*\{[^}]*margin-top: 48px/s);
  assert.match(siteStyles, /\.site \.article-last-edited\s*\{[^}]*color: var\(--blog-muted\)/s);
  assert.match(articleBody, /<h2 key=/);
  assert.match(articleBody, /<blockquote key=/);
  assert.match(articleBody, /<ol className="article-list article-numbered-list"/);
  assert.match(articleBody, /optical-margin-fallback/);
  assert.match(articlePage, /post\?\.updatedAt/);
  assert.match(articlePage, /Last edited \{post\.updatedAt\}/);
  assert.match(articlePage, /<AuthorEditAction \/>/);
  assert.match(articlePage, /post \? <ScrollProgress \/> : null/);
  assert.match(authorEditAction, /className="author-edit-action" hidden/);
  assert.match(scrollProgress, /window\.requestAnimationFrame\(updateProgress\)/);
  assert.match(scrollProgress, /window\.addEventListener\("scroll", scheduleUpdate, \{ passive: true \}\)/);
  assert.match(authorMode, /thinkinghaus-author-mode/);
  assert.match(authorMode, /location\.hash === "#edit"/);
  assert.match(authorMode, /location\.hash === "#edit-off"/);
  assert.match(typographyGuards, /hyphenBetweenWords = \/\(\?<=\[\\p\{L\}\\p\{N\}\]\)-\(\?=\[\\p\{L\}\\p\{N\}\]\)\/gu/);
  assert.match(typographyGuards, /unguardedEnDash = \/\(\?<!\\u2060\)–\(\?!\\u2060\)\/gu/);
  assert.match(typographyGuards, /data-preserve-typography/);
  assert.match(typographyGuards, /new MutationObserver/);
  assert.match(authorMode, /thinkinghaus-studio\.maxpfennighaus\.workers\.dev/);
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

test("interprets article and RSS block structure from one shared parser", () => {
  assert.deepEqual(parseContentBlocks([
    "Before.",
    "## A small heading",
    "> A useful interruption.",
    "- First item.",
    "- Second item.",
    "3. Third item.",
    "4. Fourth item.",
  ]), [
    { type: "paragraph", index: 0, text: "Before." },
    { type: "heading", index: 1, text: "A small heading" },
    { type: "blockquote", index: 2, text: "A useful interruption." },
    { type: "unordered-list", index: 3, items: ["First item.", "Second item."] },
    { type: "ordered-list", index: 5, start: 3, items: ["Third item.", "Fourth item."] },
  ]);
});

test("publishes semantic block quotes in articles and RSS", async () => {
  const feed = generateRssFeed([{
    title: "Quote QA",
    slug: "quote-style-qa",
    date: "2026-08-13",
    publishedAt: "2026-08-13T12:00:00.000Z",
    paragraphs: ["Before.", "> A useful interruption.", "After."],
  }]);
  assert.match(feed, /<blockquote><p>A useful interruption\.<\/p><\/blockquote>/);
});

test("publishes semantic numbered lists in RSS", () => {
  const feed = generateRssFeed([{
    title: "Numbered list QA",
    slug: "numbered-list-qa",
    date: "2026-08-19",
    publishedAt: "2026-08-19T12:00:00.000Z",
    paragraphs: ["Before.", "3. First item.", "4. A *second* item.", "After."],
  }]);
  assert.match(feed, /<ol start="3"><li>First item\.<\/li><li>A <em>second<\/em> item\.<\/li><\/ol>/);
});

test("calculates reading time and preserves draft status", () => {
  assert.equal(calculateReadingTime("word ".repeat(180)), "1 minute read");
  assert.equal(calculateReadingTime("word ".repeat(181)), "2 minute read");
  assert.equal(
    calculateReadingTime("Read [this note](https://example.com/a/very/long/address) *slowly*."),
    "1 minute read",
  );

  const draft = parsePost(serializePost({
    title: "A private thought",
    slug: "a-private-thought",
    date: "2026-08-06",
    status: "draft",
    body: "Not ready yet.",
  }));
  assert.equal(draft.status, "draft");
  assert.equal(draft.readingTime, "1 minute read");

  const revised = parsePost(serializePost({
    title: "A revised thought",
    slug: "a-revised-thought",
    date: "2026-08-06",
    publishedAt: "2026-08-06T12:00:00.000Z",
    updatedAt: "2026-08-19T12:00:00.000Z",
    status: "published",
    body: "Changed after publication.",
  }));
  assert.equal(revised.updatedAt, "2026-08-19T12:00:00.000Z");
});

test("sorts the homepage by authored date without moving revised posts", () => {
  const ordered = [
    { slug: "revised-older-post", date: "2026-08-10", publishedAt: "2026-08-10T12:00:00.000Z", updatedAt: "2026-08-19T12:00:00.000Z" },
    { slug: "newer-post", date: "2026-08-11", publishedAt: "2026-08-11T12:00:00.000Z", updatedAt: "" },
  ].sort(comparePostsByDate);
  assert.deepEqual(ordered.map((post) => post.slug), ["newer-post", "revised-older-post"]);
});

test("parses consecutive numbered Markdown items as distinct blocks", () => {
  const post = parsePost(`---
title: "A sequence"
slug: a-sequence
date: 2026-08-19
status: draft
---

Before.

1. First item.
2. Second item
   continues on another line.

After.`);
  assert.deepEqual(post.paragraphs, [
    "Before.",
    "1. First item.",
    "2. Second item continues on another line.",
    "After.",
  ]);
});
