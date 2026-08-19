import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { projectRoot } from "./content.mjs";

const execFileAsync = promisify(execFile);
const chrome = process.env.THINKINGHAUS_CHROME_PATH
  ?? (process.platform === "darwin"
    ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    : "google-chrome");
const font = await readFile(path.join(projectRoot, "public", "fonts", "UntitledSansWeb-Regular.woff2"));
const output = path.join(projectRoot, "public", "og.png");
const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "thinkinghaus-og-"));
const htmlPath = path.join(temporaryDirectory, "card.html");

try {
  await writeFile(
    htmlPath,
    `<!doctype html><style>
      @font-face { font-family: UntitledSans; src: url(data:font/woff2;base64,${font.toString("base64")}) format("woff2"); font-weight: 400; }
      * { box-sizing: border-box; }
      html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }
      body { align-items: flex-start; background: #1c1c1a; color: #eeede9; display: flex; flex-direction: column; font-family: UntitledSans, sans-serif; justify-content: center; padding: 56px; }
      h1 { font-size: 156px; font-weight: 400; letter-spacing: -0.045em; line-height: 1; margin: 0; }
      p { font-size: 34px; font-weight: 400; line-height: 1.2; margin: 30px 0 0; }
    </style><h1>Thinkinghaus</h1><p>Notes on attention, work, and the occasional strange thing.</p>`,
  );

  await execFileAsync(chrome, [
    "--headless",
    "--disable-gpu",
    "--hide-scrollbars",
    "--screenshot=" + output,
    "--virtual-time-budget=1000",
    "--window-size=1200,630",
    pathToFileURL(htmlPath).href,
  ]);
} finally {
  await rm(temporaryDirectory, { force: true, recursive: true });
}

console.log(`Generated ${path.relative(projectRoot, output)}.`);
