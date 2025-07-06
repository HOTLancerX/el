'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

export default function AdminCategoriesPage() {
  const { data: session } = useSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state for adding a new category
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySlug, setNewCategorySlug] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch categories');
      }
      const data = await response.json();
      setCategories(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) { // Assuming middleware handles overall access
      fetchCategories();
    }
  }, [session]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCategoryName(e.target.value);
    // Auto-generate slug (simple version)
    setNewCategorySlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''));
  };

  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: newCategoryName,
            slug: newCategorySlug,
            description: newCategoryDescription
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create category');
      }
      // Reset form and refresh list
      setNewCategoryName('');
      setNewCategorySlug('');
      setNewCategoryDescription('');
      fetchCategories(); // Re-fetch to show the new category
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This might affect articles using it.')) {
      return;
    }
    try {
      const response = await fetch(`/api/categories/${categoryId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete category');
      }
      fetchCategories(); // Refresh list
    } catch (err: any) {
      alert(`Error: ${err.message}`); // Simple alert for delete error
    }
  };


  // Basic client-side role check for sensitive actions, supplement to middleware
  const canManage = session?.user?.role === 'admin' || session?.user?.role === 'editor';

  return (
    <div className=\"min-h-screen bg-gray-100 py-8\">
      <div className=\"max-w-4xl mx-auto px-4 sm:px-6 lg:px-8\">
        <div className=\"flex justify-between items-center mb-6\">
          <h1 className=\"text-2xl font-semibold text-gray-900\">Category Management</h1>
          <Link href=\"/admin\" className=\"text-sm text-indigo-600 hover:text-indigo-800\">
            &larr; Back to Admin Dashboard
          </Link>
        </div>

        {/* Add New Category Form */}
        {canManage && (
            <div className=\"bg-white shadow sm:rounded-lg p-6 mb-8\">
            <h2 className=\"text-xl font-semibold text-gray-800 mb-4\">Add New Category</h2>
            <form onSubmit={handleAddCategory} className=\"space-y-4\">
                {formError && <div className=\"bg-red-100 border-l-4 border-red-500 text-red-700 p-3\"><p>{formError}</p></div>}
                <div>
                <label htmlFor=\"newCategoryName\" className=\"block text-sm font-medium text-gray-700\">Name</label>
                <input type=\"text\" id=\"newCategoryName\" value={newCategoryName} onChange={handleNameChange} required
                        className=\"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900\"/>
                </div>
                <div>
                <label htmlFor=\"newCategorySlug\" className=\"block text-sm font-medium text-gray-700\">Slug</label>
                <input type=\"text\" id=\"newCategorySlug\" value={newCategorySlug} onChange={(e) => setNewCategorySlug(e.target.value)} required
                        className=\"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900\"/>
                </div>
                <div>
                <label htmlFor=\"newCategoryDescription\" className=\"block text-sm font-medium text-gray-700\">Description (Optional)</label>
                <textarea id=\"newCategoryDescription\" value={newCategoryDescription} onChange={(e) => setNewCategoryDescription(e.target.value)}
                            rows={3}
                            className=\"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900\"/>
                </div>
                <button type=\"submit\" disabled={isSubmitting}
                        className=\"px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50\">
                {isSubmitting ? 'Adding...' : 'Add Category'}
                </button>
            </form>
            </div>
        )}

        {/* Categories List */}
        <div className=\"bg-white shadow overflow-hidden sm:rounded-lg\">
          <h2 className=\"text-xl font-semibold text-gray-800 p-6 border-b border-gray-200\">Existing Categories</h2>
          {isLoading && <p className=\"p-6 text-gray-600\">Loading categories...</p>}
          {error && <p className=\"p-6 text-red-600\">Error: {error}</p>}
          {!isLoading && !error && categories.length === 0 && (
            <p className=\"p-6 text-gray-600\">No categories found.</p>
          )}
          {!isLoading && !error && categories.length > 0 && (
            <table className=\"min-w-full divide-y divide-gray-200\">
              <thead className=\"bg-gray-50\">
                <tr>
                  <th scope=\"col\" className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">Name</th>
                  <th scope=\"col\" className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">Slug</th>
                  <th scope=\"col\" className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">Description</th>
                  {canManage && <th scope=\"col\" className=\"relative px-6 py-3\"><span className=\"sr-only\">Actions</span></th>}
                </tr>
              </thead>
              <tbody className=\"bg-white divide-y divide-gray-200\">
                {categories.map((category) => (
                  <tr key={category._id}>
                    <td className=\"px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900\">{category.name}</td>
                    <td className=\"px-6 py-4 whitespace-nowrap text-sm text-gray-500\">{category.slug}</td>
                    <td className=\"px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-xs truncate\">{category.description || '-'}</td>
                    {canManage && (
                        <td className=\"px-6 py-4 whitespace-nowrap text-right text-sm font-medium\">
                        <Link href={`/admin/categories/edit/${category._id}`} className=\"text-indigo-600 hover:text-indigo-900 mr-3\">Edit</Link>
                        <button onClick={() => handleDeleteCategory(category._id)} className=\"text-red-600 hover:text-red-900\">Delete</button>
                        </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
