"use client";

import { ICategory } from "@/models/Category";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CategoryListClientProps {
  categories: ICategory[];
}

export default function CategoryListClient({ categories: initialCategories }: CategoryListClientProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<ICategory[]>(initialCategories);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // Store ID of category being deleted

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category? This action cannot be undone.")) {
      return;
    }
    setIsDeleting(id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to delete category");
      }
      // Update state to remove deleted category
      setCategories((prevCategories) => prevCategories.filter((cat) => cat._id !== id));
      router.refresh(); // Or revalidatePath if needed, to ensure server components are updated
    } catch (err: any) {
      console.error("Delete error:", err);
      setError(err.message || "An error occurred while deleting.");
    } finally {
      setIsDeleting(null);
    }
  };

  if (categories.length === 0 && initialCategories.length > 0) {
    // This can happen if all categories are deleted client-side
    return <p className="text-gray-600">All categories have been deleted.</p>;
  }

  if (initialCategories.length === 0) {
     // This case is handled by the server component, but good to have a fallback
    return <p className="text-gray-600">No categories found. <Link href="/admin/category/add" className="text-indigo-600 hover:underline">Add one now</Link>.</p>;
  }


  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-md">{error}</div>}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Title
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Image
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Logo
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created At
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {categories.map((category) => (
            <tr key={category._id as string}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{category.title}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {category.images ? (
                  <img src={category.images} alt={category.title} className="h-10 w-16 object-cover rounded" />
                ) : (
                  <span className="text-xs text-gray-500">No Image</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {category.logo_img ? (
                  <img src={category.logo_img} alt={`${category.title} Logo`} className="h-10 w-10 object-contain rounded" />
                ) : (
                  <span className="text-xs text-gray-500">No Logo</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(category.createdAt!).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Link href={`/admin/category/${category._id}`} className="text-indigo-600 hover:text-indigo-900 mr-3">
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(category._id as string)}
                  disabled={isDeleting === (category._id as string)}
                  className={`text-red-600 hover:text-red-900 ${isDeleting === (category._id as string) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isDeleting === (category._id as string) ? "Deleting..." : "Delete"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
