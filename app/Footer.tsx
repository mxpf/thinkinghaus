import Link from "next/link";

export function Footer({ showBrand = false }: { showBrand?: boolean }) {
  return (
    <footer className="footer">
      {showBrand ? <Link className="footer-brand" href="/">Thinkinghaus</Link> : null}
      <nav className="footer-links" aria-label="Site">
        <a href="mailto:hello@thinking.haus">About</a>
        <Link href="/" aria-current="page">Lists</Link>
      </nav>
    </footer>
  );
}
