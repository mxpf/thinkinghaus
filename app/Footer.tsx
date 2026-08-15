/* eslint-disable @next/next/no-html-link-for-pages */

export function Footer({ showBrand = false }: { showBrand?: boolean }) {
  return (
    <footer className="footer">
      {showBrand ? <a className="footer-brand" href="/">Thinkinghaus</a> : null}
      <nav className="footer-links" aria-label="Site">
        <a href="https://maxpfennig.haus/" rel="me">Work</a>
        <a href="/about">About</a>
        <a href="/links">Links</a>
        <a href="/now">Now</a>
        <a href="https://trackinghaus-alpha.vercel.app">Stats</a>
        <a href="/rss.xml" type="application/rss+xml">RSS</a>
      </nav>
    </footer>
  );
}
