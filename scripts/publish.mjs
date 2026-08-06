import { execFile } from "node:child_process";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { generatePostsModule } from "./generate-posts.mjs";
import { projectRoot, readPosts } from "./content.mjs";

const exec = promisify(execFile);

async function run(command, args, options = {}) {
  try {
    return await exec(command, args, {
      cwd: projectRoot,
      maxBuffer: 10 * 1024 * 1024,
      ...options,
    });
  } catch (error) {
    const detail = error.stderr?.trim() || error.stdout?.trim() || error.message;
    throw new Error(detail);
  }
}

async function hasStagedChanges(cwd = projectRoot) {
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
    .filter(
      (file) =>
        file !== "app/generated-posts.ts" &&
        !file.startsWith("content/posts/"),
    );

  if (unsafe.length) {
    throw new Error(
      `Publishing paused because other site files have unpublished changes: ${unsafe.join(", ")}`,
    );
  }
}

export async function publishSite() {
  await ensureSafeWorkingTree();
  const publishedPosts = await readPosts();
  await generatePostsModule();
  await run("npm", ["run", "build:pages"]);

  const sourceFiles = [
    "app/generated-posts.ts",
    ...publishedPosts.map((post) => `content/posts/${post.slug}.md`),
  ];
  await run("git", ["add", "--", ...sourceFiles]);

  if (await hasStagedChanges()) {
    await run("git", ["commit", "-m", "Publish Thinkinghaus writing"]);
  }
  await run("git", ["push", "github", "main"]);

  await run("git", ["fetch", "github", "gh-pages"]);
  const worktree = await mkdtemp(path.join(os.tmpdir(), "thinkinghaus-publish-"));

  try {
    await run("git", ["worktree", "add", "--detach", worktree, "github/gh-pages"]);
    await run(
      "rsync",
      ["-a", "--delete", "--exclude", ".git", "dist/client/", `${worktree}/`],
    );
    await run("git", ["add", "-A"], { cwd: worktree });

    if (await hasStagedChanges(worktree)) {
      await run("git", ["commit", "-m", "Publish site"], { cwd: worktree });
    }
    await run("git", ["push", "github", "HEAD:gh-pages"], { cwd: worktree });
  } finally {
    try {
      await run("git", ["worktree", "remove", "--force", worktree]);
    } catch {
      // A failed cleanup can be repaired later with `git worktree prune`.
    }
  }

  return { url: "https://thinking.haus" };
}
