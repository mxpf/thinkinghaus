import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
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

  assert.match(html, /<title>Thinkinghaus<\/title>/i);
  assert.match(html, /A Pretty Normal Typeface/);
  assert.match(html, /The Usefulness of an Empty Mind/);
  assert.match(html, /A System for Looking/);
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
