import { NextRequest, NextResponse } from 'next/server';
import { processAllActiveFeeds } from '@/lib/rssProcessor';

// This is a simplified protection mechanism.
// In a production environment, consider more robust security like IP whitelisting, HMAC signatures, or OAuth.
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  if (!CRON_SECRET) {
    console.error("CRON_SECRET is not set. Aborting feed processing trigger.");
    return NextResponse.json({ success: false, error: 'CRON_SECRET not configured on server.' }, { status: 500 });
  }

  const providedSecret = request.headers.get('Authorization')?.replace('Bearer ', '');

  if (providedSecret !== CRON_SECRET) {
    console.warn("Unauthorized attempt to trigger feed processing.");
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  console.log("Authorized request received. Starting feed processing...");
  try {
    // Intentionally not awaiting processAllActiveFeeds() if it's a long process,
    // to avoid Vercel serverless function timeout (max 60s on Hobby, longer on Pro/Enterprise).
    // The actual processing will run in the background.
    // If you need to wait for completion and get results, you must ensure the function
    // completes within the timeout or use a different architecture (e.g., background worker service).

    // For now, let's await it for simplicity in testing and to get a summary.
    // If timeouts become an issue, this should be changed.
    const summary = await processAllActiveFeeds();

    console.log("Feed processing triggered successfully via API.");
    return NextResponse.json({ success: true, message: 'Feed processing initiated.', summary });
  } catch (error: any) {
    console.error("Error triggering feed processing via API:", error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to initiate feed processing' }, { status: 500 });
  }
}

// To prevent Vercel from caching this route aggressively
export const dynamic = 'force-dynamic';
