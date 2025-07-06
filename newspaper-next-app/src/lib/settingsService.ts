import dbConnect from '@/lib/mongodb';
import SiteSetting, { ISiteSetting } from '@/models/SiteSetting';

// Cached settings to minimize DB calls within a single request lifecycle or short period.
// This is a simple in-memory cache. For more robust caching, consider Next.js data caching
// or a dedicated caching layer if this function is called very frequently across many different serverless invocations.
let cachedSettings: ISiteSetting | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION_MS = 1000 * 60 * 5; // Cache for 5 minutes, for example

// Default settings if nothing is in the DB or if creation fails initially
const defaultSettingsValues: Omit<ISiteSetting, '_id' | 'createdAt' | 'updatedAt' | 'save' | '$isNew' | string> = {
  siteTitle: 'Newspaper CMS',
  siteTagline: 'Your favorite source for news!',
  postsPerPage: 10,
  logoUrl: '/default-logo.png', // Path to a default logo in /public
  faviconUrl: '/favicon.ico', // Path to a default favicon in /public
  defaultOgImage: '/default-og-image.png', // Path to default OG image in /public
};


export async function getSiteSettings(): Promise<Omit<ISiteSetting, '_id' | 'createdAt' | 'updatedAt' | 'save' | '$isNew' | string>> {
  const now = Date.now();
  if (cachedSettings && (now - cacheTimestamp < CACHE_DURATION_MS)) {
    // console.log('Returning cached settings');
    return cachedSettings;
  }

  // console.log('Fetching settings from DB');
  await dbConnect();
  try {
    let settings = await SiteSetting.findOne({}).lean<ISiteSetting>(); // .lean() for plain JS object

    if (!settings) {
      // If no settings document exists, try to create one with defaults.
      // This is a fallback; the API's GET route also does this.
      // Using findOneAndUpdate with upsert might be more atomic if multiple requests hit this simultaneously.
      console.warn('No settings found in DB by getSiteSettings, attempting to use/create defaults.');
      // Avoid saving from here if multiple serverless functions could race.
      // Rely on API to create it, or provide static defaults if DB is truly empty.
      // For now, return static defaults if DB fetch fails or returns null.
      // This prevents site breakage if settings doc is missing.
      // The admin UI should be used to create/populate it properly.

      // Let's try to create it if it doesn't exist, but be mindful of race conditions in serverless.
      // A better approach for first-time setup might be a seeding script or initial admin setup flow.
      try {
          settings = await SiteSetting.findOneAndUpdate(
              {},
              { $setOnInsert: defaultSettingsValues },
              { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
          ).lean<ISiteSetting>();
          if (!settings) { // Should not happen with upsert:true if DB is writable
             console.error("Failed to create default settings even with upsert.");
             cachedSettings = defaultSettingsValues; // Fallback to hardcoded defaults
          } else {
             console.log("Created default settings document via getSiteSettings.");
             cachedSettings = settings;
          }
      } catch (initError) {
          console.error("Error initializing default settings in getSiteSettings:", initError);
          cachedSettings = defaultSettingsValues; // Fallback to hardcoded defaults
      }

    } else {
      cachedSettings = settings;
    }

    cacheTimestamp = Date.now();
    // Ensure all defaultable fields are present if settings were loaded but some fields are missing
    // This can happen if new settings fields are added to the schema later.
    return {
        ...defaultSettingsValues, // Start with defaults
        ...(cachedSettings as ISiteSetting), // Override with DB values
    };

  } catch (error) {
    console.error('Error fetching site settings directly:', error);
    // Fallback to default values if DB query fails, to prevent site crash
    return defaultSettingsValues;
  }
}
