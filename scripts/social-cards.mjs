import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { parseContentBlocks, stripInlineMarkdown } from "../lib/markdown.mjs";
import { projectRoot } from "./content.mjs";

const WIDTH = 1200;
const HEIGHT = 630;
const ART_SIZE = 630;
const BACKGROUND = "#1c1811";
const FOREGROUND = "#afada6";
const MUTED = "#7f7c74";
const outputDirectory = path.join(projectRoot, "public", "social-cards");

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wrapTitle(title, maxCharacters) {
  const words = stripInlineMarkdown(title).trim().split(/\s+/);
  const lines = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && candidate.length > maxCharacters) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

function firstArticleImage(document) {
  return parseContentBlocks(document.paragraphs).find((block) => block.type === "image") || null;
}

async function imageComposite(document) {
  const image = firstArticleImage(document);
  if (!image || !image.src.startsWith("/images/")) return null;

  const sourcePath = path.join(projectRoot, "public", image.src.replace(/^\//, ""));
  try {
    const input = await readFile(sourcePath);
    return await sharp(input)
      .resize(ART_SIZE, ART_SIZE, { fit: "contain", background: BACKGROUND })
      .png()
      .toBuffer();
  } catch {
    return null;
  }
}

function textLayer(document, hasImage) {
  const x = hasImage ? 686 : 72;
  const availableWidth = hasImage ? 442 : 1056;
  const fontSize = hasImage ? 48 : 68;
  const lineHeight = Math.round(fontSize * 1.08);
  const lines = wrapTitle(document.title, hasImage ? 16 : 28);
  const totalHeight = lines.length * lineHeight;
  const startY = Math.round((HEIGHT - totalHeight) / 2) + Math.round(fontSize * 0.75);
  const title = lines.map((line, index) => (
    `<text x="${x}" y="${startY + index * lineHeight}" fill="${FOREGROUND}" ` +
    `font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="400">${escapeXml(line)}</text>`
  )).join("");

  return Buffer.from(`
    <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      ${title}
      <text x="${x}" y="574" fill="${MUTED}" font-family="Arial, Helvetica, sans-serif" font-size="24" letter-spacing="1.2">thinking.haus</text>
      <rect x="${x}" y="595" width="${availableWidth}" height="1" fill="${MUTED}" opacity="0.45"/>
    </svg>
  `);
}

export async function generateSocialCards(documents) {
  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(outputDirectory, { recursive: true });

  for (const document of documents) {
    const art = await imageComposite(document);
    const base = sharp({
      create: { width: WIDTH, height: HEIGHT, channels: 3, background: BACKGROUND },
    });
    const composites = [{ input: textLayer(document, Boolean(art)), left: 0, top: 0 }];
    if (art) composites.unshift({ input: art, left: 0, top: 0 });

    await base
      .composite(composites)
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(path.join(outputDirectory, `${document.slug}.png`));
  }
}
