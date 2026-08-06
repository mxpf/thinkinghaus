import Link from "next/link";
import { Footer } from "./Footer";
import { posts } from "./posts";

const staticExport = process.env.STATIC_EXPORT === "1";

export default function Home() {
  return (
    <main className="site index-page">
      <div className="index-frame">
        <Link className="desktop-brand" href="/">Thinkinghaus</Link>
        <div className="index-column">
          <h1 className="sr-only">Thinkinghaus</h1>
          <ol className="post-list">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link href={staticExport ? `/${post.slug}.html` : `/${post.slug}`}>{post.title}</Link>
              </li>
            ))}
          </ol>
          <Footer showBrand />
        </div>
      </div>
    </main>
  );
}
