import { generatedPages } from "./generated-pages";
import { generatedNowEntries } from "./generated-now";
import { generatedPosts } from "./generated-posts";
import { stripInlineMarkdown } from "./inline-markdown";

export type Post = {
  title: string;
  slug: string;
  date: string;
  readingTime: string;
  paragraphs: readonly string[];
  source?: { readonly label: string; readonly href: string };
};

export const posts: readonly Post[] = generatedPosts;

type NowEntry = {
  title: "Now";
  slug: string;
  date: string;
  paragraphs: readonly string[];
};

const nowEntries: readonly NowEntry[] = generatedNowEntries;
export const currentNow = nowEntries[0];

export type StandalonePage = {
  title: string;
  slug: string;
  paragraphs: readonly string[];
};

export const standalonePages: readonly StandalonePage[] = generatedPages;

export type LinkPreview = {
  title: string;
  date?: string;
  readingTime?: string;
  excerpt: string;
};

function previewExcerpt(paragraphs: readonly string[]) {
  const text = stripInlineMarkdown(paragraphs.find(Boolean) || "")
    .replace(/^\s*-\s+/, "")
    .trim();
  if (text.length <= 220) return text;

  const shortened = text.slice(0, 221);
  const lastSpace = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, lastSpace > 160 ? lastSpace : 220).trimEnd()}…`;
}

function internalSlug(href: string) {
  if (href.startsWith("#")) return undefined;

  try {
    const url = new URL(href, "https://thinking.haus");
    if (url.hostname !== "thinking.haus" && url.hostname !== "www.thinking.haus") {
      return undefined;
    }

    const pathname = url.pathname.replace(/\/+$/, "") || "/";
    if (pathname === "/") return undefined;
    return decodeURIComponent(pathname.slice(1)).replace(/\.html$/, "");
  } catch {
    return undefined;
  }
}

export function getLinkPreview(href: string): LinkPreview | undefined {
  const slug = internalSlug(href);
  if (!slug) return undefined;

  if (slug === "now" && currentNow) {
    return {
      title: currentNow.title,
      date: currentNow.date,
      excerpt: previewExcerpt(currentNow.paragraphs),
    };
  }

  const post = getPost(slug);
  if (post) {
    return {
      title: post.title,
      date: post.date,
      readingTime: post.readingTime,
      excerpt: previewExcerpt(post.paragraphs),
    };
  }

  const page = getStandalonePage(slug);
  if (page) {
    return {
      title: page.title,
      excerpt: previewExcerpt(page.paragraphs),
    };
  }

  return undefined;
}

export function getPost(slug: string) {
  return posts.find((post) => post.slug === slug);
}

export function getStandalonePage(slug: string) {
  return standalonePages.find((page) => page.slug === slug);
}
