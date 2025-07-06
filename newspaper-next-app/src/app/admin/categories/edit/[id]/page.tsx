'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;

  const { data: session } = useSession();
  const [category, setCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (categoryId) {
      setIsLoading(true);
      fetch(`/api/categories/${categoryId}`)
        .then(res => {
          if (!res.ok) {
            return res.json().then(err => Promise.reject(err.message || 'Failed to fetch category details'));
          }
          return res.json();
        })
        .then((data: Category) => {
          setCategory(data);
          setName(data.name);
          setSlug(data.slug);
          setDescription(data.description || '');
          setIsLoading(false);
        })
        .catch(err => {
          setError(typeof err === 'string' ? err : 'Failed to load category data.');
          setIsLoading(false);
        });
    } else {
        setError("No category ID provided.");
        setIsLoading(false);
    }
  }, [categoryId]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    // Suggest slug change or auto-update if desired
    // setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, description }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update category');
      }
      router.push('/admin/categories');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Client-side role check
  const canManage = session?.user?.role === 'admin' || session?.user?.role === 'editor';
  if (session && !canManage && !isLoading) { // If session loaded and user is not authorized
     return (
      <div className=\"min-h-screen bg-gray-100 py-8\">
        <div className=\"max-w-xl mx-auto px-4 sm:px-6 lg:px-8\">
            <div className=\"bg-white shadow sm:rounded-lg p-6\">
                <h1 className=\"text-xl font-semibold text-gray-900\">Access Denied</h1>
                <p className=\"text-gray-700 mt-2\">You do not have permission to edit categories.</p>
                <Link href=\"/admin/categories\" className=\"mt-4 inline-block text-indigo-600 hover:text-indigo-800\">&larr; Back to Categories</Link>
            </div>
        </div>
      </div>
    );
  }


  if (isLoading) {
    return <div className=\"min-h-screen flex items-center justify-center\"><p>Loading category data...</p></div>;
  }

  if (error && !category) { // If there was an error and no category data loaded
     return (
      <div className=\"min-h-screen bg-gray-100 py-8\">
        <div className=\"max-w-xl mx-auto px-4 sm:px-6 lg:px-8\">
           <div className=\"bg-white shadow sm:rounded-lg p-6\">
            <h1 className=\"text-xl font-semibold text-red-700\">Error</h1>
            <p className=\"text-gray-700 mt-2\">{error}</p>
            <Link href=\"/admin/categories\" className=\"mt-4 inline-block text-indigo-600 hover:text-indigo-800\">&larr; Back to Categories</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!category) { // Should ideally be caught by error state, but as a fallback
      return <div className=\"min-h-screen flex items-center justify-center\"><p>Category not found.</p></div>;
  }


  return (
    <div className=\"min-h-screen bg-gray-100 py-8\">
      <div className=\"max-w-xl mx-auto px-4 sm:px-6 lg:px-8\">
        <div className=\"flex justify-between items-center mb-6\">
          <h1 className=\"text-2xl font-semibold text-gray-900\">Edit Category</h1>
          <Link href=\"/admin/categories\" className=\"text-sm text-indigo-600 hover:text-indigo-800\">
            &larr; Back to Categories
          </Link>
        </div>

        <form onSubmit={handleSubmit} className=\"bg-white shadow sm:rounded-lg p-6 space-y-6\">
          {error && <div className=\"bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4\"><p>{error}</p></div>}

          <div>
            <label htmlFor=\"name\" className=\"block text-sm font-medium text-gray-700\">Name</label>
            <input type=\"text\" id=\"name\" value={name} onChange={handleNameChange} required
                   className=\"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900\"/>
          </div>

          <div>
            <label htmlFor=\"slug\" className=\"block text-sm font-medium text-gray-700\">Slug</label>
            <input type=\"text\" id=\"slug\" value={slug} onChange={(e) => setSlug(e.target.value)} required
                   className=\"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900\"/>
          </div>

          <div>
            <label htmlFor=\"description\" className=\"block text-sm font-medium text-gray-700\">Description (Optional)</label>
            <textarea id=\"description\" value={description} onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className=\"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900\"/>
          </div>

          <div className=\"pt-2\">
            <button type=\"submit\" disabled={isSubmitting || !canManage}
                    className=\"w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50\">
              {isSubmitting ? 'Updating...' : 'Update Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
