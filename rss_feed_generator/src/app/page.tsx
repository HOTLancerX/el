"use client";

import { useState, FormEvent } from 'react';

interface FeedResponse {
  message: string;
  originalUrl?: string;
  feedId?: string;
  feedUrl?: string;
  extractedItemsCount?: number;
  extractedItemsPreview?: { title: string; link: string; image?: string }[];
  error?: string;
}

export default function Home() {
  const [url, setUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<FeedResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setResponse(null);
    setError(null);

    if (!url.trim()) {
      setError("Please enter a website URL.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/generate-feed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data: FeedResponse = await res.json();

      if (!res.ok) {
        setError(data.error || `Error: ${res.status} ${res.statusText}`);
      } else {
        setResponse(data);
      }
    } catch (err: any) {
      console.error("Failed to generate feed:", err);
      setError(err.message || 'An unexpected error occurred. Check the console.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-8 sm:p-16 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="w-full max-w-2xl">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400">RSS Feed Generator</h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
            Enter a website URL to attempt to generate an RSS feed.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Website URL
            </label>
            <input
              type="url"
              name="url"
              id="url"
              className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="https://example.com/blog"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              aria-describedby="url-description"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400" id="url-description">
              Make sure to include http:// or https://
            </p>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Generate Feed'
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-8 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-md shadow-md">
            <h3 className="font-medium">Error:</h3>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {response && (
          <div className="mt-8 p-6 bg-green-50 dark:bg-gray-800 border border-green-300 dark:border-gray-700 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-green-700 dark:text-green-300">Feed Generation Result</h2>
            <p className="mb-2 text-sm text-gray-600 dark:text-gray-300"><strong>Status:</strong> {response.message}</p>
            {response.feedUrl && (
              <div className="mb-4">
                <p className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Your new RSS Feed URL:</p>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}${response.feedUrl}`}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 cursor-pointer"
                    onFocus={(e) => e.target.select()}
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}${response.feedUrl}`)}
                    className="px-3 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md dark:bg-blue-600 dark:hover:bg-blue-700"
                    title="Copy to clipboard"
                  >
                    Copy
                  </button>
                </div>
                <a
                  href={response.feedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Open Feed
                </a>
              </div>
            )}
            {response.originalUrl && <p className="mb-1 text-xs text-gray-500 dark:text-gray-400"><strong>Original URL:</strong> {response.originalUrl}</p>}
            {response.extractedItemsCount !== undefined && <p className="mb-1 text-xs text-gray-500 dark:text-gray-400"><strong>Items Extracted:</strong> {response.extractedItemsCount}</p>}

            {response.extractedItemsPreview && response.extractedItemsPreview.length > 0 && (
              <div className="mt-4">
                <h4 className="text-md font-semibold mb-2 text-gray-700 dark:text-gray-200">Extracted Items Preview (up to 3):</h4>
                <ul className="space-y-3 list-disc list-inside pl-2 text-sm">
                  {response.extractedItemsPreview.map((item, index) => (
                    <li key={index} className="text-gray-600 dark:text-gray-300">
                      <strong className="text-gray-800 dark:text-gray-100">{item.title}</strong>
                      {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-500 hover:underline text-xs">(link)</a>}
                      {item.image && <img src={item.image} alt="Preview" className="mt-1 max-w-xs max-h-20 rounded"/>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
