'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import TiptapEditor from '@/components/editor/TiptapEditor';
import { useSession } from 'next-auth/react';
import { Editor } from '@tiptap/react';

// Types
interface Category { _id: string; name: string; }
interface Tag { _id: string; name: string; }
interface Author { _id: string; name?: string | null; email?: string | null; }
const articleStatuses = ['draft', 'pending_review', 'published', 'archived'] as const;
type ArticleStatusTuple = typeof articleStatuses;
type ArticleStatus = ArticleStatusTuple[number];

interface ArticleData {
    title: string;
    slug: string;
    content: string;
    author: string | { _id: string; name?: string | null; email?: string | null; }; // Can be ID or populated object
    category?: string | null | Category; // Can be ID or populated object
    tags: string[] | Tag[]; // Can be array of IDs or populated objects
    status: ArticleStatus;
    featuredImage?: string; // Placeholder for now
    _id?: string; // For existing articles
}


export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const articleId = params.id as string;

  const { data: session, status: sessionStatus } = useSession();
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [currentStatus, setCurrentStatus] = useState<ArticleStatus>('draft');
  const [authorId, setAuthorId] = useState<string>('');
  const [allUsers, setAllUsers] = useState<Author[]>([]);


  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editorRef = useRef<Editor | null>(null);

  useEffect(() => {
    // Fetch common data like categories, tags, users (if admin)
    fetch('/api/categories')
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => Array.isArray(data) && setCategories(data))
      .catch(() => console.error('Failed to fetch categories'));
    fetch('/api/tags')
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => Array.isArray(data) && setTags(data))
      .catch(() => console.error('Failed to fetch tags'));

    if (session?.user?.role === 'admin') {
        fetch('/api/users')
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then(data => {
                if(Array.isArray(data)) setAllUsers(data);
                else if (data.users && Array.isArray(data.users)) setAllUsers(data.users);
            })
            .catch(() => console.error('Failed to fetch users'));
    }

    // Fetch existing article data
    if (articleId) {
      setIsLoading(true);
      fetch(`/api/articles/${articleId}`) // This API endpoint is currently a placeholder
        .then(res => {
          if (!res.ok) return res.json().then(err => Promise.reject(err.message || 'Failed to fetch article'));
          return res.json();
        })
        .then((data: ArticleData) => {
          if (data.message && data.message.includes('Not Implemented')) {
             setError(`Edit functionality is not fully available: API for fetching article ${articleId} is not implemented.`);
             setIsLoading(false);
             return;
          }
          setArticle(data);
          setTitle(data.title);
          setSlug(data.slug);
          setContent(data.content); // TipTap will take this as initial content
          const authorObj = data.author as Author; // Assuming author is populated or is an object
          setAuthorId(typeof data.author === 'string' ? data.author : authorObj?._id || '');

          const categoryObj = data.category as Category; // Assuming category might be populated
          setSelectedCategoryId(typeof data.category === 'string' ? data.category : categoryObj?._id || '');

          const tagsArr = data.tags as (string[] | Tag[]);
          setSelectedTagIds(tagsArr.map(tag => typeof tag === 'string' ? tag : tag._id));
          setCurrentStatus(data.status);
          setIsLoading(false);
        })
        .catch(err => {
          setError(typeof err === 'string' ? err : 'Failed to load article data.');
          setIsLoading(false);
        });
    } else {
        setError("No article ID provided.");
        setIsLoading(false);
    }
  }, [articleId, session]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    // Optionally, suggest slug change or auto-update if admin prefers
    // setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''));
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

    const finalAuthorId = (session?.user?.role === 'admin' && authorId) ? authorId : article?.author && typeof article.author !== 'string' ? article.author._id : session?.user?.id;

    if (!finalAuthorId) {
        setError('Author not identified.');
        setIsSubmitting(false);
        return;
    }
     if (!title.trim()) {
        setError('Title is required.');
        setIsSubmitting(false);
        return;
    }
     if (!content.trim() || content === '<p></p>') {
        setError('Content is required.');
        setIsSubmitting(false);
        return;
    }

    const updatedArticleData = {
      title,
      slug,
      content,
      author: finalAuthorId,
      category: selectedCategoryId || undefined,
      tags: selectedTagIds,
      status: currentStatus,
    };

    try {
      // This API endpoint is currently a placeholder
      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedArticleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
         if (errorData.message && errorData.message.includes('Not Implemented')) {
             setError(`Edit functionality is not fully available: API for updating article ${articleId} is not implemented.`);
         } else {
            throw new Error(errorData.message || 'Failed to update article');
         }
      } else {
        router.push('/admin/articles');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sessionStatus === 'loading' || isLoading && !error) { // Show loading if session or article data is loading (and no critical error yet)
    return <div className=\"min-h-screen flex items-center justify-center\"><p>Loading article data...</p></div>;
  }
  if (sessionStatus === 'unauthenticated') {
     router.push(`/auth/signin?callbackUrl=/admin/articles/edit/${articleId}`);
     return <div className=\"min-h-screen flex items-center justify-center\"><p>Redirecting to sign in...</p></div>;
  }
   // If there's an error and no article data could be loaded (e.g. API not implemented or article not found)
  if (error && !article) {
    return (
      <div className=\"min-h-screen bg-gray-100 py-8\">
        <div className=\"max-w-3xl mx-auto px-4 sm:px-6 lg:px-8\">
           <div className=\"bg-white shadow sm:rounded-lg p-6\">
            <h1 className=\"text-xl font-semibold text-red-700\">Error Loading Article</h1>
            <p className=\"text-gray-700 mt-2\">{error}</p>
            <Link href=\"/admin/articles\" className=\"mt-4 inline-block text-indigo-600 hover:text-indigo-800\">
              &larr; Back to Articles
            </Link>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className=\"min-h-screen bg-gray-100 py-8\">
      <div className=\"max-w-3xl mx-auto px-4 sm:px-6 lg:px-8\">
        <div className=\"flex justify-between items-center mb-6\">
          <h1 className=\"text-2xl font-semibold text-gray-900\">Edit Article</h1>
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
                {allUsers.map(user => (
                  <option key={user._id} value={user._id}>{user.name || user.email}</option>
                ))}
                {/* If current author not in list (e.g. user deleted), or list empty, show current author */}
                {!allUsers.find(u => u._id === authorId) && authorId &&
                  <option value={authorId} disabled>{article?.author && typeof article.author !== 'string' ? (article.author.name || article.author.email) : 'Current Author'}</option>
                }
              </select>
            </div>
          )}


          <div>
            <label htmlFor=\"content\" className=\"block text-sm font-medium text-gray-700 mb-1\">Content</label>
            {/* Only render TiptapEditor if content is loaded to avoid re-initialization issues */}
            {!isLoading && content !== null && <TiptapEditor content={content} onChange={handleContentChange} editorRef={editorRef} />}
            {isLoading && <div className=\"p-3 border border-gray-300 rounded-md min-h-[200px] bg-gray-50 flex items-center justify-center\"><p>Loading editor...</p></div>}
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
              </select>
            </div>
            <div>
              <label htmlFor=\"status\" className=\"block text-sm font-medium text-gray-700\">Status</label>
              <select id=\"status\" value={currentStatus} onChange={(e) => setCurrentStatus(e.target.value as ArticleStatus)}
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
            </div>
          </div>

          <div className=\"pt-4\">
            <button type=\"submit\" disabled={isSubmitting || isLoading || sessionStatus === 'loading'}
                    className=\"w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50\">
              {isSubmitting ? 'Updating...' : 'Update Article'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
