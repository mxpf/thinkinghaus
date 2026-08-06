import type { Metadata } from "next";
import Link from "next/link";
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
    description: post?.paragraphs[0],
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) {
    return (
      <main className="article-shell">
        <Link className="article-brand wordmark" href="/">Thinkinghaus</Link>
        <article className="article">
          <h1>Nothing here yet.</h1>
          <p><Link href="/">Return to the notes.</Link></p>
        </article>
      </main>
    );
  }

  return (
    <main className="article-shell">
      <Link className="article-brand wordmark" href="/">Thinkinghaus</Link>
      <article className="article">
        <h1>{post.title}</h1>
        <p className="article-meta">
          <span>{post.date}</span>
          <span>{post.readingTime}</span>
        </p>
        <div className="article-body">
          {post.paragraphs.map((paragraph, index) => (
            <p key={`${index}-${paragraph}`}>{paragraph}</p>
          ))}
          {post.source ? (
            <p className="article-source"><a href={post.source.href}>{post.source.label}</a></p>
          ) : null}
        </div>
        <footer className="article-footer">
          <Link href="/">← All writing</Link>
        </footer>
      </article>
    </main>
  );
}
