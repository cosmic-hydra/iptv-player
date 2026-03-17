import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IPTV Player",
  description: "Stream live TV channels from the iptv-org playlist",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* DNS prefetch and preconnect for faster streaming */}
        <link rel="dns-prefetch" href="https://raw.githubusercontent.com" />
        <link rel="preconnect" href="https://raw.githubusercontent.com" crossOrigin="anonymous" />
        {/* Common CDN domains that might host streams */}
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
        <link rel="dns-prefetch" href="https://cloudflare.com" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
