import { Metadata } from 'next';
import Link from 'next/link';
import dbConnect from '@/lib/mongodb';
import ArticleModel, { IArticle } from '@/models/Article';
import CategoryModel, { ICategory } from '@/models/Category';
import { notFound } from 'next/navigation';

// Basic Article Card component (can be moved to a shared components folder)
const ArticleCard: React.FC<{ article: IArticle }> = ({ article }) => {
  return (
    <article className="bg-white shadow-lg rounded-lg overflow-hidden mb-6 flex flex-col">
      {article.featuredImage && (
        <Link href={`/${article.slug}`} className="block">
          {/* Using next/image is preferred if hostname is configured */}
          {/* For now, keeping img for simplicity if R2 URLs are external and not easily configured for next/image */}
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
            {/* {article.author && typeof article.author !== 'string' && article.author.name && ` by ${article.author.name}`} */}
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


interface CategoryArchivePageProps {
  params: { categorySlug: string };
  searchParams: { page?: string };
import { getSiteSettings as fetchSiteSettings } from '@/lib/settingsService'; // aliased to avoid conflict

}

async function getCategoryAndArticles(categorySlug: string, page: number = 1, defaultLimit?: number) {
  await dbConnect();

  let limit = defaultLimit;
  if (limit === undefined) {
    const settings = await fetchSiteSettings();
    limit = settings.postsPerPage > 0 ? settings.postsPerPage : 10;
  }

  const category = await CategoryModel.findOne({ slug: categorySlug }).lean<ICategory>();

  if (!category) {
    return { category: null, articles: [], totalArticles: 0, totalPages: 0 };
  }

  const query = { category: category._id, status: 'published' };
  const articles = await ArticleModel.find(query)
    .populate('author', 'name') // Example: only populate name
    .sort({ publicationDate: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean<IArticle[]>();

  const totalArticles = await ArticleModel.countDocuments(query);
  const totalPages = Math.ceil(totalArticles / limit);

  return { category, articles, totalArticles, totalPages };
}

import { getSiteSettings } from '@/lib/settingsService'; // Import settings service

export async function generateMetadata({ params }: CategoryArchivePageProps): Promise<Metadata> {
  const settings = await getSiteSettings();
  const { category } = await getCategoryAndArticles(params.categorySlug);
  const siteBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  // const siteName = settings.siteTitle || process.env.NEXT_PUBLIC_SITE_NAME || 'Newspaper CMS'; // siteName from root layout

  if (!category) {
    return {
      title: 'Category Not Found', // Will be formatted by root layout
      robots: { index: false, follow: false },
    };
  }

  const pageTitle = `Articles in ${category.name}`;
  const pageDescription = `Browse articles categorized under ${category.name}. ${category.description || settings.siteTagline || ''}`;
  const currentUrl = `${siteBaseUrl}/category/${category.slug}`;

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

// Optional: Generate static paths for categories if you want to pre-render them
// export async function generateStaticParams() {
//   await dbConnect();
//   const categories = await CategoryModel.find({}).select('slug').lean<ICategory[]>();
//   return categories.map((cat) => ({
//     categorySlug: cat.slug,
//   }));
// }


export default async function CategoryArchivePage({ params, searchParams }: CategoryArchivePageProps) {
  const currentPage = parseInt(searchParams.page || '1');
  const { category, articles, totalArticles, totalPages } = await getCategoryAndArticles(params.categorySlug, currentPage);

  if (!category) {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-8 pb-4 border-b">
        <h1 className="text-4xl font-bold text-gray-800">
          Category: <span className="text-indigo-600">{category.name}</span>
        </h1>
        {category.description && <p className="text-lg text-gray-600 mt-2">{category.description}</p>}
      </header>

      {articles.length === 0 ? (
        <p className="text-gray-600">No articles found in this category yet.</p>
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
            <Link href={`/category/${category.slug}?page=${currentPage - 1}`}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Previous
            </Link>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
            <Link key={pageNumber} href={`/category/${category.slug}?page=${pageNumber}`}
                  className={`px-4 py-2 border text-sm font-medium rounded-md
                            ${pageNumber === currentPage
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-600 z-10'
                              : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}>
              {pageNumber}
            </Link>
          ))}
          {currentPage < totalPages && (
            <Link href={`/category/${category.slug}?page=${currentPage + 1}`}
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

export const revalidate = 60; // Revalidate category archive pages every 60 seconds
