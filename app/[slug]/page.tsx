/* eslint-disable @next/next/no-html-link-for-pages */
import type { Metadata } from "next";
import { Footer } from "../Footer";
import { InlineText } from "../InlineText";
import { stripInlineMarkdown } from "../inline-markdown";
import { getPost, getStandalonePage, posts, standalonePages } from "../posts";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return [...posts, ...standalonePages].map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  const standalonePage = getStandalonePage(slug);
  const content = post || standalonePage;
  return {
    title: content ? `${content.title} — Thinkinghaus` : "Thinkinghaus",
    description: content ? stripInlineMarkdown(content.paragraphs[0]) : undefined,
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPost(slug);
  const standalonePage = getStandalonePage(slug);
  const content = post || standalonePage;

  if (!content) {
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
            <h1>{content.title}</h1>
            {post ? <p>{post.date}</p> : null}
            {post ? <p>{post.readingTime}</p> : null}
          </header>
          <div className="article-body">
            {content.paragraphs.map((paragraph, index) => (
              <p key={`${index}-${paragraph}`}><InlineText text={paragraph} /></p>
            ))}
            {post?.source ? (
              <p className="article-source"><a href={post.source.href}>{post.source.label}</a></p>
            ) : null}
          </div>
          <Footer showBrand />
        </article>
      </div>
    </main>
  );
}
