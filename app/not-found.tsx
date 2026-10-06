/* eslint-disable @next/next/no-html-link-for-pages */
import type { Metadata } from "next";
import { SITE_NAME } from "../site-config.mjs";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <main className="site not-found-page">
      <div className="article-frame">
        <a className="desktop-brand not-found-brand" href="/">{SITE_NAME}</a>
        <article className="article-column not-found-column">
          <h1>Page not found</h1>
          <p>There is no page at this address.</p>
          <p><a href="/">Return home</a>.</p>
        </article>
      </div>
    </main>
  );
}
