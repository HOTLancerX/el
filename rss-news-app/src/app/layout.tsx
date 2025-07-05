import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";

const inter = Inter({ subsets: ["latin"], display: 'swap' });

export const metadata: Metadata = {
  title: {
    default: "NewsHub - Your Daily News Aggregator",
    template: "%s | NewsHub",
  },
  description: "Stay updated with the latest news from various sources, all in one place.",
  keywords: ["news", "rss", "aggregator", "latest news", "headlines"],
  authors: [{ name: "NewsHub Team" }],
  // Add more metadata as needed: openGraph, twitter, etc.
  // Basic OpenGraph for homepage sharing
  openGraph: {
    title: "NewsHub - Your Daily News Aggregator",
    description: "Stay updated with the latest news from various sources, all in one place.",
    type: "website",
    // images: [{ url: '/og-image.png' }], // Add an actual OG image URL
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} flex flex-col min-h-screen bg-gray-50`}>
        {/* This layout is for public pages. Admin has its own layout. */}
        <PublicHeader />
        <main className="flex-grow">
          {children}
        </main>
        <PublicFooter />
      </body>
    </html>
  );
}
