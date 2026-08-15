import assert from "node:assert/strict";
import test from "node:test";
import { mergeWebmentions, normalizeWebmention } from "../scripts/refresh-webmentions.mjs";

test("keeps Webmentions small, public, external, and safe to render", () => {
  assert.equal(normalizeWebmention({ url: "javascript:alert(1)" }), null);
  assert.equal(normalizeWebmention({ url: "https://user:secret@example.com/a" }), null);
  assert.equal(normalizeWebmention({ url: "https://thinking.haus/a", author: { name: "Me" } }), null);
  assert.equal(normalizeWebmention({ url: "https://example.com/private", "wm-private": true }), null);

  assert.deepEqual(normalizeWebmention({
    url: "https://www.example.com/a",
    author: { name: "A Person" },
    "wm-received": "2026-08-14T10:00:00Z",
  }), {
    url: "https://www.example.com/a",
    label: "A Person",
    received: "2026-08-14T10:00:00Z",
  });

  assert.equal(normalizeWebmention({
    url: "https://www.example.com/b",
    author: { name: "Anonymous" },
  }).label, "example.com");
});

test("deduplicates and orders Webmentions without republishing remote content", () => {
  const mentions = mergeWebmentions([
    { url: "https://one.example/post", author: { name: "One" }, "wm-received": "2026-08-13" },
    { url: "https://two.example/post", name: "Two", "wm-received": "2026-08-14" },
    { url: "https://one.example/post", author: { name: "One again" }, "wm-received": "2026-08-15" },
  ]);

  assert.deepEqual(mentions.map(({ label }) => label), ["One again", "Two"]);
  assert.equal("content" in mentions[0], false);
});
