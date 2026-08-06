import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "../Footer";
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
      <main className="site article-page">
        <div className="article-frame">
          <Link className="desktop-brand" href="/">Thinkinghaus</Link>
          <article className="article-column">
            <h1>Nothing here yet.</h1>
            <p><Link href="/">Back to the notes.</Link></p>
          </article>
        </div>
      </main>
    );
  }

  return (
    <main className="site article-page">
      <div className="article-frame">
        <Link className="desktop-brand" href="/">Thinkinghaus</Link>
        <article className="article-column">
          <header className="article-header">
            <h1>{post.title}</h1>
            <p>{post.date}</p>
            <p>{post.readingTime}</p>
          </header>
          <div className="article-body">
            {post.paragraphs.map((paragraph, index) => (
              <p key={`${index}-${paragraph}`}>{paragraph}</p>
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
