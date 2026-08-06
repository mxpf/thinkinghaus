import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thinkinghaus",
  description: "Notes on attention, work, and the occasional strange thing.",
  metadataBase: new URL("https://thinking.haus"),
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
      <body>{children}</body>
    </html>
  );
}
