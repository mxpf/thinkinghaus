/* eslint-disable @next/next/no-html-link-for-pages */
"use client";

import { useEffect, useState } from "react";
import { AUTHOR, RSS_PATH, SITE_NAME, TRACKINGHAUS } from "../site-config.mjs";

export function Footer({
  showBrand = false,
  revealAtEnd = false,
}: {
  showBrand?: boolean;
  revealAtEnd?: boolean;
}) {
  const [revealIsArmed, setRevealIsArmed] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    if (!revealAtEnd) return;

    const revealAtScrollEnd = () => {
      const distanceToEnd = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
      if (distanceToEnd <= 1) setIsRevealed(true);
    };

    const animationFrame = window.requestAnimationFrame(() => {
      setRevealIsArmed(true);
      revealAtScrollEnd();
    });
    window.addEventListener("scroll", revealAtScrollEnd, { passive: true });
    window.addEventListener("resize", revealAtScrollEnd);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", revealAtScrollEnd);
      window.removeEventListener("resize", revealAtScrollEnd);
    };
  }, [revealAtEnd]);

  const className = [
    "footer",
    revealAtEnd && "footer--end-reveal",
    revealIsArmed && "is-armed",
    isRevealed && "is-revealed",
  ].filter(Boolean).join(" ");

  return (
    <footer className={className}>
      {showBrand ? <a className="footer-brand" href="/">{SITE_NAME}</a> : null}
      <nav className="footer-links" aria-label="Site">
        <span className="footer-link-group">
          <a href={AUTHOR.url} rel="me">Work</a>
          <a href="/about">About</a>
          <a href="/links">Links</a>
          <a href="/now">Now</a>
        </span>
        <span className="footer-link-group">
          <a href={TRACKINGHAUS.dashboardUrl}>Stats</a>
          <a href={RSS_PATH} type="application/rss+xml">RSS</a>
        </span>
      </nav>
    </footer>
  );
}
