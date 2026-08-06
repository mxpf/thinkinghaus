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

export function getPost(slug: string) {
  return posts.find((post) => post.slug === slug);
}
