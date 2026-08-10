/* eslint-disable @next/next/no-html-link-for-pages */
import { Footer } from "./Footer";
import { LetterCascade } from "./LetterCascade";
import { posts } from "./posts";

const staticExport = process.env.STATIC_EXPORT === "1";

export default function Home() {
  return (
    <main className="site index-page">
      <div className="index-frame">
        <a className="desktop-brand" href="/"><LetterCascade text="Thinkinghaus" /></a>
        <div className="index-column">
          <h1 className="sr-only">Thinkinghaus</h1>
          <ol className="post-list">
            {posts.map((post) => (
              <li key={post.slug}>
                <a href={staticExport ? `/${post.slug}.html` : `/${post.slug}`}>{post.title}</a>
              </li>
            ))}
          </ol>
          <Footer showBrand />
        </div>
      </div>
    </main>
  );
}
