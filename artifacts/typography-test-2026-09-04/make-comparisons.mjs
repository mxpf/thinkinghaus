import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.join(process.cwd(), "artifacts", "typography-test-2026-09-04");
const screenshotRoot = path.join(root, "screenshots");
const comparisonRoot = path.join(root, "comparisons");
const postImageRoot = path.join(root, "post", "images");

const conditions = [
  { key: "charter", label: "1. Charter" },
  { key: "untitled-serif", label: "2. Untitled Serif" },
  { key: "untitled-sans", label: "3. Untitled Sans" },
  { key: "browser-serif", label: "4. Browser serif" },
];

await mkdir(comparisonRoot, { recursive: true });
await rm(postImageRoot, { recursive: true, force: true });
await mkdir(postImageRoot, { recursive: true });

function labelSvg(label, width, height) {
  const safe = label.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#0f0e0c"/>
    <text x="18" y="${Math.round(height * 0.66)}" fill="#f1ede3" font-family="Arial, sans-serif" font-size="18">${safe}</text>
  </svg>`);
}

async function panel({ input, label, crop, width, labelHeight = 44 }) {
  let image = sharp(input);
  if (crop) image = image.extract(crop);
  image = image.resize({ width, withoutEnlargement: false });
  const content = await image.png().toBuffer();
  const meta = await sharp(content).metadata();
  return sharp({
    create: {
      width,
      height: meta.height + labelHeight,
      channels: 3,
      background: "#0f0e0c",
    },
  }).composite([
    { input: labelSvg(label, width, labelHeight), top: 0, left: 0 },
    { input: content, top: labelHeight, left: 0 },
  ]).png().toBuffer();
}

async function grid(name, panels, columns = 2) {
  const panelMeta = await Promise.all(panels.map((item) => sharp(item).metadata()));
  const columnWidth = Math.max(...panelMeta.map((meta) => meta.width));
  const rowCount = Math.ceil(panels.length / columns);
  const rowHeights = Array.from({ length: rowCount }, (_, row) => Math.max(
    ...panelMeta.slice(row * columns, row * columns + columns).map((meta) => meta.height),
  ));
  const canvasWidth = columnWidth * columns;
  const canvasHeight = rowHeights.reduce((sum, height) => sum + height, 0);
  const composites = [];
  let top = 0;
  for (let row = 0; row < rowCount; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const index = row * columns + column;
      if (index < panels.length) composites.push({ input: panels[index], left: column * columnWidth, top });
    }
    top += rowHeights[row];
  }
  const output = path.join(comparisonRoot, `${name}.png`);
  await sharp({ create: { width: canvasWidth, height: canvasHeight, channels: 3, background: "#0f0e0c" } })
    .composite(composites)
    .png()
    .toFile(output);
  await sharp(output).webp({ quality: 90 }).toFile(path.join(postImageRoot, `keepinghaus-typography-${name}.webp`));
  return output;
}

async function makeTopComparison(name, page, viewport) {
  const desktop = viewport === "desktop";
  const panels = await Promise.all(conditions.map(({ key, label }) => panel({
    input: path.join(screenshotRoot, `${key}-${page}-${viewport}.png`),
    label,
    crop: { left: 0, top: 0, width: desktop ? 1280 : 390, height: desktop ? 800 : 844 },
    width: desktop ? 640 : 390,
  })));
  return grid(name, panels, 2);
}

await makeTopComparison("01-index-desktop", "index", "desktop");
await makeTopComparison("02-prose-desktop", "personal-folklore", "desktop");
await makeTopComparison("03-prose-mobile", "personal-folklore", "mobile");
await makeTopComparison("04-links-desktop", "links", "desktop");
await makeTopComparison("05-list-mobile", "now", "mobile");

const mediaTop = {
  charter: 1400,
  "untitled-serif": 1352,
  "untitled-sans": 1424,
  "browser-serif": 1256,
};
const mediaPanels = await Promise.all(conditions.map(({ key, label }) => panel({
  input: path.join(screenshotRoot, `${key}-look-at-this-desktop.png`),
  label,
  crop: { left: 0, top: mediaTop[key], width: 1280, height: 800 },
  width: 640,
})));
await grid("06-media-desktop", mediaPanels, 2);

const longPanels = await Promise.all(conditions.map(({ key, label }) => panel({
  input: path.join(screenshotRoot, `${key}-look-at-this-desktop.png`),
  label,
  width: 320,
  labelHeight: 38,
})));
await grid("07-longform-full-desktop", longPanels, 4);

console.log(`Created comparison PNGs in ${comparisonRoot}`);
console.log(`Created post-ready WebP files in ${postImageRoot}`);
