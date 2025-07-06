'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ISiteSetting } from '@/models/SiteSetting'; // Import the interface

// Define a type for the form state, which might be a partial ISiteSetting initially
type SiteSettingsFormState = Partial<Omit<ISiteSetting, '_id' | 'createdAt' | 'updatedAt'>>;

const initialFormState: SiteSettingsFormState = {
  siteTitle: '',
  siteTagline: '',
  logoUrl: '',
  faviconUrl: '',
  postsPerPage: 10,
  defaultOgImage: '',
};

export default function AdminSettingsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [settings, setSettings] = useState<SiteSettingsFormState>(initialFormState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      if (session.user?.role !== 'admin') {
        setError('Access Denied: You do not have permission to view this page.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      fetch('/api/settings')
        .then(res => {
          if (!res.ok) return res.json().then(err => Promise.reject(err.message || 'Failed to fetch settings'));
          return res.json();
        })
        .then((data: ISiteSetting) => {
          // Omit MongoDB specific fields if they are not part of the form state directly
          const { _id, createdAt, updatedAt, ...formData } = data;
          setSettings(formData);
        })
        .catch(err => {
          setError(typeof err === 'string' ? err : 'Failed to load site settings.');
        })
        .finally(() => setIsLoading(false));
    } else if (sessionStatus === 'unauthenticated') {
        setError('Please log in to access settings.');
        setIsLoading(false);
    }
  }, [sessionStatus, session]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (session?.user?.role !== 'admin') {
        setError('Unauthorized action.');
        return;
    }
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update settings');
      }
      const updatedSettings: ISiteSetting = await response.json();
       // Omit MongoDB specific fields if they are not part of the form state directly
      const { _id, createdAt, updatedAt, ...formData } = updatedSettings;
      setSettings(formData);
      setSuccessMessage('Settings updated successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (sessionStatus === 'loading' || (isLoading && sessionStatus === 'authenticated')) {
    return <div className=\"min-h-screen flex items-center justify-center\"><p>Loading settings...</p></div>;
  }

  // If error is set and implies access denied or critical load failure
  if (error && (error.startsWith("Access Denied") || !settings.siteTitle && isLoading === false)) {
     return (
      <div className=\"min-h-screen bg-gray-100 py-8\">
        <div className=\"max-w-2xl mx-auto px-4 sm:px-6 lg:px-8\">
           <div className=\"bg-white shadow sm:rounded-lg p-6\">
            <h1 className=\"text-xl font-semibold text-red-700\">Error</h1>
            <p className=\"text-gray-700 mt-2\">{error}</p>
            <Link href=\"/admin\" className=\"mt-4 inline-block text-indigo-600 hover:text-indigo-800\">&larr; Back to Admin Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  // Check again for admin role if somehow passed loading but session is not admin
  if (session?.user?.role !== 'admin') {
      return <div className=\"p-6 text-red-500\">Access Denied. Administrator privileges required.</div>
  }


  return (
    <div className=\"min-h-screen bg-gray-100 py-8\">
      <div className=\"max-w-2xl mx-auto px-4 sm:px-6 lg:px-8\">
        <div className=\"flex justify-between items-center mb-6\">
          <h1 className=\"text-2xl font-semibold text-gray-900\">Site Settings</h1>
          <Link href=\"/admin\" className=\"text-sm text-indigo-600 hover:text-indigo-800\">
            &larr; Back to Admin Dashboard
          </Link>
        </div>

        <form onSubmit={handleSubmit} className=\"bg-white shadow sm:rounded-lg p-6 space-y-6\">
          {error && <div className=\"bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4\"><p>Error: {error}</p></div>}
          {successMessage && <div className=\"bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4\"><p>{successMessage}</p></div>}

          {/* Site Title */}
          <div>
            <label htmlFor=\"siteTitle\" className=\"block text-sm font-medium text-gray-700\">Site Title</label>
            <input type=\"text\" id=\"siteTitle\" name=\"siteTitle\" value={settings.siteTitle || ''} onChange={handleChange} required
                   className=\"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900\"/>
          </div>

          {/* Site Tagline */}
          <div>
            <label htmlFor=\"siteTagline\" className=\"block text-sm font-medium text-gray-700\">Site Tagline</label>
            <input type=\"text\" id=\"siteTagline\" name=\"siteTagline\" value={settings.siteTagline || ''} onChange={handleChange}
                   className=\"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900\"/>
          </div>

          {/* Logo URL */}
          <div>
            <label htmlFor=\"logoUrl\" className=\"block text-sm font-medium text-gray-700\">Logo URL</label>
            <input type=\"url\" id=\"logoUrl\" name=\"logoUrl\" value={settings.logoUrl || ''} onChange={handleChange} placeholder=\"https://example.com/logo.png\"
                   className=\"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900\"/>
            <p className=\"text-xs text-gray-500 mt-1\">Enter the full URL for your site logo. (Media library integration TBD)</p>
          </div>

          {/* Favicon URL */}
          <div>
            <label htmlFor=\"faviconUrl\" className=\"block text-sm font-medium text-gray-700\">Favicon URL</label>
            <input type=\"url\" id=\"faviconUrl\" name=\"faviconUrl\" value={settings.faviconUrl || ''} onChange={handleChange} placeholder=\"https://example.com/favicon.ico\"
                   className=\"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900\"/>
             <p className=\"text-xs text-gray-500 mt-1\">Enter the full URL for your favicon.</p>
          </div>

          {/* Posts Per Page */}
          <div>
            <label htmlFor=\"postsPerPage\" className=\"block text-sm font-medium text-gray-700\">Posts Per Page</label>
            <input type=\"number\" id=\"postsPerPage\" name=\"postsPerPage\" value={settings.postsPerPage || 10} onChange={handleChange} required min=\"1\" max=\"100\"
                   className=\"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900\"/>
            <p className=\"text-xs text-gray-500 mt-1\">Number of posts to show on archive pages (e.g., category, tag listings).</p>
          </div>

          {/* Default OG Image URL */}
          <div>
            <label htmlFor=\"defaultOgImage\" className=\"block text-sm font-medium text-gray-700\">Default Open Graph Image URL</label>
            <input type=\"url\" id=\"defaultOgImage\" name=\"defaultOgImage\" value={settings.defaultOgImage || ''} onChange={handleChange} placeholder=\"https://example.com/default-og.png\"
                   className=\"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900\"/>
            <p className=\"text-xs text-gray-500 mt-1\">Default image used for social sharing if a page/article doesn't have a specific one.</p>
          </div>

          <div className=\"pt-4\">
            <button type=\"submit\" disabled={isSaving || session?.user?.role !== 'admin'}
                    className=\"w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50\">
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
