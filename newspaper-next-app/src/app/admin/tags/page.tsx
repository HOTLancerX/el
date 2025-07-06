'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface Tag {
  _id: string;
  name: string;
  slug: string;
}

export default function AdminTagsPage() {
  const { data: session } = useSession();
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state for adding a new tag
  const [newTagName, setNewTagName] = useState('');
  const [newTagSlug, setNewTagSlug] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchTags = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // This API is currently a placeholder
      const response = await fetch('/api/tags');
      if (!response.ok) {
        const errorData = await response.json();
         if (errorData.message && errorData.message.includes('Not Implemented')) {
            setError('Tag functionality is not fully available: API is not implemented.');
            setTags([]); // Clear tags if API not implemented
        } else {
            throw new Error(errorData.message || 'Failed to fetch tags');
        }
      } else {
        const data = await response.json();
        // Check if data is an array, API might return { message: '...' } from placeholder
        if (Array.isArray(data)) {
            setTags(data);
        } else {
            console.warn("Fetched data for tags is not an array:", data);
            setTags([]); // Set to empty if not an array, or handle specific message structure
        }
      }
    } catch (err: any) {
      setError(err.message);
      setTags([]); // Clear tags on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchTags();
    }
  }, [session]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTagName(e.target.value);
    setNewTagSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''));
  };

  const handleAddTag = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      // This API is currently a placeholder
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName, slug: newTagSlug }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.message && errorData.message.includes('Not Implemented')) {
            setFormError('Cannot add tag: API is not implemented.');
        } else {
            throw new Error(errorData.message || 'Failed to create tag');
        }
      } else {
        setNewTagName('');
        setNewTagSlug('');
        fetchTags();
      }
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) {
      return;
    }
    try {
      // This API is currently a placeholder
      const response = await fetch(`/api/tags/${tagId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.message && errorData.message.includes('Not Implemented')) {
            alert('Cannot delete tag: API is not implemented.');
        } else {
            throw new Error(errorData.message || 'Failed to delete tag');
        }
      } else {
        fetchTags(); // Refresh list
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const canManage = session?.user?.role === 'admin' || session?.user?.role === 'editor';

  return (
    <div className=\"min-h-screen bg-gray-100 py-8\">
      <div className=\"max-w-4xl mx-auto px-4 sm:px-6 lg:px-8\">
        <div className=\"flex justify-between items-center mb-6\">
          <h1 className=\"text-2xl font-semibold text-gray-900\">Tag Management</h1>
          <Link href=\"/admin\" className=\"text-sm text-indigo-600 hover:text-indigo-800\">
            &larr; Back to Admin Dashboard
          </Link>
        </div>

        {canManage && (
            <div className=\"bg-white shadow sm:rounded-lg p-6 mb-8\">
            <h2 className=\"text-xl font-semibold text-gray-800 mb-4\">Add New Tag</h2>
            <form onSubmit={handleAddTag} className=\"space-y-4\">
                {formError && <div className=\"bg-red-100 border-l-4 border-red-500 text-red-700 p-3\"><p>{formError}</p></div>}
                <div>
                <label htmlFor=\"newTagName\" className=\"block text-sm font-medium text-gray-700\">Name</label>
                <input type=\"text\" id=\"newTagName\" value={newTagName} onChange={handleNameChange} required
                        className=\"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900\"/>
                </div>
                <div>
                <label htmlFor=\"newTagSlug\" className=\"block text-sm font-medium text-gray-700\">Slug</label>
                <input type=\"text\" id=\"newTagSlug\" value={newTagSlug} onChange={(e) => setNewTagSlug(e.target.value)} required
                        className=\"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900\"/>
                </div>
                <button type=\"submit\" disabled={isSubmitting}
                        className=\"px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50\">
                {isSubmitting ? 'Adding...' : 'Add Tag'}
                </button>
            </form>
            </div>
        )}

        <div className=\"bg-white shadow overflow-hidden sm:rounded-lg\">
          <h2 className=\"text-xl font-semibold text-gray-800 p-6 border-b border-gray-200\">Existing Tags</h2>
          {isLoading && <p className=\"p-6 text-gray-600\">Loading tags...</p>}
          {error && <p className=\"p-6 text-red-600\">Error: {error}</p>}
          {!isLoading && !error && tags.length === 0 && (
            <p className=\"p-6 text-gray-600\">No tags found. (Or API not yet implemented)</p>
          )}
          {!isLoading && !error && tags.length > 0 && (
            <table className=\"min-w-full divide-y divide-gray-200\">
              <thead className=\"bg-gray-50\">
                <tr>
                  <th scope=\"col\" className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">Name</th>
                  <th scope=\"col\" className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">Slug</th>
                  {canManage && <th scope=\"col\" className=\"relative px-6 py-3\"><span className=\"sr-only\">Actions</span></th>}
                </tr>
              </thead>
              <tbody className=\"bg-white divide-y divide-gray-200\">
                {tags.map((tag) => (
                  <tr key={tag._id}>
                    <td className=\"px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900\">{tag.name}</td>
                    <td className=\"px-6 py-4 whitespace-nowrap text-sm text-gray-500\">{tag.slug}</td>
                    {canManage && (
                        <td className=\"px-6 py-4 whitespace-nowrap text-right text-sm font-medium\">
                        <Link href={`/admin/tags/edit/${tag._id}`} className=\"text-indigo-600 hover:text-indigo-900 mr-3\">Edit</Link>
                        <button onClick={() => handleDeleteTag(tag._id)} className=\"text-red-600 hover:text-red-900\">Delete</button>
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
