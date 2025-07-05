"use client";

import { INews } from "@/models/News";
import { ICategory } from "@/models/Category"; // For typing category if populated
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

interface PostListClientProps {
  initialPosts: INews[];
  initialPagination: any;
}

export default function PostListClient({ initialPosts, initialPagination }: PostListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<INews[]>(initialPosts);
  const [pagination, setPagination] = useState(initialPagination);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null); // ID of post being processed

  useEffect(() => {
    setPosts(initialPosts);
    setPagination(initialPagination);
  }, [initialPosts, initialPagination]);


  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return;
    }
    setIsProcessing(id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to delete post");
      }
      // Refetch or update state
      // For simplicity, we can trigger a router.refresh() to refetch server component data
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleToggleActive = async (post: INews) => {
    setIsProcessing(post._id as string);
    setError(null);
    try {
      const response = await fetch(`/api/admin/posts/${post._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !post.isActive }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update post status");
      }
       // Update local state immediately for better UX
      setPosts(prevPosts =>
        prevPosts.map(p => p._id === post._id ? { ...p, isActive: !p.isActive } : p)
      );
      // router.refresh(); // Optionally refresh to ensure full consistency if other data might change
    } catch (err: any) {
      setError(err.message);
      // Revert optimistic update on error if implemented, or just refresh
      router.refresh();
    } finally {
      setIsProcessing(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/admin?${params.toString()}`);
  };


  if (posts.length === 0 && pagination.totalPosts === 0) {
     return (
        <div className="bg-white p-6 rounded-lg shadow text-center">
            <p className="text-gray-600 text-lg">No posts found.</p>
            <p className="text-gray-500 mt-2">Posts will appear here once they are fetched from RSS feeds.</p>
            <Link href="/admin/feed" className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                Manage RSS Feeds
            </Link>
        </div>
      );
  }

  if (posts.length === 0 && pagination.totalPosts > 0) {
    return <p className="text-gray-600">No posts on this page. Try going to page 1.</p>
  }


  return (
    <div className="bg-white shadow-md rounded-lg overflow-x-auto">
      {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-md">{error}</div>}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Published</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {posts.map((post) => (
            <tr key={post._id as string}>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={post.title}>
                    <Link href={`/admin/posts/edit/${post._id}`} className="hover:text-indigo-600">{post.title}</Link>
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                {(post.category as ICategory)?.title || (post.category as string)?.toString() || 'N/A'}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                <a href={post.source_link} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 truncate max-w-xs" title={post.source_link}>
                    {post.domain || new URL(post.source_link).hostname}
                </a>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                {post.pubDate ? new Date(post.pubDate).toLocaleDateString() : 'N/A'}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <button
                  onClick={() => handleToggleActive(post)}
                  disabled={isProcessing === (post._id as string)}
                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    post.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  } ${isProcessing === (post._id as string) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isProcessing === (post._id as string) && post._id === isProcessing ? "..." : (post.isActive ? "Active" : "Inactive")}
                </button>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                <Link href={`/admin/posts/edit/${post._id}`} className="text-indigo-600 hover:text-indigo-900 mr-3">
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(post._id as string)}
                  disabled={isProcessing === (post._id as string)}
                  className={`text-red-600 hover:text-red-900 ${isProcessing === (post._id as string) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isProcessing === (post._id as string) && post._id === isProcessing ? "Deleting..." : "Delete"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage <= 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">Previous</button>
            <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage >= pagination.totalPages} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">Next</button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(pagination.currentPage - 1) * pagination.limit + 1}</span> to <span className="font-medium">{Math.min(pagination.currentPage * pagination.limit, pagination.totalPosts)}</span> of <span className="font-medium">{pagination.totalPosts}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                {[...Array(pagination.totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  // Basic pagination: show first, last, current, and +/- 2 pages around current
                  const showPage = pageNum === 1 || pageNum === pagination.totalPages || pageNum === pagination.currentPage || Math.abs(pageNum - pagination.currentPage) <= 2 || (pagination.currentPage <=3 && pageNum <=5) || (pagination.currentPage >= pagination.totalPages - 2 && pageNum >= pagination.totalPages - 4)
                  const showEllipsis = Math.abs(pageNum - pagination.currentPage) === 3  && pageNum > 1 && pageNum < pagination.totalPages && !((pagination.currentPage <=3 && pageNum <=5) || (pagination.currentPage >= pagination.totalPages - 2 && pageNum >= pagination.totalPages - 4));


                  if (showEllipsis) {
                    return <span key={`ellipsis-${pageNum}`} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>;
                  }
                  if(showPage) {
                    return (
                    <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        aria-current={pagination.currentPage === pageNum ? 'page' : undefined}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${pagination.currentPage === pageNum ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                    >
                        {pageNum}
                    </button>
                    );
                  }
                  return null;
                })}
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
