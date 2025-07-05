import { parseString } from "xml2js";
import { promisify } from "util";
import dbConnect from "./mongodb";
import News, { INews } from "@/models/News";
import Feed, { IFeed } from "@/models/Feed";
import Category, { ICategory } from "@/models/Category"; // For type safety

const parseXML = promisify(parseString);

interface RawNewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid: string;
  image?: string; // From media:content
  contentEncoded?: string; // From content:encoded
  domain: string;
  categoryId: ICategory['_id'];
}

async function fetchOGImageFromPage(link: string): Promise<string | null> {
  if (!link) return null;
  try {
    const response = await fetch(link, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      cache: "no-store", // Don't cache the page fetch itself
      signal: AbortSignal.timeout(10000), // Timeout after 10 seconds
    });

    if (!response.ok) {
        console.warn(`OG Image: Failed to fetch page ${link}: ${response.status}`);
        return null;
    }

    const html = await response.text();
    const ogMatch = html.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    const twitterMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);

    let imageUrl = ogMatch?.[1] || twitterMatch?.[1] || null;

    // Ensure URL is absolute
    if (imageUrl && !imageUrl.startsWith('http')) {
        const pageUrl = new URL(link);
        imageUrl = new URL(imageUrl, pageUrl.origin).href;
    }
    return imageUrl;

  } catch (error: any) {
    if (error.name === 'AbortError') {
        console.warn(`OG Image: Timeout fetching page ${link}`);
    } else {
        console.warn(`OG Image: Error fetching page ${link}:`, error.message);
    }
    return null;
  }
}

async function fetchAndParseRSS(feedUrl: string, categoryId: ICategory['_id']): Promise<RawNewsItem[]> {
  try {
    const response = await fetch(feedUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; RssNewsAppBot/1.0; +http://example.com/bot.html)" },
      signal: AbortSignal.timeout(15000), // Timeout for RSS feed fetch
    });

    if (!response.ok) {
      console.error(`RSS Fetch: Failed to fetch ${feedUrl}: ${response.status}`);
      return [];
    }

    const xmlText = await response.text();
    const result = (await parseXML(xmlText)) as any;

    const items = result?.rss?.channel?.[0]?.item || result?.feed?.entry || [];
    const domain = new URL(feedUrl).hostname;
    const rawNewsItems: RawNewsItem[] = [];

    for (const item of items) {
      const title = item.title?.[0]?._ || item.title?.[0] || "";
      let link = item.link?.[0]?.$?.href || item.link?.[0] || "";
      if (Array.isArray(item.link)) { // Handle multiple link tags, prefer alternate
        const alternateLink = item.link.find((l: any) => l.$.rel === 'alternate');
        if (alternateLink) link = alternateLink.$.href;
        else if (item.link[0]?.$?.href) link = item.link[0].$.href;
        else if (item.link[0]) link = item.link[0];
      }


      const pubDateStr = item.pubDate?.[0] || item.published?.[0] || item.updated?.[0] || new Date().toISOString();
      const guid = item.guid?.[0]?._ || item.guid?.[0] || item.id?.[0] || link; // Use link as fallback guid

      const contentEncoded = item["content:encoded"]?.[0]?.trim() || item.content?.[0]?._?.trim();
      const descriptionFromRSS = item.description?.[0] || item.summary?.[0]?._ || "";

      // Prioritize content:encoded, then description from RSS
      const description = contentEncoded || descriptionFromRSS;

      // Image from media:content or enclosure
      let image = item["media:content"]?.[0]?.$?.url || item.enclosure?.[0]?.$?.url || "";
      if (item["media:thumbnail"]?.[0]?.$?.url && !image) {
        image = item["media:thumbnail"]?.[0]?.$?.url;
      }
      // Atom feeds might have images in links with rel="enclosure" and type="image/*"
      if (!image && Array.isArray(item.link)) {
        const imageLink = item.link.find((l: any) => l.$.rel === 'enclosure' && l.$.type?.startsWith('image/'));
        if (imageLink) image = imageLink.$.href;
      }


      if (title && link) {
        rawNewsItems.push({
          title: title.trim(),
          link: link.trim(),
          description: description.trim(),
          pubDate: pubDateStr,
          guid,
          image: image?.trim(),
          domain,
          categoryId,
          contentEncoded // Keep to pass for further processing if needed
        });
      }
    }
    return rawNewsItems;
  } catch (error: any) {
     if (error.name === 'AbortError') {
        console.error(`RSS Fetch: Timeout fetching RSS feed ${feedUrl}`);
    } else {
        console.error(`RSS Fetch: Error fetching or parsing RSS feed ${feedUrl}:`, error.message);
    }
    return [];
  }
}

