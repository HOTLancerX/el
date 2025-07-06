'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ILayout } from '@/models/Layout'; // Assuming ILayout is exported from your model

export default function AdminLayoutsPage() {
  const { data: session } = useSession();
  const [layouts, setLayouts] = useState<ILayout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state for adding a new layout (basic: just name)
  const [newLayoutName, setNewLayoutName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchLayouts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/layouts');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch layouts');
      }
      const data = await response.json();
      setLayouts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchLayouts();
    } else if (session) {
        setError("You don't have permission to manage layouts.");
        setIsLoading(false);
    }
  }, [session]);

  const handleAddLayout = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    // Create a very basic initial structure for the new layout
    const initialLayoutStructure = {
        rows: [], // Start with no rows
        globalSettings: {},
    };

    try {
      const response = await fetch('/api/layouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newLayoutName, structure: initialLayoutStructure }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create layout');
      }
      setNewLayoutName('');
      fetchLayouts();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLayout = async (layoutId: string) => {
    if (!confirm('Are you sure you want to delete this layout? This might affect pages or articles using it.')) {
      return;
    }
    try {
      const response = await fetch(`/api/layouts/${layoutId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete layout');
      }
      fetchLayouts();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const canManage = session?.user?.role === 'admin';

  if (session && !canManage && !isLoading) {
     return (
      <div className=\"min-h-screen bg-gray-100 py-8\">
        <div className=\"max-w-xl mx-auto px-4 sm:px-6 lg:px-8\">
            <div className=\"bg-white shadow sm:rounded-lg p-6\">
                <h1 className=\"text-xl font-semibold text-gray-900\">Access Denied</h1>
                <p className=\"text-gray-700 mt-2\">You do not have permission to manage layouts.</p>
                 <Link href=\"/admin\" className=\"mt-4 inline-block text-indigo-600 hover:text-indigo-800\">&larr; Back to Admin Dashboard</Link>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className=\"min-h-screen bg-gray-100 py-8\">
      <div className=\"max-w-4xl mx-auto px-4 sm:px-6 lg:px-8\">
        <div className=\"flex justify-between items-center mb-6\">
          <h1 className=\"text-2xl font-semibold text-gray-900\">Layout Management</h1>
          <Link href=\"/admin\" className=\"text-sm text-indigo-600 hover:text-indigo-800\">
            &larr; Back to Admin Dashboard
          </Link>
        </div>

        {canManage && (
            <div className=\"bg-white shadow sm:rounded-lg p-6 mb-8\">
            <h2 className=\"text-xl font-semibold text-gray-800 mb-4\">Create New Layout</h2>
            <form onSubmit={handleAddLayout} className=\"space-y-4\">
                {formError && <div className=\"bg-red-100 border-l-4 border-red-500 text-red-700 p-3\"><p>{formError}</p></div>}
                <div>
                <label htmlFor=\"newLayoutName\" className=\"block text-sm font-medium text-gray-700\">Layout Name</label>
                <input type=\"text\" id=\"newLayoutName\" value={newLayoutName} onChange={(e) => setNewLayoutName(e.target.value)} required
                        className=\"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900\"/>
                </div>
                <button type=\"submit\" disabled={isSubmitting}
                        className=\"px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50\">
                {isSubmitting ? 'Creating...' : 'Create Layout'}
                </button>
            </form>
            </div>
        )}

        <div className=\"bg-white shadow overflow-hidden sm:rounded-lg\">
          <h2 className=\"text-xl font-semibold text-gray-800 p-6 border-b border-gray-200\">Existing Layouts</h2>
          {isLoading && <p className=\"p-6 text-gray-600\">Loading layouts...</p>}
          {error && <p className=\"p-6 text-red-600\">Error: {error}</p>}
          {!isLoading && !error && layouts.length === 0 && (
            <p className=\"p-6 text-gray-600\">No layouts found. Create one above to get started.</p>
          )}
          {!isLoading && !error && layouts.length > 0 && (
            <table className=\"min-w-full divide-y divide-gray-200\">
              <thead className=\"bg-gray-50\">
                <tr>
                  <th scope=\"col\" className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">Name</th>
                  <th scope=\"col\" className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">Rows</th>
                  {canManage && <th scope=\"col\" className=\"relative px-6 py-3\"><span className=\"sr-only\">Actions</span></th>}
                </tr>
              </thead>
              <tbody className=\"bg-white divide-y divide-gray-200\">
                {layouts.map((layout) => (
                  <tr key={layout._id}>
                    <td className=\"px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900\">
                        <Link href={`/admin/layouts/edit/${layout._id}`} className=\"text-indigo-600 hover:text-indigo-900\">
                         {layout.name}
                        </Link>
                    </td>
                    <td className=\"px-6 py-4 whitespace-nowrap text-sm text-gray-500\">{layout.structure?.rows?.length || 0}</td>
                    {canManage && (
                        <td className=\"px-6 py-4 whitespace-nowrap text-right text-sm font-medium\">
                        <Link href={`/admin/layouts/edit/${layout._id}`} className=\"text-indigo-600 hover:text-indigo-900 mr-3\">Open Builder</Link>
                        <button onClick={() => handleDeleteLayout(layout._id.toString())} className=\"text-red-600 hover:text-red-900\">Delete</button>
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
