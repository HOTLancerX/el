import { Metadata } from 'next';
import Link from 'next/link';
import dbConnect from '@/lib/mongodb';
import ArticleModel, { IArticle } from '@/models/Article';
import TagModel, { ITag } from '@/models/Tag'; // Using Tag model
import { notFound } from 'next/navigation';

// Reusing ArticleCard component (Ideally, this would be in a shared components folder)
const ArticleCard: React.FC<{ article: IArticle }> = ({ article }) => {
  return (
    <article className="bg-white shadow-lg rounded-lg overflow-hidden mb-6 flex flex-col">
      {article.featuredImage && (
        <Link href={`/${article.slug}`} className="block">
          {/* Using next/image is preferred if hostname is configured */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.featuredImage as string} alt={article.title} className="w-full h-48 object-cover" />
        </Link>
      )}
      <div className="p-6 flex flex-col flex-grow">
        <h2 className="text-2xl font-bold mb-2 hover:text-indigo-600 transition-colors">
          <Link href={`/${article.slug}`}>{article.title}</Link>
        </h2>
        {article.publicationDate && (
          <p className="text-sm text-gray-500 mb-2">
            Published on {new Date(article.publicationDate).toLocaleDateString()}
          </p>
        )}
        <p className="text-gray-700 mb-4 flex-grow">{article.excerpt || `${article.content.substring(0, 150)}...`}</p>
        <Link href={`/${article.slug}`} className="text-indigo-600 hover:text-indigo-800 font-semibold mt-auto">
          Read more &rarr;
        </Link>
      </div>
    </article>
  );
};

interface TagArchivePageProps {
  params: { tagSlug: string };
  searchParams: { page?: string };
import { getSiteSettings as fetchSiteSettings } from '@/lib/settingsService'; // aliased

}

async function getTagAndArticles(tagSlug: string, page: number = 1, defaultLimit?: number) {
  await dbConnect();

  let limit = defaultLimit;
  if (limit === undefined) {
    const settings = await fetchSiteSettings();
    limit = settings.postsPerPage > 0 ? settings.postsPerPage : 10;
  }

  const tag = await TagModel.findOne({ slug: tagSlug }).lean<ITag>();

  if (!tag) {
    return { tag: null, articles: [], totalArticles: 0, totalPages: 0 };
  }

  // Query for articles that include this tag in their 'tags' array
  const query = { tags: { $in: [tag._id] }, status: 'published' };
  const articles = await ArticleModel.find(query)
    .populate('author', 'name')
    .sort({ publicationDate: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean<IArticle[]>();

  const totalArticles = await ArticleModel.countDocuments(query);
  const totalPages = Math.ceil(totalArticles / limit);

  return { tag, articles, totalArticles, totalPages };
}

import { getSiteSettings } from '@/lib/settingsService'; // Import settings service

export async function generateMetadata({ params }: TagArchivePageProps): Promise<Metadata> {
  const settings = await getSiteSettings();
  const { tag } = await getTagAndArticles(params.tagSlug);
  const siteBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  // const siteName = settings.siteTitle || process.env.NEXT_PUBLIC_SITE_NAME || 'Newspaper CMS'; // From root layout

  if (!tag) {
    return {
      title: 'Tag Not Found', // Will be formatted by root layout
      robots: { index: false, follow: false },
    };
  }

  const pageTitle = `Articles tagged with "${tag.name}"`;
  const pageDescription = `Browse articles tagged with "${tag.name}". ${settings.siteTagline || ''}`;
  const currentUrl = `${siteBaseUrl}/tag/${tag.slug}`;

  const ogImageSource = settings.defaultOgImage;
  const ogImage = ogImageSource
    ? (ogImageSource.startsWith('http') ? ogImageSource : `${siteBaseUrl}${ogImageSource.startsWith('/') ? '' : '/'}${ogImageSource}`)
    : `${siteBaseUrl}/default-og-image.png`;

  return {
    title: pageTitle, // Root layout will append "| SiteName"
    description: pageDescription,
    alternates: {
        canonical: currentUrl,
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: currentUrl,
      // siteName from root layout
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: [ogImage],
      // site: settings.twitterHandle, // Example
    },
  };
}

// Optional: Generate static paths for tags
// export async function generateStaticParams() {
//   await dbConnect();
//   const tags = await TagModel.find({}).select('slug').lean<ITag[]>();
//   return tags.map((t) => ({
//     tagSlug: t.slug,
//   }));
// }

export default async function TagArchivePage({ params, searchParams }: TagArchivePageProps) {
  const currentPage = parseInt(searchParams.page || '1');
  const { tag, articles, totalArticles, totalPages } = await getTagAndArticles(params.tagSlug, currentPage);

  if (!tag) {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-8 pb-4 border-b">
        <h1 className="text-4xl font-bold text-gray-800">
          Tag: <span className="text-indigo-600">{tag.name}</span>
        </h1>
      </header>

      {articles.length === 0 ? (
        <p className="text-gray-600">No articles found with this tag yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <ArticleCard key={article._id.toString()} article={article} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <nav className="mt-12 flex justify-center items-center space-x-2" aria-label="Pagination">
          {currentPage > 1 && (
            <Link href={`/tag/${tag.slug}?page=${currentPage - 1}`}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Previous
            </Link>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
            <Link key={pageNumber} href={`/tag/${tag.slug}?page=${pageNumber}`}
                  className={`px-4 py-2 border text-sm font-medium rounded-md
                            ${pageNumber === currentPage
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-600 z-10'
                              : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}>
              {pageNumber}
            </Link>
          ))}
          {currentPage < totalPages && (
            <Link href={`/tag/${tag.slug}?page=${currentPage + 1}`}
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

export const revalidate = 60; // Revalidate tag archive pages every 60 seconds
