import type { Metadata } from "next";
import "./globals.css";
import { TypographyGuards } from "./TypographyGuards";

const author = {
  name: "Max Pfennighaus",
  url: "https://maxpfennig.haus/",
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://thinking.haus/#author",
      name: author.name,
      url: author.url,
      sameAs: [
        "https://thinking.haus/",
        "https://www.linkedin.com/in/mxpfe/",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://thinking.haus/#website",
      url: "https://thinking.haus/",
      name: "thinking.haus",
      description: "Notes on attention, work, and the occasional strange thing.",
      author: { "@id": "https://thinking.haus/#author" },
    },
  ],
};

export const metadata: Metadata = {
  applicationName: "thinking.haus",
  title: {
    default: "thinking.haus",
    template: "thinking.haus - %s",
  },
  description: "Notes on attention, work, and the occasional strange thing.",
  metadataBase: new URL("https://thinking.haus"),
  authors: [author],
  creator: author.name,
  publisher: author.name,
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
  },
  alternates: {
    types: {
      "application/rss+xml": "/rss.xml",
    },
  },
  openGraph: {
    siteName: "thinking.haus",
    title: "thinking.haus",
    description: "Notes on attention, work, and the occasional strange thing.",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "thinking.haus",
    description: "Notes on attention, work, and the occasional strange thing.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="me" href="https://github.com/mxpf" />
        <link rel="webmention" href="https://webmention.io/thinking.haus/webmention" />
      </head>
      <body>
        {children}
        <TypographyGuards />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
        <script defer src="/author-mode.js" />
        <script
          defer
          src="https://trackinghaus-alpha.vercel.app/tracker.js"
          data-site="thinkinghaus"
          data-endpoint="https://trackinghaus-alpha.vercel.app/api/collect"
        />
      </body>
    </html>
  );
}
