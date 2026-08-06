import { generatedPages } from "./generated-pages";
import { generatedPosts } from "./generated-posts";

export type Post = {
  title: string;
  slug: string;
  date: string;
  readingTime: string;
  paragraphs: readonly string[];
  source?: { readonly label: string; readonly href: string };
};

export const posts: readonly Post[] = generatedPosts;

export type StandalonePage = {
  title: string;
  slug: string;
  paragraphs: readonly string[];
};

export const standalonePages: readonly StandalonePage[] = generatedPages;

export function getPost(slug: string) {
  return posts.find((post) => post.slug === slug);
}

export function getStandalonePage(slug: string) {
  return standalonePages.find((page) => page.slug === slug);
}
