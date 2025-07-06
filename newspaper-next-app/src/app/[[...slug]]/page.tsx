import { Metadata } from 'next';
import dbConnect from '@/lib/mongodb';
import PageModel, { IPage } from '@/models/Page'; // Page model
import ArticleModel, { IArticle } from '@/models/Article'; // Article model
import LayoutModel, { ILayout, IRow, IColumn, IWidgetConfig } from '@/models/Layout'; // Layout model
import { notFound } from 'next/navigation';

// --- Widget Component Placeholders ---
// These would be actual React components in a real scenario
// For now, simple functions to represent them.

interface WidgetProps {
  config: IWidgetConfig;
}

const RichTextWidget: React.FC<WidgetProps> = ({ config }) => {
  const text = config.settings?.text || '<p>Rich text content missing or invalid.</p>';
  return <div className="widget rich-text-widget p-4 my-2 bg-gray-100 rounded" dangerouslySetInnerHTML={{ __html: text }} />;
};

const ImageWidget: React.FC<WidgetProps> = ({ config }) => {
  const src = config.settings?.src || '';
  const alt = config.settings?.alt || 'Image missing';
  if (!src) {
    return <div className="widget image-widget p-4 my-2 bg-red-100 rounded text-red-700">Image source missing.</div>;
  }
  // In a real app, use next/image here for optimization
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className="widget image-widget my-2 rounded max-w-full h-auto" />;
};

// Add more widget components as needed (e.g., ButtonWidget, LatestArticlesWidget)
const WidgetComponentMap: Record<string, React.FC<WidgetProps>> = {
  'RichTextWidget': RichTextWidget,
  'ImageWidget': ImageWidget,
  // 'ButtonWidget': ButtonWidget,
  // ... other widgets
};

const renderWidget = (widgetConfig: IWidgetConfig) => {
  const Widget = WidgetComponentMap[widgetConfig.type];
  if (Widget) {
    return <Widget key={widgetConfig.id} config={widgetConfig} />;
  }
  return <div key={widgetConfig.id} className="widget p-4 my-2 bg-yellow-100 rounded text-yellow-700">Unknown widget type: {widgetConfig.type}</div>;
};


// --- Main Page Rendering Logic ---

interface DynamicPageProps {
  params: { slug?: string[] };
}

// Function to fetch data (Page or Article) and its layout
async function getContentData(slugParts?: string[]): Promise<{ type: 'page' | 'article' | 'notFound'; data: (IPage | IArticle) | null; layout: ILayout | null }> {
  await dbConnect();
  let slug = '/'; // Default for homepage
  if (slugParts && slugParts.length > 0) {
    slug = slugParts.join('/');
  }

  // Try to find a Page first
  // Need to lean on populated layout here directly, or fetch separately.
  // For simplicity, fetching layout separately if Page/Article has layout ID.
  let pageData = await PageModel.findOne({ slug }).lean<IPage>();
  if (pageData) {
    let layoutData = null;
    if (pageData.layout) {
      layoutData = await LayoutModel.findById(pageData.layout).lean<ILayout>();
    }
    return { type: 'page', data: pageData, layout: layoutData };
  }

  // If no Page, try to find an Article (assuming articles might not have leading slashes, or a prefix like /posts/)
  // For this example, let's assume article slugs are unique and don't overlap with page slugs directly,
  // or that there's a more specific routing mechanism for articles (e.g., /articles/[slug]).
  // If using a generic [[...slug]], need a clear way to distinguish.
  // For now, we'll just try finding an article with the exact slug.
  let articleData = await ArticleModel.findOne({ slug, status: 'published' }).lean<IArticle>();
  if (articleData) {
    let layoutData = null;
    if (articleData.layout) {
      layoutData = await LayoutModel.findById(articleData.layout).lean<ILayout>();
    }
    // If no specific layout, an article might have a default template (handled by frontend logic or a site-wide setting)
    return { type: 'article', data: articleData, layout: layoutData };
  }

  return { type: 'notFound', data: null, layout: null };
}


