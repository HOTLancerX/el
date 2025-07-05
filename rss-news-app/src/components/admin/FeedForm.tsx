"use client";

import { IFeed } from "@/models/Feed";
import { ICategory } from "@/models/Category";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useState, useEffect } from "react";

interface FeedFormProps {
  initialData?: IFeed | null;
  categories: ICategory[]; // Pass categories for the select dropdown
  isEditMode?: boolean;
}

export default function FeedForm({ initialData, categories, isEditMode = false }: FeedFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    rss_url: initialData?.rss_url || "",
    category_id: initialData?.category_id?._id?.toString() || (categories.length > 0 ? categories[0]._id.toString() : ""),
    is_active: initialData?.is_active === undefined ? true : initialData.is_active,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        rss_url: initialData.rss_url || "",
        category_id: initialData.category_id?._id?.toString() || (categories.length > 0 ? categories[0]._id.toString() : ""),
        is_active: initialData.is_active === undefined ? true : initialData.is_active,
      });
    } else if (categories.length > 0) {
        // Set default category if not in edit mode and categories exist
        setFormData(prev => ({...prev, category_id: categories[0]._id.toString()}));
    }
  }, [initialData, categories]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
     if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!formData.rss_url || !formData.category_id) {
      setError("RSS URL and Category are required.");
      setIsLoading(false);
      return;
    }

    try {
      const apiUrl = isEditMode ? `/api/admin/feeds/${initialData?._id}` : "/api/admin/feeds";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(apiUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Failed to ${isEditMode ? 'update' : 'create'} feed`);
      }

      setSuccessMessage(`Feed ${isEditMode ? 'updated' : 'created'} successfully!`);
      if (!isEditMode) {
        setFormData({
            rss_url: "",
            category_id: (categories.length > 0 ? categories[0]._id.toString() : ""),
            is_active: true
        });
      }
      router.refresh();
      // No redirect here, admin might want to add multiple feeds or see the list update.
      // Or redirect to /admin/feed if preferred after edit.
       if (isEditMode) {
         setTimeout(() => router.push("/admin/feed"), 1500); // Redirect after a short delay
       }

    } catch (err: any) {
      console.error("Form submission error:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 bg-white shadow-md rounded-lg">
      {error && <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
      {successMessage && <div className="p-3 bg-green-100 text-green-700 rounded-md">{successMessage}</div>}

      <div>
        <label htmlFor="rss_url" className="block text-sm font-medium text-gray-700 mb-1">
          RSS Feed URL <span className="text-red-500">*</span>
        </label>
        <input
          type="url"
          name="rss_url"
          id="rss_url"
          value={formData.rss_url}
          onChange={handleChange}
          required
          placeholder="https://www.example.com/feed.xml"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
          Category <span className="text-red-500">*</span>
        </label>
        {categories.length === 0 ? (
          <p className="text-sm text-gray-500">
            No categories available. <Link href="/admin/category/add" className="text-indigo-600 hover:underline">Create a category first</Link>.
          </p>
        ) : (
          <select
            name="category_id"
            id="category_id"
            value={formData.category_id}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            {categories.map((category) => (
              <option key={category._id as string} value={category._id as string}>
                {category.title}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center">
        <input
          id="is_active"
          name="is_active"
          type="checkbox"
          checked={formData.is_active}
          onChange={handleChange}
          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
        <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
          Active (fetch articles from this feed)
        </label>
      </div>


      <div>
        <button
          type="submit"
          disabled={isLoading || categories.length === 0}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? (isEditMode ? "Updating..." : "Adding...") : (isEditMode ? "Update Feed" : "Add Feed")}
        </button>
      </div>
       {isEditMode && (
        <button
            type="button"
            onClick={() => router.push('/admin/feed')}
            className="mt-2 w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
            Cancel
        </button>
      )}
    </form>
  );
}
