import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { portfolioRoot } from "./portfolio-content.mjs";

const exec = promisify(execFile);

async function run(command, args, options = {}) {
  try {
    return await exec(command, args, {
      cwd: portfolioRoot,
      maxBuffer: 50 * 1024 * 1024,
      ...options,
    });
  } catch (error) {
    const detail = error.stderr?.trim() || error.stdout?.trim() || error.message;
    throw new Error(detail);
  }
}

async function hasStagedChanges(cwd = portfolioRoot) {
  try {
    await exec("git", ["diff", "--cached", "--quiet"], { cwd });
    return false;
  } catch (error) {
    if (error.code === 1) return true;
    throw error;
  }
}

async function ensureSafeWorkingTree() {
  const { stdout } = await run("git", ["status", "--porcelain"]);
  const unsafe = stdout
    .split("\n")
    .filter(Boolean)
    .map((line) => line.slice(3))
    .filter((file) => !/^content\/projects\/project-\d+\/project\.md$/.test(file));
  if (unsafe.length) {
    throw new Error(`Publishing paused because other portfolio files have unfinished changes: ${unsafe.join(", ")}`);
  }
}

async function socialImagePaths(outputDirectory) {
  const needed = new Set();
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const location = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(location);
      else if (entry.name.endsWith(".html")) {
        const html = await readFile(location, "utf8");
        for (const tag of html.match(/<meta\s[^>]+>/g) || []) {
          if (!/(?:property="og:image"|name="twitter:image")/.test(tag)) continue;
          const content = tag.match(/content="([^"]+)"/)?.[1];
          if (!content) continue;
          try {
            const pathname = new URL(content, "https://maxpfennig.haus").pathname;
            if (pathname.startsWith("/images/projects/")) needed.add(pathname);
          } catch {
            // Ignore malformed metadata; the site build validates the actual page.
          }
        }
      }
    }
  }
  await visit(outputDirectory);
  return needed;
}

async function pruneProjectOriginals(worktree, needed) {
  const directory = path.join(worktree, "images", "projects");
  async function visit(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const location = path.join(current, entry.name);
      if (entry.isDirectory()) await visit(location);
      else if (/\.(?:png|jpe?g|webp|avif)$/i.test(entry.name)) {
        const pathname = `/${path.relative(worktree, location).split(path.sep).join("/")}`;
        if (!needed.has(pathname)) await rm(location);
      }
    }
  }
  await visit(directory);
}

async function removeFinderMetadata(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const location = path.join(directory, entry.name);
    if (entry.isDirectory()) await removeFinderMetadata(location);
    else if (entry.name === ".DS_Store") await rm(location);
  }
}

export async function publishPortfolio() {
  await ensureSafeWorkingTree();
  await run("npm", ["run", "build:pages"]);
  await run("git", ["add", "--", "content/projects"]);
  if (await hasStagedChanges()) await run("git", ["commit", "-m", "Update portfolio project copy"]);

  await run("git", ["fetch", "personal-site", "main"]);
  const worktree = await mkdtemp(path.join(os.tmpdir(), "portfolio-publish-"));
  const outputDirectory = path.join(portfolioRoot, "out");
  const needed = await socialImagePaths(outputDirectory);

  try {
    await run("git", ["worktree", "add", "--detach", worktree, "personal-site/main"]);
    await run("rsync", ["-a", "--delete", "--exclude", ".git", "out/", `${worktree}/`]);
    await pruneProjectOriginals(worktree, needed);
    await removeFinderMetadata(worktree);
    await run("git", ["add", "-A"], { cwd: worktree });
    if (await hasStagedChanges(worktree)) {
      await run("git", ["commit", "-m", "Publish portfolio"], { cwd: worktree });
    }
    await run("git", ["push", "personal-site", "HEAD:main"], { cwd: worktree });
  } finally {
    try {
      await run("git", ["worktree", "remove", "--force", worktree]);
    } catch {
      // A failed cleanup can be repaired later with `git worktree prune`.
    }
  }

  return { url: "https://maxpfennig.haus" };
}
