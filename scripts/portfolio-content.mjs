import { readdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { projectRoot } from "./content.mjs";

export const portfolioRoot = process.env.PORTFOLIO_ROOT
  ? path.resolve(process.env.PORTFOLIO_ROOT)
  : path.resolve(projectRoot, "..", "maxpfennig-portfolio");
export const portfolioProjectsDirectory = path.join(portfolioRoot, "content", "projects");
export const portfolioPublicDirectory = path.join(portfolioRoot, "public");
const portfolioAboutFile = path.join(portfolioRoot, "content", "about.md");
const portfolioSiteFile = path.join(portfolioRoot, "content", "site.yml");

function scalar(value = "") {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith('"')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed.slice(1, -1);
    }
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replaceAll("''", "'");
  }
  return trimmed;
}

function field(source, name, indentation = "") {
  const match = source.match(new RegExp(`^${indentation}${name}:\\s*(.*)$`, "m"));
  return scalar(match?.[1]);
}

function splitProject(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error("Portfolio project files must begin with frontmatter.");
  return { frontmatter: match[1], body: match[2] };
}

function mediaFrom(frontmatter) {
  const lines = frontmatter.split("\n");
  const starts = lines
    .map((line, index) => (/^ {2}- kind:\s*/.test(line) ? index : -1))
    .filter((index) => index >= 0);

  return starts.map((start, itemIndex) => {
    const end = starts[itemIndex + 1] ?? lines.length;
    const block = lines.slice(start, end).join("\n");
    const src = field(block, "src", "    ") || field(block, "poster", "    ");
    const nestedSrc = block.match(/^ {6}- src:\s*(.*)$/m)?.[1];
    return {
      kind: field(block, "kind", "  - "),
      id: field(block, "id", "    "),
      src: src || scalar(nestedSrc),
      title: field(block, "title", "    "),
      alt: field(block, "alt", "    "),
      caption: field(block, "caption", "    "),
    };
  });
}

async function readProject(slug) {
  const filename = path.join(portfolioProjectsDirectory, slug, "project.md");
  const source = await readFile(filename, "utf8");
  const { frontmatter, body } = splitProject(source);
  return {
    type: "project",
    slug,
    title: field(frontmatter, "title"),
    order: Number(field(frontmatter, "order")) || 0,
    published: field(frontmatter, "published") !== "false",
    body: body.trim(),
    media: mediaFrom(frontmatter).filter((item) => item.id),
  };
}

export async function readPortfolioAbout() {
  const [body, siteSource] = await Promise.all([
    readFile(portfolioAboutFile, "utf8"),
    readFile(portfolioSiteFile, "utf8"),
  ]);
  return {
    type: "about",
    slug: "about",
    title: field(siteSource, "aboutLabel") || "About & contact",
    order: 0,
    published: true,
    body: body.trim(),
    email: field(siteSource, "email"),
    location: field(siteSource, "location"),
    media: [],
  };
}

export async function readPortfolioProjects() {
  const entries = await readdir(portfolioProjectsDirectory, { withFileTypes: true });
  const projects = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory() && /^project-\d+$/.test(entry.name))
      .map((entry) => readProject(entry.name)),
  );
  return projects.filter((project) => project.published).sort((a, b) => a.order - b.order);
}

function updateMediaCaptions(frontmatter, captions) {
  const lines = frontmatter.split("\n");
  const output = [];

  for (let index = 0; index < lines.length; ) {
    if (!/^ {2}- kind:\s*/.test(lines[index])) {
      output.push(lines[index]);
      index += 1;
      continue;
    }

    let end = index + 1;
    while (end < lines.length && !/^ {2}- kind:\s*/.test(lines[end])) end += 1;
    const block = lines.slice(index, end);
    const idLine = block.findIndex((line) => /^ {4}id:\s*/.test(line));
    const id = idLine >= 0 ? scalar(block[idLine].replace(/^ {4}id:\s*/, "")) : "";

    if (id && Object.hasOwn(captions, id)) {
      const caption = String(captions[id] || "").trim();
      const nextBlock = [...block];
      const captionLine = nextBlock.findIndex((line) => /^ {4}caption:\s*/.test(line));
      if (captionLine >= 0 && caption) {
        nextBlock[captionLine] = `    caption: ${JSON.stringify(caption)}`;
      } else if (captionLine >= 0) {
        nextBlock.splice(captionLine, 1);
      } else if (caption) {
        const insertion = nextBlock.findIndex((line) => /^ {4}id:\s*/.test(line)) + 1;
        nextBlock.splice(insertion, 0, `    caption: ${JSON.stringify(caption)}`);
      }
      output.push(...nextBlock);
    } else {
      output.push(...block);
    }
    index = end;
  }

  return output.join("\n");
}

export async function savePortfolioProject({ slug, title, body, captions = {} }) {
  if (!/^project-\d+$/.test(slug || "")) throw new Error("Choose a valid portfolio project.");
  const filename = path.join(portfolioProjectsDirectory, slug, "project.md");
  const source = await readFile(filename, "utf8");
  const parsed = splitProject(source);
  let frontmatter = parsed.frontmatter.replace(
    /^title:\s*.*$/m,
    `title: ${JSON.stringify(String(title || "Untitled").trim())}`,
  );
  frontmatter = updateMediaCaptions(frontmatter, captions);
  const nextSource = `---\n${frontmatter}\n---\n\n${String(body || "").trim()}\n`;
  const temporary = `${filename}.studio-save`;
  await writeFile(temporary, nextSource, "utf8");
  await rename(temporary, filename);
  return readProject(slug);
}

export async function savePortfolioAbout({ title, body, email, location }) {
  const siteSource = await readFile(portfolioSiteFile, "utf8");
  const nextSiteSource = siteSource
    .replace(/^aboutLabel:\s*.*$/m, `aboutLabel: ${JSON.stringify(String(title || "About & contact").trim())}`)
    .replace(/^email:\s*.*$/m, `email: ${JSON.stringify(String(email || "").trim())}`)
    .replace(/^location:\s*.*$/m, `location: ${JSON.stringify(String(location || "").trim())}`);
  const temporaryAbout = `${portfolioAboutFile}.studio-save`;
  const temporarySite = `${portfolioSiteFile}.studio-save`;
  await Promise.all([
    writeFile(temporaryAbout, `${String(body || "").trim()}\n`, "utf8"),
    writeFile(temporarySite, nextSiteSource, "utf8"),
  ]);
  await Promise.all([
    rename(temporaryAbout, portfolioAboutFile),
    rename(temporarySite, portfolioSiteFile),
  ]);
  return readPortfolioAbout();
}
