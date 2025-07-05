import Link from "next/link";
import { ICategory } from "@/models/Category";
import CategoryListClient from "./CategoryListClient"; // We'll create this client component

async function getCategories(): Promise<ICategory[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/categories`, {
      cache: "no-store", // Always fetch fresh data for admin panel
    });
    if (!res.ok) {
      throw new Error("Failed to fetch categories");
    }
    const data = await res.json();
    return data.data as ICategory[];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return []; // Return empty array on error
  }
}

export default async function AdminCategoryListPage() {
  const categories = await getCategories();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Manage Categories</h1>
        <Link
          href="/admin/category/add"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Add New Category
        </Link>
      </div>

      {categories.length === 0 ? (
        <p className="text-gray-600">No categories found. <Link href="/admin/category/add" className="text-indigo-600 hover:underline">Add one now</Link>.</p>
      ) : (
        <CategoryListClient categories={categories} />
      )}
    </div>
  );
}

// Opt out of static generation for this page as it's dynamic
export const dynamic = "force-dynamic";
