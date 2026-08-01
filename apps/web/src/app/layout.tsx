import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

// JetBrains Mono is self-hosted via next/font (data/IDs/hashes/timestamps)
// and owns the --font-mono variable. Clash Display (display) + Satoshi
// (UI/body) are the brand typefaces, loaded from Fontshare (Indian Type
// Foundry) — the India-grounded choice per PROJECT_BRAND_GUIDELINES.md §4.
// --font-display and --font-text are declared in globals.css.
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sakhaa Signal, creative studio instrument",
  description: "Creative analysis studio for short-form video.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=clash-display@500,600,700&f[]=satoshi@400,500,700&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}