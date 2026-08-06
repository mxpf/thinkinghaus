import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import {
  parsePost,
  postsDirectory,
  projectRoot,
  readPosts,
  savePost,
  slugify,
} from "./content.mjs";
import { generatePostsModule } from "./generate-posts.mjs";
import {
  portfolioPublicDirectory,
  portfolioRoot,
  readPortfolioAbout,
  readPortfolioProjects,
  savePortfolioAbout,
  savePortfolioProject,
} from "./portfolio-content.mjs";
import { publishPortfolio } from "./publish-portfolio.mjs";
import { publishSite } from "./publish.mjs";

const exec = promisify(execFile);
const studioDirectory = path.join(projectRoot, "studio");
const port = Number(process.env.THINKINGHAUS_STUDIO_PORT || 4311);
const host = "127.0.0.1";

function json(response, value, status = 200) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(value));
}

async function bodyFrom(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 2_000_000) throw new Error("That draft is too large to save.");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

async function history() {
  try {
    const { stdout } = await exec(
      "git",
      ["log", "-8", "--date=short", "--format=%h%x09%ad%x09%s", "--", "content/posts"],
      { cwd: projectRoot },
    );
    return stdout
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [commit, date, ...message] = line.split("\t");
        return { commit, date, message: message.join(" ") };
      });
  } catch {
    return [];
  }
}

async function portfolioHistory() {
  try {
    const { stdout } = await exec(
      "git",
      ["log", "-8", "--date=short", "--format=%h%x09%ad%x09%s", "--", "content/projects", "content/about.md", "content/site.yml"],
      { cwd: portfolioRoot },
    );
    return stdout
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [commit, date, ...message] = line.split("\t");
        return { commit, date, message: message.join(" ") };
      });
  } catch {
    return [];
  }
}

async function sendPortfolioMedia(response, pathname) {
  if (!pathname.startsWith("/portfolio-media/")) return false;
  const relative = decodeURIComponent(pathname.slice("/portfolio-media/".length)).replace(/^\/+/, "");
  const location = path.resolve(portfolioPublicDirectory, relative);
  if (!location.startsWith(`${portfolioPublicDirectory}${path.sep}`)) return false;
  const extension = path.extname(location).toLowerCase();
  const types = {
    ".avif": "image/avif",
    ".gif": "image/gif",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".mp4": "video/mp4",
    ".png": "image/png",
    ".webp": "image/webp",
  };
  if (!types[extension]) return false;
  try {
    response.writeHead(200, { "Content-Type": types[extension], "Cache-Control": "no-store" });
    response.end(await readFile(location));
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function sendAsset(response, pathname) {
  const assets = {
    "/": ["index.html", "text/html; charset=utf-8"],
    "/studio.css": ["studio.css", "text/css; charset=utf-8"],
    "/studio.js": ["studio.js", "text/javascript; charset=utf-8"],
    "/fonts/UntitledSansWeb-RegularItalic.woff": [
      "../public/fonts/UntitledSansWeb-RegularItalic.woff",
      "font/woff",
    ],
  };
  const asset = assets[pathname];
  if (!asset) return false;
  response.writeHead(200, { "Content-Type": asset[1], "Cache-Control": "no-store" });
  response.end(await readFile(path.join(studioDirectory, asset[0])));
  return true;
}

async function handler(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);

  try {
    if (request.method === "GET" && url.pathname === "/api/posts") {
      return json(response, {
        posts: await readPosts({ includeDrafts: true }),
        history: await history(),
      });
    }

    if (request.method === "GET" && url.pathname === "/api/portfolio/projects") {
      return json(response, {
        about: await readPortfolioAbout(),
        projects: await readPortfolioProjects(),
        history: await portfolioHistory(),
      });
    }

    if (request.method === "POST" && url.pathname === "/api/save") {
      const input = await bodyFrom(request);
      const slug = slugify(input.slug || input.title || "");
      if (!slug) return json(response, { error: "Give this piece a title first." }, 400);

      const destination = path.join(postsDirectory, `${slug}.md`);
      if (!input.slug) {
        try {
          await stat(destination);
          return json(response, { error: "A piece with that title already exists." }, 409);
        } catch (error) {
          if (error.code !== "ENOENT") throw error;
        }
      }

      const saved = await savePost({
        title: input.title?.trim() || "Untitled",
        slug,
        date: input.date || new Date().toISOString().slice(0, 10),
        publishedAt: input.publishedAt || "",
        status: input.status === "published" ? "published" : "draft",
        body: input.body || "",
        source:
          input.source?.label && input.source?.href
            ? { label: input.source.label.trim(), href: input.source.href.trim() }
            : undefined,
      });
      await generatePostsModule();
      const source = await readFile(path.join(postsDirectory, `${saved.slug}.md`), "utf8");
      return json(response, { post: parsePost(source, `${saved.slug}.md`) });
    }

    if (request.method === "POST" && url.pathname === "/api/portfolio/save") {
      const input = await bodyFrom(request);
      const project = input.type === "about" || input.slug === "about"
        ? await savePortfolioAbout(input)
        : await savePortfolioProject(input);
      return json(response, { project });
    }

    if (request.method === "POST" && url.pathname === "/api/publish") {
      const input = await bodyFrom(request);
      if (!input.slug) return json(response, { error: "Save the draft before publishing." }, 400);
      const source = await readFile(path.join(postsDirectory, `${input.slug}.md`), "utf8");
      const post = parsePost(source, `${input.slug}.md`);
      if (!post.body.trim()) return json(response, { error: "There is nothing to publish yet." }, 400);
      await savePost({
        ...post,
        status: "published",
        publishedAt: post.publishedAt || new Date().toISOString(),
      });
      await generatePostsModule();
      const result = await publishSite();
      return json(response, { ...result, posts: await readPosts({ includeDrafts: true }), history: await history() });
    }

    if (request.method === "POST" && url.pathname === "/api/portfolio/publish") {
      const result = await publishPortfolio();
      return json(response, {
        ...result,
        about: await readPortfolioAbout(),
        projects: await readPortfolioProjects(),
        history: await portfolioHistory(),
      });
    }

    if (request.method === "GET" && (await sendPortfolioMedia(response, url.pathname))) return;
    if (request.method === "GET" && (await sendAsset(response, url.pathname))) return;
    json(response, { error: "Not found." }, 404);
  } catch (error) {
    console.error(error);
    json(response, { error: error.message || "Something went wrong." }, 500);
  }
}

const server = createServer(handler);

server.on("error", async (error) => {
  if (error.code === "EADDRINUSE") {
    if (process.env.STUDIO_NO_OPEN !== "1") await execFile("open", [`http://${host}:${port}`]);
    process.exit(0);
  }
  throw error;
});

server.listen(port, host, async () => {
  const url = `http://${host}:${port}`;
  console.log(`Publishing Studio is ready at ${url}`);
  if (process.env.STUDIO_NO_OPEN !== "1") await execFile("open", [url]);
});
