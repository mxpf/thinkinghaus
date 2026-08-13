/* eslint-disable @next/next/no-html-link-for-pages */
import type { Metadata } from "next";
import type { ReactNode } from "react";
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

function NowEntryBody({ paragraphs }: { paragraphs: readonly string[] }) {
  const blocks: ReactNode[] = [];

  for (let index = 0; index < paragraphs.length;) {
    const paragraph = paragraphs[index];
    if (/^\s*-\s+/.test(paragraph)) {
      const listStart = index;
      const items = [];
      while (index < paragraphs.length && /^\s*-\s+/.test(paragraphs[index])) {
        const item = paragraphs[index].replace(/^\s*-\s+/, "");
        items.push(<li key={`${index}-${item}`}><InlineText text={item} /></li>);
        index += 1;
      }
      blocks.push(<ul className="article-list" key={`list-${listStart}`}>{items}</ul>);
      continue;
    }

    blocks.push(
      <p
        className={/^[“‘"']/.test(stripInlineMarkdown(paragraph).trimStart()) ? "optical-margin-fallback" : undefined}
        key={`${index}-${paragraph}`}
      >
        <InlineText text={paragraph} />
      </p>,
    );
    index += 1;
  }

  return blocks;
}

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
                <NowEntryBody paragraphs={currentNow.paragraphs} />
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
