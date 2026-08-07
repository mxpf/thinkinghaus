import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { generatePostsModule } from "./generate-posts.mjs";
import { projectRoot, readPages, readPosts } from "./content.mjs";

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
        file !== "app/generated-pages.ts" &&
        !file.startsWith("content/pages/") &&
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
  const allPosts = await readPosts({ includeDrafts: true });
  const pages = await readPages();
  await generatePostsModule();
  await run("npm", ["run", "build:pages"]);

  const sourceFiles = [
    "app/generated-pages.ts",
    "app/generated-posts.ts",
    ...pages.map((page) => `content/pages/${page.slug}.md`),
    ...allPosts.map((post) => `content/posts/${post.slug}.md`),
  ];
  await run("git", ["add", "--", ...sourceFiles]);

  if (await hasStagedChanges()) {
    await run("git", ["commit", "-m", "Publish Thinkinghaus writing"]);
  }
  await run("git", ["push", "github", "main"]);

  return { url: "http://thinking.haus" };
}
