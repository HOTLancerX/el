import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import News, { INews } from '@/models/News';

// Get all news posts for admin (paginated, sorted)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const posts = await News.find({})
      .populate('category', 'title') // Populate category title
      .sort({ createdAt: -1 }) // Sort by creation date, or pubDate
      .skip(skip)
      .limit(limit);

    const totalPosts = await News.countDocuments();

    return NextResponse.json({
      success: true,
      data: posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
        limit,
      },
    });
  } catch (error: any) {
    console.error("Error fetching posts for admin:", error);
    return NextResponse.json({ success: false, error: error.message || 'Server error fetching posts' }, { status: 500 });
  }
}
