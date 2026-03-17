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
      <body className="antialiased">{children}</body>
    </html>
  );
}
