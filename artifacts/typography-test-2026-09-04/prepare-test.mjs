import { cp, copyFile, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const sourceRoot = path.join(projectRoot, "dist", "client");
const testRoot = "/tmp/keepinghaus-typography-site";

const conditions = {
  charter: `
@font-face { font-family: "Typography Test Charter"; src: url("/test-fonts/Charter.ttc") format("truetype"); font-style: normal; font-weight: 300; }
@font-face { font-family: "Typography Test Charter"; src: url("/test-fonts/Charter.ttc") format("truetype"); font-style: normal; font-weight: 400; }
@font-face { font-family: "Typography Test Charter"; src: local("Charter Italic"), local("Charter-Italic"), url("/test-fonts/Charter.ttc") format("truetype"); font-style: italic; font-weight: 300; }
@font-face { font-family: "Typography Test Charter"; src: local("Charter Italic"), local("Charter-Italic"), url("/test-fonts/Charter.ttc") format("truetype"); font-style: italic; font-weight: 400; }
.site { font-family: "Typography Test Charter", Charter, serif !important; }
`,
  "untitled-serif": `
@font-face { font-family: "Typography Test Untitled Serif"; src: url("/test-fonts/TestUntitledSerif-Regular.otf") format("opentype"); font-style: normal; font-weight: 300; }
@font-face { font-family: "Typography Test Untitled Serif"; src: url("/test-fonts/TestUntitledSerif-Regular.otf") format("opentype"); font-style: normal; font-weight: 400; }
@font-face { font-family: "Typography Test Untitled Serif"; src: url("/test-fonts/TestUntitledSerif-Italic.otf") format("opentype"); font-style: italic; font-weight: 300; }
@font-face { font-family: "Typography Test Untitled Serif"; src: url("/test-fonts/TestUntitledSerif-Italic.otf") format("opentype"); font-style: italic; font-weight: 400; }
.site { font-family: "Typography Test Untitled Serif", serif !important; }
`,
  "untitled-sans": `
/* Canonical webfont declarations and all checked-in typography remain unchanged. */
`,
  "browser-serif": `
.site { font-family: serif !important; }
`,
};

async function collectHtmlFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...await collectHtmlFiles(fullPath));
    if (entry.isFile() && entry.name.endsWith(".html")) files.push(fullPath);
  }
  return files;
}

await rm(testRoot, { recursive: true, force: true });
await mkdir(testRoot, { recursive: true });
await mkdir(path.join(testRoot, "test-fonts"), { recursive: true });
await copyFile("/System/Library/Fonts/Supplemental/Charter.ttc", path.join(testRoot, "test-fonts", "Charter.ttc"));
await copyFile("/Users/mxpf/Library/Fonts/TestUntitledSerif-Regular.otf", path.join(testRoot, "test-fonts", "TestUntitledSerif-Regular.otf"));
await copyFile("/Users/mxpf/Library/Fonts/TestUntitledSerif-Italic.otf", path.join(testRoot, "test-fonts", "TestUntitledSerif-Italic.otf"));

for (const [condition, css] of Object.entries(conditions)) {
  const conditionRoot = path.join(testRoot, condition);
  await cp(sourceRoot, conditionRoot, { recursive: true });
  await writeFile(path.join(conditionRoot, "_typography-test.css"), css.trimStart());
  const htmlFiles = await collectHtmlFiles(conditionRoot);
  for (const htmlFile of htmlFiles) {
    const html = await readFile(htmlFile, "utf8");
    const linked = html.replace("</head>", `<link rel="stylesheet" href="/${condition}/_typography-test.css"></head>`);
    await writeFile(htmlFile, linked);
  }
}

console.log(`Prepared ${Object.keys(conditions).length} isolated conditions in ${testRoot}`);
