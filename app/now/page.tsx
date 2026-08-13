/* eslint-disable @next/next/no-html-link-for-pages */
import type { Metadata } from "next";
import { Footer } from "../Footer";
import { InlineText } from "../InlineText";
import { LetterCascade } from "../LetterCascade";
import { stripInlineMarkdown } from "../inline-markdown";
import { currentNow } from "../posts";

export const metadata: Metadata = {
  title: "Now — Thinkinghaus",
  description: currentNow
    ? stripInlineMarkdown(currentNow.paragraphs[0])
    : "What is holding my attention now.",
  alternates: {
    canonical: "/now",
    types: { "application/rss+xml": "/rss.xml" },
  },
};

export default function NowPage() {
  return (
    <main className="site article-page">
      <div className="article-frame">
        <a className="desktop-brand" href="/"><LetterCascade text="Thinkinghaus" /></a>
        <article
          className="article-column"
          data-content-slug={currentNow?.slug || ""}
          data-content-title="Now"
        >
          <header className="article-header">
            <h1>Now</h1>
            {currentNow ? <p>{currentNow.date}</p> : null}
            {currentNow ? (
              <p className="author-edit-action" hidden>
                <a href="https://thinkinghaus-studio.maxpfennighaus.workers.dev/">Edit</a>
              </p>
            ) : null}
          </header>
          <div className="article-body">
            {currentNow ? (
              <>
                {currentNow.paragraphs.map((paragraph, index) => (
                  <p
                    className={/^[“‘"']/.test(stripInlineMarkdown(paragraph).trimStart()) ? "optical-margin-fallback" : undefined}
                    key={`${index}-${paragraph}`}
                  >
                    <InlineText text={paragraph} />
                  </p>
                ))}
                <p>
                  This page is inspired by <a href="https://sive.rs/nowff">Derek Sivers&apos; /now idea</a>: a simple page for what you&apos;re actually paying attention to right now.
                </p>
              </>
            ) : <p>Nothing here yet.</p>}
          </div>
          <Footer showBrand />
        </article>
      </div>
    </main>
  );
}
