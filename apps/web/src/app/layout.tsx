import type { Metadata } from "next";
import "./globals.css";

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
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans bg-[#0B0A09] text-[#F3F2EF]" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}