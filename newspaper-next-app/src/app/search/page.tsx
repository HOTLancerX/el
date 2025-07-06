import { Metadata } from 'next';
import Link from 'next/link';
import dbConnect from '@/lib/mongodb';
import ArticleModel, { IArticle } from '@/models/Article';
// Re-using ArticleCard, assuming it's moved or duplicated if not in a shared path accessible here.
// For this example, I'll copy a simplified version.

const ArticleCardSimple: React.FC<{ article: IArticle }> = ({ article }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-6">
      {article.featuredImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={article.featuredImage as string} alt={article.title} className="w-full h-40 object-cover" />
      )}
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-1 hover:text-indigo-600 transition-colors">
          <Link href={`/${article.slug}`}>{article.title}</Link>
        </h3>
        <p className="text-xs text-gray-500 mb-2">
          {article.publicationDate ? new Date(article.publicationDate).toLocaleDateString() : 'Date N/A'}
        </p>
        <p className="text-sm text-gray-600 mb-3">{article.excerpt || `${article.content.substring(0, 100)}...`}</p>
        <Link href={`/${article.slug}`} className="text-sm text-indigo-500 hover:text-indigo-700 font-medium">
          Read more &rarr;
        </Link>
      </div>
    </div>
  );
};


interface SearchPageProps {
  searchParams: { q?: string; page?: string };
}

// Function to perform search and get articles
async function searchArticles(query: string, page: number = 1, limit: number = 10) {
  await dbConnect();

  if (!query || query.trim() === '') {
    return { articles: [], totalArticles: 0, totalPages: 0, searchQuery: '' };
  }

  // Basic text search query using MongoDB's $text operator.
  // Requires a text index on the fields you want to search (e.g., title, content).
  // Example: ArticleSchema.index({ title: 'text', content: 'text', excerpt: 'text' });
  // For this example, let's assume a text index exists.
  const searchQuery = {
    $text: { $search: query },
    status: 'published'
  };

  // If no text index, a regex search can be a fallback (less performant for large datasets):
  // const regex = new RegExp(query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'gi'); // Escape special chars
  // const searchQuery = {
  //   status: 'published',
  //   $or: [
  //     { title: { $regex: regex } },
  //     { content: { $regex: regex } },
  //     { excerpt: { $regex: regex } },
  //   ]
  // };


  const articles = await ArticleModel.find(searchQuery)
    .select('title slug excerpt featuredImage publicationDate content') // Select fields needed for card
    .sort({ score: { $meta: 'textScore' }, publicationDate: -1 }) // Sort by relevance if using $text, then date
    .skip((page - 1) * limit)
    .limit(limit)
    .lean<IArticle[]>();

  const totalArticles = await ArticleModel.countDocuments(searchQuery);
  const totalPages = Math.ceil(totalArticles / limit);

  return { articles, totalArticles, totalPages, searchQuery: query };
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const query = searchParams.q || '';
  const siteBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Newspaper CMS';
  const currentUrl = `${siteBaseUrl}/search${query ? `?q=${encodeURIComponent(query)}` : ''}`;
  const ogImage = `${siteBaseUrl}/default-og-image.png`; // Default OG image

  let title = `Search Articles | ${siteName}`;
  let description = 'Search for articles on our site.';
  const robots = query ? { index: true, follow: true } : { index: false, follow: false }; // Don't index empty search page

  if (query) {
    title = `Search results for "${query}" | ${siteName}`;
    description = `Find articles matching the search term "${query}".`;
  }

  return {
    title: title,
    description: description,
    robots: robots,
    alternates: {
        canonical: currentUrl,
    },
    openGraph: {
      title: title,
      description: description,
      url: currentUrl,
      siteName: siteName,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [ogImage],
      // site: '@yourTwitterHandle',
    },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || '';
  const currentPage = parseInt(searchParams.page || '1');
  const { articles, totalArticles, totalPages, searchQuery } = await searchArticles(query, currentPage);

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-8 pb-4 border-b">
        <h1 className="text-4xl font-bold text-gray-800">Search Results</h1>
      </header>

      {/* Search Form - re-submits to this page with query param */}
      <form method="GET" action="/search" className="mb-8 flex">
        <input
          type="search"
          name="q"
          defaultValue={searchQuery}
          placeholder="Search articles..."
          className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
          aria-label="Search articles"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500"
        >
          Search
        </button>
      </form>

      {searchQuery && (
        <p className="mb-6 text-lg text-gray-700">
          Showing results for: <span className="font-semibold">"{searchQuery}"</span>
        </p>
      )}

      {articles.length === 0 && searchQuery ? (
        <p className="text-gray-600">No articles found matching your search criteria.</p>
      ) : articles.length === 0 && !searchQuery ? (
        <p className="text-gray-600">Please enter a search term to begin.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map((article) => (
            <ArticleCardSimple key={article._id.toString()} article={article} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <nav className="mt-12 flex justify-center items-center space-x-2" aria-label="Pagination">
          {currentPage > 1 && (
            <Link href={`/search?q=${encodeURIComponent(searchQuery)}&page=${currentPage - 1}`}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Previous
            </Link>
          )}
          {/* Simplified pagination display for search */}
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
             let pageNumber = currentPage <= 2 ? i + 1 : currentPage + i -2;
             if(pageNumber > totalPages) return null;
             if(pageNumber <= 0) return null;
             return (
                <Link key={pageNumber} href={`/search?q=${encodeURIComponent(searchQuery)}&page=${pageNumber}`}
                    className={`px-4 py-2 border text-sm font-medium rounded-md
                                ${pageNumber === currentPage
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-600 z-10'
                                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}>
                {pageNumber}
                </Link>
             );
          }).filter(Boolean)}
          {currentPage < totalPages && (
            <Link href={`/search?q=${encodeURIComponent(searchQuery)}&page=${currentPage + 1}`}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Next
            </Link>
          )}
        </nav>
      )}
       <div className="mt-12">
          <Link href="/" className="text-indigo-600 hover:text-indigo-800">
            &larr; Back to Homepage
          </Link>
        </div>
    </main>
  );
}

// Note: For MongoDB $text search to work, you need to create a text index in your MongoDB collection.
// e.g., in mongo shell: db.articles.createIndex({ title: "text", content: "text", excerpt: "text" })
// This page will revalidate based on search query changes implicitly by being dynamic.
// export const revalidate = 300; // Or set a revalidation time if desired for search results pages.
export const dynamic = 'force-dynamic'; // Ensures search results are always fresh based on query.
