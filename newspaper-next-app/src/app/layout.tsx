import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SessionProviderWrapper from "@/components/auth/SessionProviderWrapper";
import "./globals.css";
import { getSiteSettings } from "@/lib/settingsService"; // Import the settings service

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Updated metadata function
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteName = settings.siteTitle || process.env.NEXT_PUBLIC_SITE_NAME || "Newspaper CMS";
  const siteDescription = settings.siteTagline || "Your favorite source for news!";
  const siteBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const icons = [];
  if (settings.faviconUrl) {
    icons.push({ rel: 'icon', url: settings.faviconUrl.startsWith('http') ? settings.faviconUrl : new URL(settings.faviconUrl, siteBaseUrl).toString() });
    // You might want to add other icon types like apple-touch-icon here as well
    // icons.push({ rel: 'apple-touch-icon', url: '/apple-icon.png' }); // Example
  } else {
    icons.push({ rel: 'icon', url: '/favicon.ico' }); // Default fallback
  }


  return {
    metadataBase: new URL(siteBaseUrl), // Important for resolving relative asset URLs in metadata
    title: {
      default: siteName, // Default title for the site (e.g., on the homepage)
      template: `%s | ${siteName}`, // Template for titles on other pages
    },
    description: siteDescription,
    icons: icons,
    // Open Graph base settings (can be overridden by specific pages)
    openGraph: {
      title: { default: siteName, template: `%s | ${siteName}` },
      description: siteDescription,
      siteName: siteName,
      url: siteBaseUrl, // Base URL for the site
      images: settings.defaultOgImage ? [{ url: settings.defaultOgImage.startsWith('http') ? settings.defaultOgImage : new URL(settings.defaultOgImage, siteBaseUrl).toString() }] : [{url: new URL('/default-og-image.png', siteBaseUrl).toString()}], // Default OG image
      type: 'website',
    },
    // Twitter base settings
    twitter: {
      card: 'summary_large_image',
      title: { default: siteName, template: `%s | ${siteName}` },
      description: siteDescription,
      images: settings.defaultOgImage ? [settings.defaultOgImage.startsWith('http') ? settings.defaultOgImage : new URL(settings.defaultOgImage, siteBaseUrl).toString()] : [new URL('/default-og-image.png', siteBaseUrl).toString()],
      // site: '@YourTwitterHandle', // Add your site's Twitter handle
    },
  };
}

import Image from 'next/image'; // For displaying the logo

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings(); // Fetch settings for use in body

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <SessionProviderWrapper>
          {/* Basic Conceptual Header */}
          <header className="bg-gray-800 text-white p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
              <Link href="/" className="text-xl font-bold hover:text-gray-300">
                {settings.logoUrl ? (
                  <Image
                    src={settings.logoUrl.startsWith('http') ? settings.logoUrl : settings.logoUrl} // Assuming relative paths are from /public
                    alt={`${settings.siteTitle} Logo`}
                    width={150} // Example width
                    height={50}  // Example height
                    className="h-10 w-auto" // Adjust styling as needed
                    priority // If logo is LCP
                  />
                ) : (
                  settings.siteTitle
                )}
              </Link>
              {/* Basic Nav Placeholder - can be expanded */}
              <nav className="space-x-4">
                <Link href="/" className="hover:text-gray-300">Home</Link>
                <Link href="/search" className="hover:text-gray-300">Search</Link>
                {/* Add other nav links, possibly from settings or a dedicated menu system later */}
              </nav>
            </div>
          </header>

          <main className="flex-grow"> {/* Ensure main content area can grow */}
            {children}
          </main>

          {/* Basic Conceptual Footer */}
          <footer className="bg-gray-700 text-white p-4 text-center text-sm mt-auto">
            <p>&copy; {new Date().getFullYear()} {settings.siteTitle}. All rights reserved.</p>
            {/* Social links could go here, fetched from settings later */}
          </footer>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
