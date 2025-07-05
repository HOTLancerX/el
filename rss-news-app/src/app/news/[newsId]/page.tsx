import { INews } from "@/models/News";
import { ICategory } from "@/models/Category";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import mongoose from "mongoose";

async function getNewsDetail(id: string): Promise<INews | null> {
   if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  try {
    // This could be a dedicated public API endpoint or directly fetch from DB
    // For now, using the admin one for simplicity if it allows public-like access for GET
    // Or, ideally, a new /api/news/[id] endpoint.
    // Let's assume we'll use a direct DB fetch here or a new specific public API endpoint.
    // For now, I'll simulate fetching by adapting the admin GET logic (without auth for GET).

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    // Ideally, this would be a public route like /api/news/${id}
    // Using admin post route for now, as it fetches populated category.
    const res = await fetch(`${appUrl}/api/admin/posts/${id}`, {
        cache: "no-store" // Or ISR revalidation
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      console.error(`Failed to fetch news detail ${id}: ${res.status} ${await res.text()}`);
      throw new Error("Failed to fetch news detail");
    }
    const data = await res.json();
    if (!data.success || !data.data.isActive) { // Also check if post is active
        return null; // Treat inactive posts as not found for public
    }
    return data.data as INews;
  } catch (error) {
    console.error(`Error in getNewsDetail for ${id}:`, error);
    return null;
  }
}

const formatDate = (dateString?: Date | string): string => {
  if (!dateString) return "Date not available";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(dateString);
  }
};

const getFaviconUrl = (domain?: string) => {
    if (!domain) return "/placeholder-favicon.svg";
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
};

const getWebsiteName = (domain?: string) => {
    if (!domain) return "Unknown Source";
    const parts = domain.replace(/^www\./, "").split('.');
    return parts.length > 1 ? parts[0] : parts[0];
};


export default async function NewsDetailPage({ params }: { params: { newsId: string } }) {
  const { newsId } = params;
  const newsItem = await getNewsDetail(newsId);

  if (!newsItem) {
    notFound();
  }

  const category = newsItem.category as ICategory; // Type assertion

  // Basic content sanitization or use a library like DOMPurify if HTML is directly rendered
  // For now, assuming description is relatively safe or pre-processed.
  // If description contains HTML and needs to be rendered, use dangerouslySetInnerHTML with caution.
  // The rssProcessor currently strips HTML, so this should be plain text.

  return (
    <main className="bg-gray-50 py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <article className="bg-white shadow-xl rounded-lg overflow-hidden">
          {newsItem.images && newsItem.images.length > 0 && (
            <div className="w-full h-64 md:h-96 relative">
              <Image
                src={newsItem.images[0]}
                alt={newsItem.title}
                fill
                style={{objectFit:"cover"}}
                priority
              />
            </div>
          )}

          <div className="p-6 md:p-10">
            <div className="mb-6">
                {category && (
                     <Link href={`/category/${category._id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 uppercase tracking-wider">
                        {category.title}
                     </Link>
                )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {newsItem.title}
            </h1>

            <div className="flex items-center text-sm text-gray-500 mb-6 space-x-4">
              {newsItem.domain && (
                <div className="flex items-center">
                  <Image
                    src={getFaviconUrl(newsItem.domain)}
                    alt={`${newsItem.domain} favicon`}
                    className="w-5 h-5 mr-2 rounded-full"
                    width={20}
                    height={20}
                     onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <span>{getWebsiteName(newsItem.domain)}</span>
                </div>
              )}
              <span>{formatDate(newsItem.pubDate)}</span>
            </div>

            {/* Render description. If it can contain HTML, use dangerouslySetInnerHTML with sanitized HTML. */}
            {/* Assuming description is plain text from rssProcessor */}
            <div
              className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
              // If description contains HTML from source and it's trusted/sanitized:
              // dangerouslySetInnerHTML={{ __html: newsItem.description || "" }}
            >
                {/* Split by newline to create paragraphs for plain text */}
                {(newsItem.description || "").split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                ))}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <Link
                href={newsItem.source_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-5 py-2.5 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Read Original Article
                <svg className="ml-2 -mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
              </Link>
            </div>

            <div className="mt-8 text-center">
                <Link href="/" className="text-indigo-600 hover:text-indigo-800 font-medium">
                    &larr; Back to All News
                </Link>
            </div>

          </div>
        </article>
      </div>
    </main>
  );
}

export async function generateMetadata({ params }: { params: { newsId: string } }) {
  const newsItem = await getNewsDetail(params.newsId);
  if (!newsItem) {
    return {
      title: "News Not Found",
    };
  }
  return {
    title: newsItem.title,
    description: (newsItem.description || "").substring(0, 160), // SEO description
    openGraph: {
        title: newsItem.title,
        description: (newsItem.description || "").substring(0, 160),
        images: newsItem.images?.length ? [newsItem.images[0]] : [],
        url: `/news/${newsItem._id}`,
        type: 'article',
        publishedTime: newsItem.pubDate?.toISOString(),
    },
    twitter: {
        card: 'summary_large_image',
        title: newsItem.title,
        description: (newsItem.description || "").substring(0, 160),
        images: newsItem.images?.length ? [newsItem.images[0]] : [],
    }
  };
}

export const dynamic = "force-dynamic";
