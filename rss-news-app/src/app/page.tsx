import NewsList from "@/components/news/NewsList";
import { INews } from "@/models/News";

const NEWS_PER_PAGE_INITIAL = 30;

async function getInitialNews(page: number = 1, limit: number = NEWS_PER_PAGE_INITIAL): Promise<{ news: INews[], hasMore: boolean, currentPage: number }> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    // Using the API route we created for fetching news
    const res = await fetch(`${appUrl}/api/news?page=${page}&limit=${limit}`, {
      cache: "no-store", // For dynamic content, or use revalidate tags/time
    });

    if (!res.ok) {
      console.error(`Failed to fetch initial news: ${res.status} ${await res.text()}`);
      // Fallback or throw error to be caught by Next.js error boundary
      return { news: [], hasMore: false, currentPage: page };
    }

    const data = await res.json();
    if (!data.success) {
      console.error("API returned error for initial news:", data.error);
      return { news: [], hasMore: false, currentPage: page };
    }

    return {
        news: data.data as INews[],
        hasMore: data.pagination.hasMore,
        currentPage: data.pagination.currentPage
    };

  } catch (error) {
    console.error("Error in getInitialNews (app/page.tsx):", error);
    return { news: [], hasMore: false, currentPage: page };
  }
}

export default async function HomePage() {
  const { news, hasMore, currentPage } = await getInitialNews();

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Placeholder for a potential header or featured section later */}
      {/* <header className="py-6 bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-indigo-700">Latest News</h1>
        </div>
      </header> */}

      <NewsList initialNews={news} initialHasMore={hasMore} initialPage={currentPage} />
    </main>
  );
}

// Opt out of static generation for this page if content is highly dynamic
// or use revalidate for ISR
export const dynamic = "force-dynamic";
// export const revalidate = 60; // Revalidate every 60 seconds for ISR (example)
