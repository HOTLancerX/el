import { MetadataRoute } from 'next';
import dbConnect from '@/lib/mongodb';
import ArticleModel, { IArticle } from '@/models/Article';
import PageModel, { IPage } from '@/models/Page';
import CategoryModel, { ICategory } from '@/models/Category';
import TagModel, { ITag } from '@/models/Tag';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await dbConnect();

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // 1. Homepage
  sitemapEntries.push({
    url: SITE_URL,
    lastModified: new Date(), // Or a more specific date if available
    changeFrequency: 'daily',
    priority: 1.0,
  });

  // 2. Static Pages (e.g., /about, /contact - if they are stored in the PageModel)
  //    Assuming pages have a 'slug' field and are published.
  const pages = await PageModel.find({ status: 'published' }).select('slug updatedAt').lean<IPage[]>();
  pages.forEach(page => {
    sitemapEntries.push({
      url: `${SITE_URL}/${page.slug}`,
      lastModified: page.updatedAt || new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  });

  // 3. Search Page (optional, often excluded if content is purely dynamic results)
  sitemapEntries.push({
    url: `${SITE_URL}/search`,
    lastModified: new Date(),
    changeFrequency: 'weekly', // If the search interface itself changes
    priority: 0.5,
  });


  // 4. Articles
  const articles = await ArticleModel.find({ status: 'published' }).select('slug updatedAt publicationDate').lean<IArticle[]>();
  articles.forEach(article => {
    sitemapEntries.push({
      url: `${SITE_URL}/${article.slug}`, // Assuming articles are at root/[slug]
      lastModified: article.updatedAt || article.publicationDate || new Date(),
      changeFrequency: 'weekly', // Or 'daily' if articles are updated frequently
      priority: 0.8,
    });
  });

  // 5. Categories
  const categories = await CategoryModel.find({}).select('slug updatedAt').lean<ICategory[]>();
  categories.forEach(category => {
    sitemapEntries.push({
      url: `${SITE_URL}/category/${category.slug}`,
      lastModified: category.updatedAt || new Date(), // Or a date when articles in it last changed
      changeFrequency: 'daily',
      priority: 0.7,
    });
  });

  // 6. Tags
  const tags = await TagModel.find({}).select('slug updatedAt').lean<ITag[]>();
  tags.forEach(tag => {
    sitemapEntries.push({
      url: `${SITE_URL}/tag/${tag.slug}`,
      lastModified: tag.updatedAt || new Date(), // Or a date when articles in it last changed
      changeFrequency: 'daily',
      priority: 0.6,
    });
  });

  // Add any other important public routes

  return sitemapEntries;
}
