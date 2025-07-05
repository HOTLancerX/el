import NewsList from "@/components/news/NewsList";
import { INews } from "@/models/News";
import { ICategory } from "@/models/Category"; // For fetching category details
import Link from "next/link";
import { notFound } from "next/navigation";
import mongoose from "mongoose";


const NEWS_PER_PAGE_INITIAL = 30;

async function getCategoryDetails(id: string): Promise<ICategory | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${appUrl}/api/admin/categories/${id}`, { cache: "no-store" }); // Using admin route for simplicity, could be a public one
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error("Failed to fetch category details");
    }
    const data = await res.json();
    return data.data as ICategory;
  } catch (error) {
    console.error("Error fetching category details:", error);
    return null;
  }
}


async function getCategoryNews(categoryId: string, page: number = 1, limit: number = NEWS_PER_PAGE_INITIAL): Promise<{ news: INews[], hasMore: boolean, currentPage: number }> {
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
     return { news: [], hasMore: false, currentPage: page };
  }
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${appUrl}/api/news?categoryId=${categoryId}&page=${page}&limit=${limit}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`Failed to fetch news for category ${categoryId}: ${res.status} ${await res.text()}`);
      return { news: [], hasMore: false, currentPage: page };
    }
    const data = await res.json();
     if (!data.success) {
      console.error(`API error for category ${categoryId} news:`, data.error);
      return { news: [], hasMore: false, currentPage: page };
    }
    return {
        news: data.data as INews[],
        hasMore: data.pagination.hasMore,
        currentPage: data.pagination.currentPage
    };
  } catch (error) {
    console.error(`Error in getCategoryNews for ${categoryId}:`, error);
    return { news: [], hasMore: false, currentPage: page };
  }
}

interface CategoryPageProps {
  params: { categoryId: string };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { categoryId } = params;

  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    notFound();
  }

  // Fetch category details and initial news in parallel
  const [categoryDetails, { news, hasMore, currentPage }] = await Promise.all([
    getCategoryDetails(categoryId),
    getCategoryNews(categoryId)
  ]);

  if (!categoryDetails) {
    notFound(); // If category doesn't exist
  }

  return (
    <main className="bg-gray-50 min-h-screen">
      <header className="py-6 md:py-10 bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-indigo-700 mb-2">
            {categoryDetails.title}
          </h1>
          {categoryDetails.logo_img && (
            <div className="flex justify-center my-4">
                <img src={categoryDetails.logo_img} alt={`${categoryDetails.title} logo`} className="max-h-16 object-contain"/>
            </div>
          )}
          <p className="text-gray-500 text-sm">
            Browsing news articles under the &quot;{categoryDetails.title}&quot; category.
          </p>
           <Link href="/" className="mt-4 inline-block text-indigo-600 hover:text-indigo-800 text-sm">
            &larr; Back to All News
          </Link>
        </div>
      </header>

      <NewsList
        initialNews={news}
        initialHasMore={hasMore}
        categoryId={categoryId}
        initialPage={currentPage}
      />
    </main>
  );
}

export const dynamic = "force-dynamic";
