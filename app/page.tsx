import Link from "next/link";
import { posts } from "./posts";

export default function Home() {
  return (
    <main className="site-shell">
      <header className="site-header">
        <Link className="wordmark" href="/">Thinkinghaus</Link>
        <p>Notes on attention, work, and the occasional strange thing.</p>
      </header>

      <section className="intro" aria-labelledby="intro-heading">
        <h1 id="intro-heading">A place to keep looking.</h1>
        <p>
          Writing about design, books, films, places, and whatever else helps
          me stay interested.
        </p>
      </section>

      <section aria-labelledby="writing-heading">
        <div className="section-heading">
          <h2 id="writing-heading">Writing</h2>
          <p>{posts.length} notes so far</p>
        </div>
        <ol className="post-list">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link href={`/${post.slug}`}>
                <span>{post.title}</span>
                <span>{post.readingTime}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <footer className="site-footer">
        <span>Thinkinghaus</span>
        <a href="mailto:hello@thinking.haus">hello@thinking.haus</a>
      </footer>
    </main>
  );
}
