"use client";

import { ICategory } from "@/models/Category";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useState, useEffect } from "react";

interface CategoryFormProps {
  initialData?: ICategory | null;
  isEditMode?: boolean;
}

export default function CategoryForm({ initialData, isEditMode = false }: CategoryFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    images: initialData?.images || "",
    logo_img: initialData?.logo_img || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        images: initialData.images || "",
        logo_img: initialData.logo_img || "",
      });
    }
  }, [initialData]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!formData.title) {
      setError("Title is required.");
      setIsLoading(false);
      return;
    }

    try {
      const apiUrl = isEditMode ? `/api/admin/categories/${initialData?._id}` : "/api/admin/categories";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(apiUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Failed to ${isEditMode ? 'update' : 'create'} category`);
      }

      setSuccessMessage(`Category ${isEditMode ? 'updated' : 'created'} successfully!`);
      if (!isEditMode) {
        setFormData({ title: "", images: "", logo_img: "" }); // Reset form on successful creation
      }
      router.refresh(); // Refresh server components to show new data
      if (isEditMode) {
        router.push("/admin/category"); // Redirect after editing
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
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Category Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          id="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-1">
          Image URL
        </label>
        <input
          type="url"
          name="images"
          id="images"
          value={formData.images}
          onChange={handleChange}
          placeholder="https://example.com/image.jpg"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="logo_img" className="block text-sm font-medium text-gray-700 mb-1">
          Logo Image URL
        </label>
        <input
          type="url"
          name="logo_img"
          id="logo_img"
          value={formData.logo_img}
          onChange={handleChange}
          placeholder="https://example.com/logo.png"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update Category" : "Create Category")}
        </button>
      </div>
       {isEditMode && initialData && (
        <button
            type="button"
            onClick={() => router.push('/admin/category')}
            className="mt-2 w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
            Cancel
        </button>
      )}
    </form>
  );
}
