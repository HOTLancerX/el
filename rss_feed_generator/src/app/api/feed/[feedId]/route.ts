import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { feedId: string } }
) {
  try {
    const feedId = params.feedId;

    if (!feedId) {
      return NextResponse.json({ error: 'Feed ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(); // Use default DB from MONGODB_URI or specify one
    const collection = db.collection('generated_feeds');

    const feedDocument = await collection.findOne({ feedId });

    if (!feedDocument) {
      return NextResponse.json({ error: 'Feed not found' }, { status: 404 });
    }

    // Optionally, update lastAccessedAt or similar analytics here
    // await collection.updateOne({ feedId }, { $set: { lastAccessedAt: new Date() } });

    // Serve the stored RSS XML
    return new NextResponse(feedDocument.rssXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        // Consider adding cache headers for performance
        // 'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    });

  } catch (error: any) {
    console.error(`Error fetching feed ${params.feedId}:`, error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