export async function generateMetadata({ params }: DynamicPageProps): Promise<Metadata> {
  const { data, type } = await getContentData(params.slug);
  const siteBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'; // Fallback for local dev

  if (type === 'notFound' || !data) {
    return {
      title: 'Page Not Found',
      robots: { index: false, follow: false }, // Tell search engines not to index 404s
    };
  }

  const title = data.metaTitle || data.title || 'Page';
  const description = data.metaDescription || (type === 'article' ? (data as IArticle).excerpt?.substring(0, 160) : undefined) || 'Page description';
  const slug = params.slug?.join('/') || '';
  const currentUrl = `${siteBaseUrl}/${slug}`;
  // Determine og:image (prioritize featuredImage for articles)
  let ogImage = `${siteBaseUrl}/default-og-image.png`; // Fallback OG image
  if (type === 'article' && (data as IArticle).featuredImage) {
    const featuredImageUrl = (data as IArticle).featuredImage as string;
    // Ensure featuredImage is an absolute URL or prepend base URL
    ogImage = featuredImageUrl.startsWith('http') ? featuredImageUrl : `${siteBaseUrl}${featuredImageUrl}`;
  }


  return {
    title: title,
    description: description,
    alternates: {
        canonical: currentUrl,
    },
    openGraph: {
      title: title,
      description: description,
      url: currentUrl,
      siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'Newspaper CMS', // Add NEXT_PUBLIC_SITE_NAME to .env
      images: [{ url: ogImage, width: 1200, height: 630 }], // Provide default dimensions
      type: type === 'article' ? 'article' : 'website',
      // For articles, add more specific OG tags like article:published_time, article:author etc.
      ...(type === 'article' && {
        publishedTime: (data as IArticle).publicationDate?.toISOString(),
        // authors: typeof (data as IArticle).author === 'object' ? [(data as IArticle).author as any].name : undefined, // Simplified
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [ogImage],
      // site: '@yourTwitterHandle', // Add your Twitter handle
      // creator: '@authorTwitterHandle', // If available
    },
    // Add other SEO metadata: keywords, etc.
  };
}


export default async function DynamicPage({ params }: DynamicPageProps) {
  const { type, data: contentData, layout: specificLayout } = await getContentData(params.slug);

  if (type === 'notFound' || !contentData) {
    notFound(); // Triggers Next.js 404 page
  }

  // --- Render Content based on Layout (if available) or default ---
  const renderContentWithLayout = (currentLayout: ILayout) => {
    return (
      <div className="layout-container mx-auto max-w-full">
        {/* Render global settings if any - e.g. background, max-width from currentLayout.structure.globalSettings */}
        {currentLayout.structure.rows.map((row: IRow) => (
          <div key={row.id} className=\"flex flex-wrap my-2\" style={row.settings as React.CSSProperties /* Basic style application */}>
            {/* In a real app, row settings could define more complex flex/grid behaviors */}
            {row.columns.map((col: IColumn) => (
              <div key={col.id} className={`p-2 ${col.widthClasses ? col.widthClasses.join(' ') : 'w-full'}`}>
                {col.widgets.map(renderWidget)}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  // --- Default rendering if no specific layout is assigned ---
  const renderDefaultContent = () => {
    if (type === 'page') {
      const page = contentData as IPage;
      return (
        <article className="prose lg:prose-xl mx-auto py-8 px-4">
          <h1>{page.title}</h1>
          {page.content && <div dangerouslySetInnerHTML={{ __html: page.content }} />}
        </article>
      );
    }
    if (type === 'article') {
      const article = contentData as IArticle;
      return (
        <article className="prose lg:prose-xl mx-auto py-8 px-4">
          <h1>{article.title}</h1>
          {/* Could show author, date, category here */}
          {article.featuredImage && <img src={article.featuredImage as string} alt={article.title} className="my-4 rounded" />}
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
        </article>
      );
    }
    return <p>Content type not supported for default rendering.</p>;
  };


  return (
    <main className="container mx-auto px-4 py-8">
      {/* Example: A simple header could go here, or be part of a global layout component */}
      {/* <header className="mb-8 text-center">
        <Link href="/"><h1 className="text-4xl font-bold">My Newspaper</h1></Link>
      </header> */}

      {specificLayout ? renderContentWithLayout(specificLayout) : renderDefaultContent()}

      {/* Example: A simple footer */}
      {/* <footer className="mt-12 pt-8 border-t text-center text-gray-500">
        <p>&copy; {new Date().getFullYear()} Newspaper CMS. All rights reserved.</p>
      </footer> */}
    </main>
  );
}

// This tells Next.js to dynamically render pages that are not pre-generated at build time.
// export const dynamic = 'force-dynamic'; // Or 'auto', or remove for default behavior (SSG if possible)
// For a newspaper, ISR (getStaticProps + revalidate) or SSR (getServerSideProps) are common.
// With App Router, server components fetch data by default. Caching strategies control re-rendering.
// We can use `export const revalidate = SECONDS;` for ISR-like behavior.
export const revalidate = 60; // Revalidate cached pages (data) at most every 60 seconds
