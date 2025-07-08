import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { XMLBuilder } from 'xmlbuilder2/lib/interfaces'; // Correct import for XMLBuilder type
import clientPromise from '@/lib/mongodb';

// Helper function to build RSS XML
function buildRssXml(
  feedTitle: string,
  originalSiteLink: string, // Link to the original website
  feedDescription: string,
  items: any[],
  selfFeedUrl: string // The URL of this generated RSS feed
): string {
  const rssFeed: any = {
    rss: {
      '@version': '2.0',
      '@xmlns:atom': 'http://www.w3.org/2005/Atom',
      channel: {
        title: feedTitle,
        link: originalSiteLink, // Link to the website, not the feed itself
        description: feedDescription,
        language: 'en-us', // TODO: Could try to detect from page lang attribute
        pubDate: new Date().toUTCString(), // Feed's publication date
        lastBuildDate: new Date().toUTCString(), // When the feed was last built
        generator: 'Jules RSS Feed Generator',
        'atom:link': { // Self-referencing link to the feed
          '@href': selfFeedUrl,
          '@rel': 'self',
          '@type': 'application/rss+xml'
        },
        item: items.map(item => {
          let itemPubDate;
          try {
            itemPubDate = item.pubDate ? new Date(item.pubDate).toUTCString() : new Date().toUTCString();
          } catch (e) {
            itemPubDate = new Date().toUTCString(); // Fallback if date parsing fails
          }

          const feedItem: any = {
            title: item.title || 'No title',
            link: item.link, // URL to the original post/item
            guid: { // GUID should be unique, permalink is good if available
              '#text': item.link, // Content of guid
              '@isPermaLink': 'true'
            },
            pubDate: itemPubDate,
            description: `<![CDATA[${item.fullDescription || item.description || 'No description available.'}]]>`,
          };

          if (item.category) {
            feedItem.category = item.category;
          }

          if (item.image) {
            feedItem.enclosure = {
              '@url': item.image,
              '@type': item.image.endsWith('.png') ? 'image/png' : item.image.endsWith('.gif') ? 'image/gif' : 'image/jpeg', // Basic type detection
              // '@length': '0' // Optional: if you know the image size, required by some strict readers
            };
            // Also add image to description for readers that don't show enclosure
            feedItem.description = `<![CDATA[<img src="${item.image}" alt="${item.title || ''}" /><br/>${item.fullDescription || item.description || 'No description available.'}]]>`;
          }

          // Add 'type' (post/product) if found
          if (item.itemType) {
            // Could be a custom element like <content:type>Post</content:type>
            // For simplicity, adding to description or as a category
            feedItem.category = feedItem.category ? [feedItem.category, item.itemType].join(', ') : item.itemType;
            // Or append to description:
            // feedItem.description = `<![CDATA[<p>Type: ${item.itemType}</p>${feedItem.description.replace('<![CDATA[', '').replace(']]>', '')}]]>`;
          }
          return feedItem;
        }),
      },
    },
  };

  const builder = require('xmlbuilder2').create(rssFeed);
  return builder.end({ prettyPrint: true });
}

// Helper function to safely get text or attribute
export const safeGet = (el: cheerio.Cheerio<cheerio.Element> | undefined, selector: string, type: 'text' | 'attr' = 'text', attrName?: string): string => {
  if (!el) return '';
  const target = selector ? el.find(selector).first() : el.first();
  if (type === 'text') return target.text().trim();
  if (type === 'attr' && attrName) return target.attr(attrName)?.trim() || '';
  return '';
};

