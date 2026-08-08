import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";
import { parseInlineMarkdown, stripInlineMarkdown } from "../app/inline-markdown.ts";
import { calculateReadingTime, parsePost, readPages, readPosts, serializePost } from "../scripts/content.mjs";
import { readPortfolioAbout, readPortfolioProjects } from "../scripts/portfolio-content.mjs";

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
  for (const post of posts) assert.ok(html.includes(post.title));
  assert.match(html, /href="\/about"/);
  assert.match(html, /href="\/links"/);
  assert.doesNotMatch(html, /Thinkinghaus Studio/);
});

test("renders editable About and Links pages", async () => {
  const pages = await readPages();
  assert.deepEqual(pages.map((page) => page.slug), ["about", "links"]);

  const aboutResponse = await render("/about");
  assert.equal(aboutResponse.status, 200);
  const aboutHtml = await aboutResponse.text();
  assert.match(aboutHtml, /<title>About — Thinkinghaus<\/title>/i);
  assert.ok(aboutHtml.includes(pages.find((page) => page.slug === "about").paragraphs[0]));

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
  assert.deepEqual(parseInlineMarkdown("[No](javascript:alert(1))"), [
    { type: "text", value: "[No](javascript:alert(1)" },
    { type: "text", value: ")" },
  ]);

  const italicFont = await stat(
    new URL("../public/fonts/UntitledSansWeb-RegularItalic.woff", import.meta.url),
  );
  assert.equal(italicFont.size, 47346);
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
