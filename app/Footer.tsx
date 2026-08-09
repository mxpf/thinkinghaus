/* eslint-disable @next/next/no-html-link-for-pages */

const staticExport = process.env.STATIC_EXPORT === "1";

export function Footer({ showBrand = false }: { showBrand?: boolean }) {
  return (
    <footer className="footer">
      {showBrand ? <a className="footer-brand" href="/">Thinkinghaus</a> : null}
      <nav className="footer-links" aria-label="Site">
        <a href={staticExport ? "/about.html" : "/about"}>About</a>
        <a href={staticExport ? "/links.html" : "/links"}>Links</a>
        <a href="https://trackinghaus-alpha.vercel.app">Stats</a>
      </nav>
    </footer>
  );
}
