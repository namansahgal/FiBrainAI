import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FiBrainAI — Your AI CFO for Startups",
  description:
    "FiBrainAI is the on-demand financial intelligence engine that gives startup founders real-time burn rate, runway, and CFO-level insights — no spreadsheets needed.",
  keywords: ["AI CFO", "startup finance", "burn rate", "runway tracker", "financial intelligence", "FiBrainAI"],
  authors: [{ name: "Naman Sahgal" }],
  openGraph: {
    title: "FiBrainAI — Your AI CFO for Startups",
    description:
      "Real-time burn rate, runway, and CFO-level financial insights for startup founders. No spreadsheets needed.",
    type: "website",
    locale: "en_IN",
    siteName: "FiBrainAI",
  },
  twitter: {
    card: "summary_large_image",
    title: "FiBrainAI — Your AI CFO for Startups",
    description:
      "Real-time burn rate, runway, and CFO-level financial insights for startup founders.",
    creator: "@namansahgal",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
