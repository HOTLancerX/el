"use client";

import { IFeed } from "@/models/Feed";
import { ICategory } from "@/models/Category";
import { useRouter } from "next/navigation";
import { useState } from "react";
import FeedForm from "@/components/admin/FeedForm"; // Re-use the form for editing

interface FeedListClientProps {
  feeds: IFeed[];
  categories: ICategory[];
}

export default function FeedListClient({ feeds: initialFeeds, categories }: FeedListClientProps) {
  const router = useRouter();
  const [feeds, setFeeds] = useState<IFeed[]>(initialFeeds);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null); // ID of feed being processed (delete/toggle)
  const [editingFeed, setEditingFeed] = useState<IFeed | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this feed?")) {
      return;
    }
    setIsProcessing(id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/feeds/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Failed to delete feed");
      setFeeds((prevFeeds) => prevFeeds.filter((feed) => feed._id !== id));
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleToggleActive = async (feed: IFeed) => {
    setIsProcessing(feed._id as string);
    setError(null);
    try {
      const response = await fetch(`/api/admin/feeds/${feed._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...feed, is_active: !feed.is_active }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Failed to update feed status");
      setFeeds((prevFeeds) =>
        prevFeeds.map((f) => (f._id === feed._id ? { ...f, is_active: !f.is_active } : f))
      );
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleEdit = (feed: IFeed) => {
    setEditingFeed(feed);
  };

  const handleCloseEditForm = () => {
    setEditingFeed(null);
    router.refresh(); // Refresh list after editing potentially
  }

  if (feeds.length === 0 && initialFeeds.length > 0) {
    return <p className="text-gray-600 bg-white p-4 rounded-lg shadow">All feeds have been deleted.</p>;
  }
   if (initialFeeds.length === 0) {
    return <p className="text-gray-600 bg-white p-4 rounded-lg shadow">No feeds found. Add one using the form.</p>;
  }


  return (
    <div className="space-y-4">
      {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-md">{error}</div>}

      {editingFeed && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Edit Feed</h3>
                <FeedForm
                    initialData={editingFeed}
                    categories={categories}
                    isEditMode={true}
                />
                <button
                    onClick={handleCloseEditForm}
                    className="mt-4 w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                    Close
                </button>
            </div>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RSS URL</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {feeds.map((feed) => (
              <tr key={feed._id as string}>
                <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 truncate max-w-xs" title={feed.rss_url}>{feed.rss_url}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {(feed.category_id as ICategory)?.title || (feed.category_id as string)}
                </td>
                 <td className="px-4 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleActive(feed)}
                    disabled={isProcessing === (feed._id as string)}
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      feed.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    } ${isProcessing === (feed._id as string) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isProcessing === (feed._id as string) ? "..." : (feed.is_active ? "Active" : "Inactive")}
                  </button>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(feed)}
                    disabled={isProcessing === (feed._id as string)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3 disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(feed._id as string)}
                    disabled={isProcessing === (feed._id as string)}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                  >
                    {isProcessing === (feed._id as string) && feed._id === isProcessing ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
