"use client";

import { INews } from "@/models/News";
import { ICategory } from "@/models/Category";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useState, useEffect } from "react";

interface PostFormProps {
  initialData: INews; // Editing existing post, so initialData is required
  categories: ICategory[];
}

export default function PostForm({ initialData, categories }: PostFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    category: initialData?.category?._id?.toString() || initialData?.category?.toString() || "",
    isActive: initialData?.isActive === undefined ? true : initialData.isActive,
    images: initialData?.images || [],
    source_link: initialData?.source_link || "",
    domain: initialData?.domain || "",
    pubDate: initialData?.pubDate ? new Date(initialData.pubDate).toISOString().substring(0, 16) : "", // For datetime-local input
  });
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        category: initialData.category?._id?.toString() || initialData.category?.toString() || "",
        isActive: initialData.isActive === undefined ? true : initialData.isActive,
        images: initialData.images || [],
        source_link: initialData.source_link || "",
        domain: initialData.domain || "",
        pubDate: initialData.pubDate ? new Date(initialData.pubDate).toISOString().substring(0, 16) : "",
    });
  }, [initialData]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddImage = () => {
    if (newImageUrl.trim() && !formData.images.includes(newImageUrl.trim())) {
      try {
        new URL(newImageUrl.trim()); // Validate URL
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, newImageUrl.trim()],
        }));
        setNewImageUrl("");
      } catch (e) {
        setError("Invalid Image URL provided.");
      }
    } else if (formData.images.includes(newImageUrl.trim())) {
        setError("This image URL has already been added.");
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!formData.title || !formData.category || !formData.source_link) {
      setError("Title, Category, and Source Link are required.");
      setIsLoading(false);
      return;
    }

    try {
        new URL(formData.source_link);
    } catch(e) {
        setError("Invalid Source Link URL.");
        setIsLoading(false);
        return;
    }


    try {
      const apiUrl = `/api/admin/posts/${initialData._id}`;
      const method = "PUT";

      const payload = { ...formData };
      if (payload.pubDate === "") { // Handle empty date string if not changed
        // @ts-ignore
        delete payload.pubDate;
      }


      const response = await fetch(apiUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        let errorMessage = result.error || "Failed to update post";
        if (result.errors) errorMessage = Object.values(result.errors).join(', ');
        throw new Error(errorMessage);
      }

      setSuccessMessage("Post updated successfully!");
      router.refresh();
      setTimeout(() => router.push("/admin"), 1500); // Redirect to post list after update

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
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
        <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="input-class" />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={5} className="input-class"></textarea>
      </div>

      <div>
        <label htmlFor="source_link" className="block text-sm font-medium text-gray-700 mb-1">Source Link <span className="text-red-500">*</span></label>
        <input type="url" name="source_link" id="source_link" value={formData.source_link} onChange={handleChange} required className="input-class" />
      </div>

      <div>
        <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-1">Source Domain</label>
        <input type="text" name="domain" id="domain" value={formData.domain} onChange={handleChange} className="input-class" />
      </div>

      <div>
        <label htmlFor="pubDate" className="block text-sm font-medium text-gray-700 mb-1">Publication Date</label>
        <input type="datetime-local" name="pubDate" id="pubDate" value={formData.pubDate} onChange={handleChange} className="input-class" />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
        {categories.length === 0 ? (
          <p className="text-sm text-gray-500">No categories available. <Link href="/admin/category/add" className="text-indigo-600 hover:underline">Create one</Link>.</p>
        ) : (
          <select name="category" id="category" value={formData.category} onChange={handleChange} required className="input-class">
            {categories.map((cat) => (
              <option key={cat._id as string} value={cat._id as string}>{cat.title}</option>
            ))}
          </select>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Images</label>
        {formData.images.map((imgUrl, index) => (
          <div key={index} className="flex items-center space-x-2">
            <input type="url" value={imgUrl} readOnly className="input-class flex-grow" />
            <button type="button" onClick={() => handleRemoveImage(index)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
          </div>
        ))}
        <div className="flex items-center space-x-2">
          <input
            type="url"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            placeholder="Add new image URL"
            className="input-class flex-grow"
          />
          <button type="button" onClick={handleAddImage} className="px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">Add Image</button>
        </div>
      </div>

      <div className="flex items-center">
        <input id="isActive" name="isActive" type="checkbox" checked={formData.isActive} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">Active (Visible to users)</label>
      </div>

      <div className="flex space-x-4">
        <button type="submit" disabled={isLoading || categories.length === 0} className="btn-primary w-full">
          {isLoading ? "Updating Post..." : "Update Post"}
        </button>
         <button type="button" onClick={() => router.push('/admin')} className="btn-secondary w-full">
            Cancel
        </button>
      </div>
      <style jsx>{`
        .input-class {
          margin-top: 0.25rem;
          display: block;
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #D1D5DB; /* gray-300 */
          border-radius: 0.375rem; /* rounded-md */
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
        }
        .input-class:focus {
          outline: none;
          border-color: #6366F1; /* indigo-500 */
          box-shadow: 0 0 0 0.2rem rgba(99, 102, 241, 0.25); /* focus:ring-indigo-500 */
        }
        .btn-primary {
          display: flex;
          justify-content: center;
          padding: 0.5rem 1rem;
          border: 1px solid transparent;
          border-radius: 0.375rem;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          font-size: 0.875rem; /* text-sm */
          font-weight: 500; /* font-medium */
          color: white;
          background-color: #4F46E5; /* bg-indigo-600 */
        }
        .btn-primary:hover {
          background-color: #4338CA; /* hover:bg-indigo-700 */
        }
        .btn-primary:disabled {
          opacity: 0.5;
        }
        .btn-secondary {
          display: flex;
          justify-content: center;
          padding: 0.5rem 1rem;
          border: 1px solid #D1D5DB; /* border-gray-300 */
          border-radius: 0.375rem;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          font-size: 0.875rem; /* text-sm */
          font-weight: 500; /* font-medium */
          color: #374151; /* text-gray-700 */
          background-color: white;
        }
        .btn-secondary:hover {
           background-color: #F9FAFB; /* hover:bg-gray-50 */
        }
      `}</style>
    </form>
  );
}
