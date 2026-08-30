import type { Metadata } from "next";
import {
  AUTHOR,
  RSS_PATH,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  TRACKINGHAUS,
  WEBMENTION_ENDPOINT,
} from "../site-config.mjs";
import "./globals.css";
import { TypographyGuards } from "./TypographyGuards";

const authorId = `${SITE_URL}/#author`;
const websiteId = `${SITE_URL}/#website`;

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": authorId,
      name: AUTHOR.name,
      url: AUTHOR.url,
      sameAs: [
        `${SITE_URL}/`,
        AUTHOR.linkedInUrl,
      ],
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      author: { "@id": authorId },
    },
  ],
};

export const metadata: Metadata = {
  applicationName: SITE_NAME,
  title: {
    default: SITE_NAME,
    template: `${SITE_NAME} - %s`,
  },
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  authors: [{ name: AUTHOR.name, url: AUTHOR.url }],
  creator: AUTHOR.name,
  publisher: AUTHOR.name,
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
  },
  alternates: {
    types: {
      "application/rss+xml": RSS_PATH,
    },
  },
  openGraph: {
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
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
        <link rel="me" href={AUTHOR.githubUrl} />
        <link rel="webmention" href={WEBMENTION_ENDPOINT} />
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
          src={TRACKINGHAUS.trackerUrl}
          data-site={TRACKINGHAUS.siteKey}
          data-endpoint={TRACKINGHAUS.collectUrl}
        />
      </body>
    </html>
  );
}
