'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TiptapEditor from '@/components/editor/TiptapEditor';
import { useSession } from 'next-auth/react';
import { Editor } from '@tiptap/react'; // Import Editor type for the ref

// Types for fetched data
interface Category { _id: string; name: string; }
interface Tag { _id: string; name: string; }
interface Author { _id: string; name?: string | null; email?: string | null; }

const articleStatuses = ['draft', 'pending_review', 'published', 'archived'] as const;
type ArticleStatusTuple = typeof articleStatuses;
type ArticleStatus = ArticleStatusTuple[number];


export default function CreateArticlePage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [status, setStatus] = useState<ArticleStatus>('draft');
  const [authorId, setAuthorId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<Author[]>([]);

  const editorRef = useRef<Editor | null>(null);

  useEffect(() => {
    if (sessionStatus === 'authenticated' && session?.user?.id) {
      // Set current logged-in user as default author if not admin or if admin hasn't selected one
      if (session.user.role !== 'admin' || !authorId) {
        setAuthorId(session.user.id);
      }
    }

    // Fetch categories - placeholder API might return error or 'Not Implemented'
    fetch('/api/categories')
      .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)))
      .then(data => {
        if (Array.isArray(data)) setCategories(data);
        else console.warn('Categories API did not return an array:', data);
      })
      .catch(err => console.error('Failed to fetch categories:', err.message || err));

    // Fetch tags - placeholder API might return error or 'Not Implemented'
    fetch('/api/tags')
      .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)))
      .then(data => {
        if (Array.isArray(data)) setTags(data);
        else console.warn('Tags API did not return an array:', data);
      })
      .catch(err => console.error('Failed to fetch tags:', err.message || err));

    if (sessionStatus === 'authenticated' && session?.user?.role === 'admin') {
        fetch('/api/users')
            .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)))
            .then(data => {
                if(Array.isArray(data)) setAllUsers(data);
                else if (data.users && Array.isArray(data.users)) setAllUsers(data.users); // common API practice
                else if (data.message && data.message.includes('Not Implemented')) console.warn('Users API not implemented');
                else console.warn('Users API did not return an array or expected structure:', data);
            })
            .catch(err => console.error('Failed to fetch users:', err.message || err));
    }

  }, [session, sessionStatus, authorId]); // re-run if session changes, or admin changes author selection

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''));
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  const handleTagSelection = (tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const finalAuthorId = (session?.user?.role === 'admin' && authorId) ? authorId : session?.user?.id;

    if (!finalAuthorId) {
        setError('Author not identified. Please ensure you are logged in or an author is selected.');
        setIsSubmitting(false);
        return;
    }
    if (!title.trim()) {
        setError('Title is required.');
        setIsSubmitting(false);
        return;
    }
     if (!content.trim() || content === '<p></p>') { // Check for empty content from TipTap
        setError('Content is required.');
        setIsSubmitting(false);
        return;
    }


    const articleData = {
      title,
      slug: slug || title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''), // Ensure slug is present
      content,
      author: finalAuthorId,
      category: selectedCategoryId || undefined, // Send undefined if no category selected, so Mongoose default applies
      tags: selectedTagIds,
      status,
    };

    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create article');
      }
      router.push('/admin/articles');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sessionStatus === 'loading') {
    return <div className=\"min-h-screen flex items-center justify-center\"><p>Loading session...</p></div>;
  }
  if (sessionStatus === 'unauthenticated') {
     router.push('/auth/signin?callbackUrl=/admin/articles/new'); // Should be handled by middleware mostly
     return <div className=\"min-h-screen flex items-center justify-center\"><p>Redirecting to sign in...</p></div>;
  }


  return (
    <div className=\"min-h-screen bg-gray-100 py-8\">
      <div className=\"max-w-3xl mx-auto px-4 sm:px-6 lg:px-8\">
        <div className=\"flex justify-between items-center mb-6\">
          <h1 className=\"text-2xl font-semibold text-gray-900\">Create New Article</h1>
          <Link href=\"/admin/articles\" className=\"text-indigo-600 hover:text-indigo-800\">
            &larr; Back to Articles
          </Link>
        </div>

        <form onSubmit={handleSubmit} className=\"bg-white shadow sm:rounded-lg p-6 space-y-6\">
          {error && <div className=\"bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4\"><p>{error}</p></div>}

          <div>
            <label htmlFor=\"title\" className=\"block text-sm font-medium text-gray-700\">Title</label>
            <input type=\"text\" id=\"title\" value={title} onChange={handleTitleChange} required
                   className=\"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900\"/>
          </div>

          <div>
            <label htmlFor=\"slug\" className=\"block text-sm font-medium text-gray-700\">Slug</label>
            <input type=\"text\" id=\"slug\" value={slug} onChange={(e) => setSlug(e.target.value)} required
                   className=\"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900\"/>
          </div>

          {session?.user?.role === 'admin' && (
            <div>
              <label htmlFor=\"author\" className=\"block text-sm font-medium text-gray-700\">Author</label>
              <select id=\"author\" value={authorId} onChange={(e) => setAuthorId(e.target.value)} required
                      className=\"mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-gray-900\">
                {allUsers.length === 0 && <option value={session.user.id} disabled>{session.user.name || session.user.email} (Loading other users...)</option>}
                {allUsers.map(user => (
                  <option key={user._id} value={user._id}>{user.name || user.email}</option>
                ))}
                 {/* Ensure current logged in admin is also an option if not in allUsers or if allUsers is empty */}
                {!allUsers.find(u => u._id === session.user.id) &&
                  <option value={session.user.id}>{session.user.name || session.user.email} (Self)</option>
                }
              </select>
               {allUsers.length === 0 && session.user.role==='admin' && <p className=\"text-xs text-gray-500 mt-1\">User list for author selection is loading or empty. Defaulting to self. (Or API not implemented)</p>}
            </div>
          )}


          <div>
            <label htmlFor=\"content\" className=\"block text-sm font-medium text-gray-700 mb-1\">Content</label>
            <TiptapEditor content={content} onChange={handleContentChange} editorRef={editorRef} />
          </div>

          <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
            <div>
              <label htmlFor=\"category\" className=\"block text-sm font-medium text-gray-700\">Category</label>
              <select id=\"category\" value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)}
                      className=\"mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-gray-900\">
                <option value=\"\">Select category (optional)</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
                 {categories.length === 0 && <option value=\"\" disabled>Loading categories... (Or API not implemented)</option>}
              </select>
            </div>
            <div>
              <label htmlFor=\"status\" className=\"block text-sm font-medium text-gray-700\">Status</label>
              <select id=\"status\" value={status} onChange={(e) => setStatus(e.target.value as ArticleStatus)}
                      className=\"mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-gray-900 capitalize\">
                {articleStatuses.map(s => (
                  <option key={s} value={s} className=\"capitalize\">{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className=\"block text-sm font-medium text-gray-700\">Tags</label>
            <div className=\"mt-2 flex flex-wrap gap-2\">
              {tags.map(tag => (
                <button type=\"button\" key={tag._id} onClick={() => handleTagSelection(tag._id)}
                        className={\`px-3 py-1 border rounded-full text-sm
                                  \${selectedTagIds.includes(tag._id) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}\`}>
                  {tag.name}
                </button>
              ))}
              {tags.length === 0 && <p className=\"text-xs text-gray-500\">No tags available. (Or API not implemented)</p>}
            </div>
          </div>

          <div className=\"pt-4\">
            <button type=\"submit\" disabled={isSubmitting || sessionStatus === 'loading'}
                    className=\"w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50\">
              {isSubmitting ? 'Creating...' : 'Create Article'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
