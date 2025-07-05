import Link from "next/link";
import { IFeed } from "@/models/Feed";
import { ICategory } from "@/models/Category";
import FeedForm from "@/components/admin/FeedForm";
import FeedListClient from "./FeedListClient"; // We'll create this client component

async function getFeeds(): Promise<IFeed[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/feeds`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch feeds");
    const data = await res.json();
    return data.data as IFeed[];
  } catch (error) {
    console.error("Error fetching feeds:", error);
    return [];
  }
}

async function getCategories(): Promise<ICategory[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/categories`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch categories");
    const data = await res.json();
    return data.data as ICategory[];
  } catch (error) {
    console.error("Error fetching categories for feed form:", error);
    return [];
  }
}

export default async function AdminFeedPage() {
  const [feeds, categories] = await Promise.all([getFeeds(), getCategories()]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Feed</h2>
          <FeedForm categories={categories} />
        </div>
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Existing Feeds</h2>
          {feeds.length === 0 ? (
            <p className="text-gray-600 bg-white p-4 rounded-lg shadow">No feeds found. Add one using the form.</p>
          ) : (
            <FeedListClient feeds={feeds} categories={categories} />
          )}
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
