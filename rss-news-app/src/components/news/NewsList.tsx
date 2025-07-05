"use client";

import { INews } from "@/models/News";
import { useState, useEffect, useCallback, useRef } from "react";
import NewsCard from "./NewsCard";

interface NewsListProps {
  initialNews: INews[];
  initialHasMore: boolean;
  categoryId?: string; // For category-specific news lists
  initialPage?: number;
}

const NEWS_PER_PAGE_INITIAL = 30;
const NEWS_PER_PAGE_MORE = 10;

export default function NewsList({ initialNews, initialHasMore, categoryId, initialPage = 1 }: NewsListProps) {
  const [newsItems, setNewsItems] = useState<INews[]>(initialNews);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(initialPage + 1); // Next page to fetch
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const fetchNews = useCallback(async (pageNum: number, limit: number) => {
    setIsLoading(true);
    setError(null);
    try {
      let url = `/api/news?page=${pageNum}&limit=${limit}`;
      if (categoryId) {
        url += `&categoryId=${categoryId}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch news");
      }
      const data = await response.json();
      return data;
    } catch (err: any) {
      console.error("Error fetching news:", err);
      setError(err.message || "Could not load more news. Please try again later.");
      return null; // Return null on error to stop further processing
    } finally {
      setIsLoading(false);
    }
  }, [categoryId]);

  const loadMoreNews = useCallback(async () => {
    if (!hasMore || isLoading) return;

    const data = await fetchNews(page, NEWS_PER_PAGE_MORE);
    if (data && data.success) {
      setNewsItems((prev) => [...prev, ...data.data]);
      setHasMore(data.pagination.hasMore);
      setPage((prevPage) => prevPage + 1);
    } else if (data === null) { // Error occurred during fetch
        setHasMore(false); // Stop trying to load more if there was an error
    }
  }, [page, hasMore, isLoading, fetchNews]);

  useEffect(() => {
    // Update state if initial props change (e.g., due to navigation or SSR refresh)
    setNewsItems(initialNews);
    setHasMore(initialHasMore);
    setPage(initialPage + 1);
  }, [initialNews, initialHasMore, initialPage]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMoreNews();
        }
      },
      { threshold: 0.5 } // Trigger when 50% of the loader is visible
    );

    const currentLoaderRef = loaderRef.current;
    if (currentLoaderRef) {
      observer.observe(currentLoaderRef);
    }

    return () => {
      if (currentLoaderRef) {
        observer.unobserve(currentLoaderRef);
      }
    };
  }, [hasMore, isLoading, loadMoreNews]);

  if (newsItems.length === 0 && !isLoading && !initialHasMore) {
    return (
      <div className="text-center py-12">
        <p className="text-2xl text-gray-500">No news items found.</p>
        {categoryId && <p className="text-gray-400 mt-2">There are no articles in this category yet.</p>}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-8">
      <div className="grid grid-cols-1 gap-0"> {/* No gap here, NewsCard has margin */}
        {newsItems.map((item) => (
          <NewsCard key={item._id as string} item={item} />
        ))}
      </div>

      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-3 text-gray-500">Loading more news...</p>
        </div>
      )}

      {error && (
         <div className="text-center py-8 bg-red-50 p-4 rounded-md">
          <p className="text-red-600 mb-2">{error}</p>
          <button
            onClick={loadMoreNews}
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            Try Again
          </button>
        </div>
      )}

      {!isLoading && !hasMore && newsItems.length > 0 && (
        <div className="text-center py-10 text-gray-500">
          <p>You've reached the end of the news feed.</p>
        </div>
      )}
      {/* Loader element for IntersectionObserver */}
      <div ref={loaderRef} style={{ height: "50px", margin: "20px" }} />
    </div>
  );
}
