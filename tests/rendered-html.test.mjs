import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";
import { parseInlineMarkdown, stripInlineMarkdown } from "../app/inline-markdown.ts";
import { readPosts } from "../scripts/content.mjs";

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
  assert.doesNotMatch(html, /Thinkinghaus Studio/);
});

test("keeps the writing library readable and the studio local", async () => {
  const posts = await readPosts({ includeDrafts: true });
  assert.equal(posts.length, 6);
  assert.ok(posts.every((post) => post.body.length > 0));
  assert.ok(posts.every((post) => /^[a-z0-9-]+$/.test(post.slug)));

  const studio = await readFile(new URL("../studio/index.html", import.meta.url), "utf8");
  assert.match(studio, /Thinkinghaus Studio/);
  assert.match(studio, /Publish/);
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