// Helper to resolve relative URLs
export const resolveUrl = (baseUrl: string, relativeUrl?: string): string | undefined => {
  if (!relativeUrl) return undefined;
  try {
    return new URL(relativeUrl, baseUrl).href;
  } catch (e) {
    return relativeUrl; // if it's already absolute or invalid, return as is
  }
};


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }
    // Ensure URL has a scheme
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'http://' + url;
    }


    try {
      new URL(url);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    console.log(`Processing URL: ${url}`);
    const baseUrl = new URL(url).origin; // For resolving relative links

    let htmlContent;
    try {
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
        timeout: 10000, // 10 second timeout
      });
      htmlContent = response.data;
    } catch (fetchError: any) {
      console.error(`Error fetching URL ${url}:`, fetchError.message);
      return NextResponse.json({ error: `Failed to fetch content from URL: ${fetchError.message}` }, { status: 500 });
    }

    const $ = cheerio.load(htmlContent);
    const extractedItems: any[] = [];

    // Global page metadata for the feed channel
    const pageTitle = safeGet($('head'), 'title') ||
                      safeGet($('head'), 'meta[property="og:title"]', 'attr', 'content') ||
                      'Untitled Feed';
    const pageDescription = safeGet($('head'), 'meta[name="description"]', 'attr', 'content') ||
                            safeGet($('head'), 'meta[property="og:description"]', 'attr', 'content') ||
                            `RSS feed generated from ${url}`;
    const siteLanguage = $('html').attr('lang') || 'en-us';


    // Common item containers
    const itemSelectors = [
        'article', '.post', '.entry', '.item', '.card', '.list-item', '.feed-item',
        '[itemscope][itemtype="http://schema.org/Article"]',
        '[itemscope][itemtype="http://schema.org/BlogPosting"]',
        '[itemscope][itemtype="http://schema.org/NewsArticle"]',
        '[itemscope][itemtype="http://schema.org/Product"]'
    ];

    $(itemSelectors.join(', ')).each((index, element) => {
      if (extractedItems.length >= 25) return false; // Limit number of items

      const el = $(element);

      // Title extraction
      let title = safeGet(el, 'h1, h2, h3, .title, .entry-title, .card-title, .post-title, [itemprop="headline"], [itemprop="name"]');
      if (!title) title = safeGet(el, 'meta[property="og:title"]', 'attr', 'content'); // Check meta within item scope

      // Link extraction
      let itemLink = safeGet(el, 'a[itemprop="url"], a', 'attr', 'href');
      if(!itemLink) itemLink = safeGet(el, 'meta[property="og:url"]', 'attr', 'content');
      itemLink = resolveUrl(baseUrl, itemLink);


      // Full Description extraction
      let fullDescriptionHtml = safeGet(el, '.entry-content, .post-content, .article-body, .content, .description, [itemprop="articleBody"], [itemprop="description"]', 'html');
      if (!fullDescriptionHtml) {
          fullDescriptionHtml = el.find('p').map((i, p_el) => $(p_el).html()).get().join('');
      }
      if (!fullDescriptionHtml && title && !itemLink) fullDescriptionHtml = title; // If it's just a title, use it as desc.

      // Short description (plain text)
      const shortDescription = cheerio.load(fullDescriptionHtml || '').text().substring(0, 250) + '...';

      // Image extraction
      let image = safeGet(el, 'img[itemprop="image"], img', 'attr', 'src');
      if (!image) image = safeGet(el, 'meta[property="og:image"]', 'attr', 'content');
      if (!image) image = safeGet(el, 'meta[name="twitter:image"]', 'attr', 'content');
      image = resolveUrl(baseUrl, image);

      // Publication Date extraction
      let pubDate = safeGet(el, 'time[itemprop="datePublished"], time[itemprop="dateCreated"], .date, .published, .post-date, [datetime]', 'attr', 'datetime');
      if (!pubDate) pubDate = safeGet(el, 'time[itemprop="datePublished"], time[itemprop="dateCreated"], .date, .published, .post-date', 'text');
      if (!pubDate) pubDate = safeGet(el, 'meta[property="article:published_time"]', 'attr', 'content');
      if (!pubDate) pubDate = safeGet(el, 'meta[name="dcterms.created"]', 'attr', 'content');


      // Category extraction
      let category = safeGet(el, '.category, .tags a, .entry-category, [itemprop="articleSection"], [itemprop="keywords"]');
      if (!category) category = el.find('meta[property="article:tag"]').map((i, tagEl) => $(tagEl).attr('content')).get().join(', ');


      // Item Type (Post/Product) - Experimental
      let itemType = '';
      const schemaType = el.attr('itemtype');
      if (schemaType) {
          if (schemaType.toLowerCase().includes('product')) itemType = 'Product';
          else if (schemaType.toLowerCase().includes('article') || schemaType.toLowerCase().includes('blogposting')) itemType = 'Post';
      }
      if (!itemType && fullDescriptionHtml.toLowerCase().includes('price')) itemType = 'Product'; // Very naive guess
      if (!itemType && (itemLink?.includes('/product/') || el.find('.price').length > 0)) itemType = 'Product';
      if (!itemType && (itemLink?.includes('/post/') || itemLink?.includes('/blog/'))) itemType = 'Post';


      if (title && itemLink) {
        extractedItems.push({
          title,
          link: itemLink,
          fullDescription: fullDescriptionHtml,
          description: shortDescription,
          image,
          pubDate,
          category,
          itemType
        });
      }
    });

    // Fallback if no structured items found
    if (extractedItems.length === 0) {
      $('a[href]').each((index, element) => {
        if (extractedItems.length >= 25) return false;
        const title = $(element).text().trim();
        let itemLink = $(element).attr('href');
        itemLink = resolveUrl(baseUrl, itemLink);

        if (title && itemLink && itemLink.startsWith('http') && title.length > 20 && title.length < 200) {
          extractedItems.push({ title, link: itemLink, description: title, pubDate: new Date().toISOString() });
        }
      });
    }

    console.log(`Extracted ${extractedItems.length} potential items.`);

    const feedId = `feed_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    // Construct the full URL for the feed itself for atom:link
    const currentRequestUrl = new URL(request.url); // URL of the /api/generate-feed request
    const selfFeedUrl = `${currentRequestUrl.origin}/api/feed/${feedId}`;

    const generatedRssXml = buildRssXml(pageTitle, url, pageDescription, extractedItems, selfFeedUrl);

    try {
      const client = await clientPromise;
      const db = client.db(); // Use default DB from MONGODB_URI or specify one
      const collection = db.collection('generated_feeds');

      const feedDocument = {
        feedId,
        originalUrl: url,
        feedTitle: pageTitle,
        rssXml: generatedRssXml,
        itemsCount: extractedItems.length,
        createdAt: new Date(),
        lastUpdatedAt: new Date(),
      };

      await collection.insertOne(feedDocument);
      console.log(`Feed ${feedId} stored in MongoDB.`);

    } catch (dbError: any) {
      console.error('Error storing feed in MongoDB:', dbError.message);
      // Decide if this is a fatal error for the request or if we can proceed without DB storage
      return NextResponse.json({ error: 'Failed to store feed data.' }, { status: 500 });
    }

    return NextResponse.json({
      message: extractedItems.length > 0 ? 'Feed generated and stored successfully.' : 'Could not extract structured items, used generic links. Feed generated.',
      originalUrl: url,
      feedId: feedId,
      feedUrl: `/api/feed/${feedId}`, // This will be the endpoint to serve the XML
      extractedItemsCount: extractedItems.length,
      extractedItemsPreview: extractedItems.slice(0, 3).map(item => ({title: item.title, link: item.link, image: item.image})),
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in generate-feed API:', error.stack || error.message);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
