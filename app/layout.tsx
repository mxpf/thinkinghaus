import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Thinkinghaus",
    template: "Thinkinghaus - %s",
  },
  description: "Notes on attention, work, and the occasional strange thing.",
  metadataBase: new URL("https://thinking.haus"),
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
    title: "Thinkinghaus",
    description: "Notes on attention, work, and the occasional strange thing.",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Thinkinghaus",
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
        <link rel="webmention" href="https://webmention.io/thinking.haus/webmention" />
      </head>
      <body>
        {children}
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
