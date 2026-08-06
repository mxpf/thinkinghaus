/* eslint-disable @next/next/no-html-link-for-pages */
import type { Metadata } from "next";
import { Footer } from "../Footer";
import { InlineText } from "../InlineText";
import { stripInlineMarkdown } from "../inline-markdown";
import { getPost, posts } from "../posts";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return posts.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  return {
    title: post ? `${post.title} — Thinkinghaus` : "Thinkinghaus",
    description: post ? stripInlineMarkdown(post.paragraphs[0]) : undefined,
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) {
    return (
      <main className="site article-page">
        <div className="article-frame">
          <a className="desktop-brand" href="/">Thinkinghaus</a>
          <article className="article-column">
            <h1>Nothing here yet.</h1>
            <p><a href="/">Back to the notes.</a></p>
          </article>
        </div>
      </main>
    );
  }

  return (
    <main className="site article-page">
      <div className="article-frame">
        <a className="desktop-brand" href="/">Thinkinghaus</a>
        <article className="article-column">
          <header className="article-header">
            <h1>{post.title}</h1>
            <p>{post.date}</p>
            <p>{post.readingTime}</p>
          </header>
          <div className="article-body">
            {post.paragraphs.map((paragraph, index) => (
              <p key={`${index}-${paragraph}`}><InlineText text={paragraph} /></p>
            ))}
            {post.source ? (
              <p className="article-source"><a href={post.source.href}>{post.source.label}</a></p>
            ) : null}
          </div>
          <Footer showBrand />
        </article>
      </div>
    </main>
  );
}
