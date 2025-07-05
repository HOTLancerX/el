import Link from "next/link";
import { INews } from "@/models/News";
import PostListClient from "./PostListClient"; // To be created

// Default admin page is the post list

async function getPosts(page: number = 1, limit: number = 20): Promise<{posts: INews[], pagination: any}> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${appUrl}/api/admin/posts?page=${page}&limit=${limit}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`Failed to fetch posts: ${res.status} ${await res.text()}`);
      throw new Error("Failed to fetch posts");
    }
    const data = await res.json();
    return { posts: data.data as INews[], pagination: data.pagination };
  } catch (error) {
    console.error("Error in getPosts (admin page):", error);
    return { posts: [], pagination: { currentPage: 1, totalPages: 1, totalPosts: 0, limit } };
  }
}

interface AdminDashboardPageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  const currentPage = typeof searchParams?.page === 'string' ? parseInt(searchParams.page, 10) : 1;
  const currentLimit = typeof searchParams?.limit === 'string' ? parseInt(searchParams.limit, 10) : 20;

  const { posts, pagination } = await getPosts(currentPage, currentLimit);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Manage News Posts</h1>
        {/* No "Add New Post" button as posts come from RSS feeds */}
      </div>

      {posts.length === 0 && pagination.totalPosts === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center">
            <p className="text-gray-600 text-lg">No posts found.</p>
            <p className="text-gray-500 mt-2">Posts will appear here once they are fetched from RSS feeds.</p>
            <Link href="/admin/feed" className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                Manage RSS Feeds
            </Link>
        </div>
      ) : (
        <PostListClient initialPosts={posts} initialPagination={pagination} />
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
