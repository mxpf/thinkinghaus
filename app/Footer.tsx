/* eslint-disable @next/next/no-html-link-for-pages */

export function Footer({ showBrand = false }: { showBrand?: boolean }) {
  return (
    <footer className="footer">
      {showBrand ? <a className="footer-brand" href="/">Thinkinghaus</a> : null}
      <nav className="footer-links" aria-label="Site">
        <a href="mailto:hello@thinking.haus">About</a>
        <a href="/" aria-current="page">Lists</a>
      </nav>
    </footer>
  );
}
