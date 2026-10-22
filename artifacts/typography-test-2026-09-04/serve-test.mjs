import { createReadStream } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";

const testRoot = "/tmp/keepinghaus-typography-site";
const outputRoot = path.join(process.cwd(), "artifacts", "typography-test-2026-09-04", "screenshots");
const port = 4179;

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".otf": "font/otf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttc": "font/collection",
  ".xml": "application/xml; charset=utf-8",
};

await mkdir(outputRoot, { recursive: true });

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host}`);

  if (request.method === "POST" && url.pathname === "/__capture") {
    const name = url.searchParams.get("name") || "";
    if (!/^[a-z0-9][a-z0-9._-]*\.png$/.test(name)) {
      response.writeHead(400).end("Invalid capture name");
      return;
    }

    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    await writeFile(path.join(outputRoot, name), Buffer.concat(chunks));
    response.writeHead(204).end();
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405).end("Method not allowed");
    return;
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (["_next", "assets", "fonts", "images", "test-fonts"].includes(parts[0]) || ["author-mode.js", "favicon.svg"].includes(parts[0])) {
    const sharedBase = parts[0] === "test-fonts" ? testRoot : path.join(testRoot, "untitled-sans");
    const sharedPath = path.resolve(sharedBase, ...parts);
    const sharedRoot = sharedBase + path.sep;
    if (!sharedPath.startsWith(sharedRoot)) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    try {
      const info = await stat(sharedPath);
      if (!info.isFile()) throw new Error("Not a file");
      response.writeHead(200, { "Content-Type": contentTypes[path.extname(sharedPath)] || "application/octet-stream" });
      if (request.method === "HEAD") response.end();
      else createReadStream(sharedPath).pipe(response);
    } catch {
      response.writeHead(404).end("Not found");
    }
    return;
  }

  const condition = parts.shift();
  if (!condition || !["charter", "untitled-serif", "untitled-sans", "browser-serif"].includes(condition)) {
    response.writeHead(404).end("Unknown condition");
    return;
  }

  let relativePath = decodeURIComponent(parts.join("/"));
  if (!relativePath) relativePath = "index.html";
  if (relativePath.endsWith("/")) relativePath += "index.html";
  if (!path.extname(relativePath)) relativePath += ".html";

  let filePath;
  if (relativePath === "_typography-test.css") {
    filePath = path.join(testRoot, condition, relativePath);
  } else if (relativePath.startsWith("assets/") || relativePath.startsWith("fonts/") || relativePath.startsWith("images/")) {
    filePath = path.join(testRoot, condition, relativePath);
  } else {
    filePath = path.join(testRoot, condition, relativePath);
  }

  const normalizedRoot = path.join(testRoot, condition) + path.sep;
  const normalizedFile = path.resolve(filePath);
  if (!normalizedFile.startsWith(normalizedRoot)) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  try {
    const info = await stat(normalizedFile);
    if (!info.isFile()) throw new Error("Not a file");
    response.writeHead(200, { "Content-Type": contentTypes[path.extname(normalizedFile)] || "application/octet-stream" });
    if (request.method === "HEAD") response.end();
    else createReadStream(normalizedFile).pipe(response);
  } catch {
    response.writeHead(404).end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Typography test server: http://127.0.0.1:${port}`);
  console.log(`Captures: ${outputRoot}`);
});
