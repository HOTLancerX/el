import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import News, { INews } from '@/models/News';
import { ICategory } from '@/models/Category'; // For populating

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '30', 10); // Default limit 30 for initial, 10 for subsequent
    const categoryId = searchParams.get('categoryId'); // Optional filter by category

    const skip = (page - 1) * limit;

    let query: any = { isActive: true }; // Only show active news
    if (categoryId) {
      if (mongoose.Types.ObjectId.isValid(categoryId)) {
        query.category = categoryId;
      } else {
        // Handle invalid categoryId, maybe return empty or error
        console.warn("Invalid categoryId received for news fetch:", categoryId);
        // return NextResponse.json({ success: false, error: "Invalid category ID" }, { status: 400 });
      }
    }

    const posts = await News.find(query)
      .populate<{ category: ICategory }>('category', 'title logo_img') // Populate category title and logo
      .sort({ pubDate: -1, createdAt: -1 }) // Sort by publication date, then creation
      .skip(skip)
      .limit(limit)
      .lean(); // Use .lean() for faster queries when not needing Mongoose documents

    const totalPosts = await News.countDocuments(query);

    const hasMore = (page * limit) < totalPosts;

    return NextResponse.json({
      success: true,
      data: posts,
      pagination: {
        currentPage: page,
        limit,
        totalPosts,
        totalPages: Math.ceil(totalPosts / limit),
        hasMore,
      },
    });

  } catch (error: any) {
    console.error("Error fetching news for public:", error);
    return NextResponse.json({ success: false, error: error.message || 'Server error fetching news' }, { status: 500 });
  }
}

// Need to import mongoose for ObjectId.isValid
import mongoose from 'mongoose';
