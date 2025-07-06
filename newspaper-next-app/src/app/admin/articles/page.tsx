'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

// Define a simple Article type for display
interface Article {
  _id: string;
  title: string;
  slug: string;
  status: 'draft' | 'pending_review' | 'published' | 'archived';
  author?: { name?: string | null; email?: string | null; _id: string }; // Populated
  category?: { name: string; slug: string; _id: string } | null; // Populated
  publicationDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
    articles: Article[];
    totalPages: number;
    currentPage: number;
    totalArticles: number;
}

export default function AdminArticlesPage() {
  const { data: session } = useSession(); // For any client-side role checks if needed
  const [articlesResponse, setArticlesResponse] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1); // For pagination

  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // API endpoint /api/articles for GET is already partially implemented
        const response = await fetch(`/api/articles?page=${page}&limit=10&status=all`); // Fetch all statuses for admin view
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to fetch articles: ${response.statusText}`);
        }
        const data: ApiResponse = await response.json();
        setArticlesResponse(data);
      } catch (err: any) {
        setError(err.message);
        setArticlesResponse(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Middleware should protect this route.
    // Add client-side role check if necessary for finer-grained UI control.
    // e.g. if (session?.user?.role === 'admin' || session?.user?.role === 'editor')
    if (session) { // Assuming if session exists, middleware has allowed access
        fetchArticles();
    } else if (!session && status !== 'loading'){
        setError('You must be logged in to view articles.');
        setIsLoading(false);
    }
  }, [session, page]); // Re-fetch if page or session changes

  const handleNextPage = () => {
    if (articlesResponse && page < articlesResponse.totalPages) {
      setPage(page + 1);
    }
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };


  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Article Management</h1>
          <Link href="/admin/articles/new" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            Create New Article
          </Link>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {isLoading && <p className="p-4 text-gray-600">Loading articles...</p>}
          {error && <p className="p-4 text-red-600">Error: {error}</p>}
          {!isLoading && !error && (!articlesResponse || articlesResponse.articles.length === 0) && (
            <p className="p-4 text-gray-600">No articles found.</p>
          )}
          {!isLoading && !error && articlesResponse && articlesResponse.articles.length > 0 && (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Published</th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {articlesResponse.articles.map((article) => (
                    <tr key={article._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <Link href={`/admin/articles/edit/${article._id}`} className="text-indigo-600 hover:text-indigo-900">
                            {article.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${article.status === 'published' ? 'bg-green-100 text-green-800' :
                             article.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                             'bg-gray-100 text-gray-800'}
                          capitalize`}>
                          {article.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{article.author?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{article.category?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {article.publicationDate ? new Date(article.publicationDate).toLocaleDateString() : 'Not Published'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/admin/articles/edit/${article._id}`} className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</Link>
                        {/* <button onClick={() => handleDelete(article._id)} className="text-red-600 hover:text-red-900">Delete</button> */}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination Controls */}
              <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button onClick={handlePreviousPage} disabled={page === 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Previous</button>
                  <button onClick={handleNextPage} disabled={page === articlesResponse.totalPages || articlesResponse.totalPages === 0} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Next</button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(page - 1) * 10 + 1}</span> to <span className="font-medium">{Math.min(page * 10, articlesResponse.totalArticles)}</span> of{' '}
                      <span className="font-medium">{articlesResponse.totalArticles}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button onClick={handlePreviousPage} disabled={page === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                        <span className="sr-only">Previous</span>
                        &lt;
                      </button>
                      {/* Current page number could be displayed here if needed */}
                      <button onClick={handleNextPage} disabled={page === articlesResponse.totalPages || articlesResponse.totalPages === 0} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                        <span className="sr-only">Next</span>
                        &gt;
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="mt-6">
          <Link href="/admin" className="text-indigo-600 hover:text-indigo-800">
            &larr; Back to Admin Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
