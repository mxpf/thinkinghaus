import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve("artifacts/low-tech-audit-2026-09-24/static-first-prototype-v2");
const port = 4315;
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

async function resource(url) {
  let requested = decodeURIComponent(new URL(url, "http://127.0.0.1").pathname);
  if (requested.startsWith("/preview/")) requested = requested.slice("/preview".length);
  if (requested === "/preview") requested = "/";
  if (requested.endsWith("/")) requested += "index.html";
  if (!extname(requested)) requested += ".html";

  const path = normalize(join(root, requested));
  if (!path.startsWith(root)) throw new Error("Invalid path");
  let [body, metadata] = await Promise.all([readFile(path), stat(path)]);

  if (extname(path) === ".html") {
    let html = body.toString("utf8");
    html = html.replace(/<script\b[^>]*trackinghaus-alpha\.vercel\.app[^>]*><\/script>/gi, "");
    html = html.replace(/href="\/(?![_a-z-]+\/|\/)/g, 'href="/preview/');
    body = Buffer.from(html);
  }

  const hashed = requested.startsWith("/_next/static/");
  return {
    body,
    headers: {
      "access-control-allow-origin": "*",
      "cache-control": hashed ? "public, max-age=31536000, immutable" : "max-age=600",
      "content-length": String(body.length),
      "content-type": contentTypes[extname(path)] || "application/octet-stream",
      "last-modified": metadata.mtime.toUTCString(),
      vary: "Accept-Encoding",
    },
  };
}

const server = createServer(async (request, response) => {
  try {
    const result = await resource(request.url || "/preview/");
    response.writeHead(200, result.headers);
    response.end(result.body);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Production-like preview: http://127.0.0.1:${port}/preview/`);
  console.log("Trackinghaus is intentionally omitted so the preview cannot emit analytics events.");
});