export async function processSingleFeed(feedConfig: IFeed): Promise<{ processed: number, new: number, errors: number }> {
  console.log(`Processing feed: ${feedConfig.rss_url} for category ${feedConfig.category_id}`);
  let stats = { processed: 0, new: 0, errors: 0 };

  const rawItems = await fetchAndParseRSS(feedConfig.rss_url, feedConfig.category_id);
  if (rawItems.length === 0) {
    console.log(`No items found or error in feed: ${feedConfig.rss_url}`);
    // Update last_fetched_at even if no items or error, to prevent immediate re-fetch unless desired
    await Feed.findByIdAndUpdate(feedConfig._id, { last_fetched_at: new Date() });
    return stats;
  }

  for (const rawItem of rawItems) {
    stats.processed++;
    try {
      const existingNews = await News.findOne({ source_link: rawItem.link });
      if (existingNews) {
        // console.log(`Skipping existing item: ${rawItem.link}`);
        continue;
      }

      let finalImage = rawItem.image;
      if (!finalImage && rawItem.link) {
        // console.log(`Attempting to fetch OG image for: ${rawItem.link}`);
        finalImage = await fetchOGImageFromPage(rawItem.link);
      }

      // Clean up description (basic HTML tag removal, could be more sophisticated)
      let cleanDescription = rawItem.description.replace(/<[^>]*>/g, "").replace(/\s+/g, ' ').trim();
      if (cleanDescription.length > 1000) { // Truncate if very long
          cleanDescription = cleanDescription.substring(0, 997) + "...";
      }


      const newsDocument: Partial<INews> = {
        title: rawItem.title,
        description: cleanDescription,
        source_link: rawItem.link,
        category: rawItem.categoryId,
        pubDate: new Date(rawItem.pubDate), // Attempt to parse date
        domain: rawItem.domain,
        images: finalImage ? [finalImage] : [], // Store as an array
        isActive: true, // New posts are active by default
      };

      await News.create(newsDocument);
      // console.log(`Added new item: ${rawItem.title}`);
      stats.new++;
    } catch (error: any) {
      stats.errors++;
      console.error(`Error processing item "${rawItem.title}" from ${rawItem.link}:`, error.message);
       if (error.code === 11000) { // Duplicate key error, though findOne should catch it
          console.warn(`Duplicate entry slipped through for ${rawItem.link}`);
      }
    }
  }

  await Feed.findByIdAndUpdate(feedConfig._id, { last_fetched_at: new Date() });
  console.log(`Finished processing feed: ${feedConfig.rss_url}. Processed: ${stats.processed}, New: ${stats.new}, Errors: ${stats.errors}`);
  return stats;
}


export async function processAllActiveFeeds(): Promise<string[]> {
  await dbConnect();
  const summary: string[] = [];
  console.log("Starting to process all active feeds...");

  const activeFeeds = await Feed.find({ is_active: true }).populate('category_id', 'title'); // Populate for logging
  if (activeFeeds.length === 0) {
    const message = "No active feeds found to process.";
    console.log(message);
    summary.push(message);
    return summary;
  }

  console.log(`Found ${activeFeeds.length} active feeds to process.`);
  summary.push(`Found ${activeFeeds.length} active feeds.`);

  for (const feedConfig of activeFeeds) {
    const categoryTitle = (feedConfig.category_id as ICategory)?.title || feedConfig.category_id.toString();
    const feedSummary = `Processing feed: ${feedConfig.rss_url} (Category: ${categoryTitle})`;
    console.log(feedSummary);

    const stats = await processSingleFeed(feedConfig);
    summary.push(`Feed: ${feedConfig.rss_url} - Processed: ${stats.processed}, New: ${stats.new}, Errors: ${stats.errors}`);
  }

  const finalMessage = "Finished processing all active feeds.";
  console.log(finalMessage);
  summary.push(finalMessage);
  return summary;
}
