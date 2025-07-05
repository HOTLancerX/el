import PostForm from "@/components/admin/PostForm";
import { INews } from "@/models/News";
import { ICategory } from "@/models/Category";
import Link from "next/link";
import { notFound } from "next/navigation";

async function getPost(id: string): Promise<INews | null> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${appUrl}/api/admin/posts/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      console.error(`Failed to fetch post ${id}: ${res.status} ${await res.text()}`);
      throw new Error("Failed to fetch post data");
    }
    const data = await res.json();
    return data.data as INews;
  } catch (error) {
    console.error("Error in getPost function:", error);
    return null;
  }
}

async function getCategories(): Promise<ICategory[]> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${appUrl}/api/admin/categories`, {
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`Failed to fetch categories: ${res.status} ${await res.text()}`);
      throw new Error("Failed to fetch categories for post form");
    }
    const data = await res.json();
    return data.data as ICategory[];
  } catch (error) {
    console.error("Error in getCategories for post edit:", error);
    return [];
  }
}


export default async function AdminEditPostPage({ params }: { params: { id: string } }) {
  if (!params.id) {
    notFound();
  }

  const [post, categories] = await Promise.all([
    getPost(params.id),
    getCategories()
  ]);

  if (!post) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Edit Post</h1>
        <Link href="/admin" className="text-indigo-600 hover:text-indigo-800 font-medium">
          &larr; Back to Post List
        </Link>
      </div>
      <div className="max-w-3xl mx-auto">
        <PostForm initialData={post} categories={categories} />
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
