import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Feed, { IFeed } from '@/models/Feed';
import Category from '@/models/Category'; // To validate category_id

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { rss_url, category_id } = body;

    if (!rss_url || !category_id) {
      return NextResponse.json({ success: false, error: 'RSS URL and Category ID are required' }, { status: 400 });
    }

    // Validate if category_id exists
    const categoryExists = await Category.findById(category_id);
    if (!categoryExists) {
      return NextResponse.json({ success: false, error: 'Invalid Category ID' }, { status: 400 });
    }

    // Check for duplicate RSS URL
    const existingFeed = await Feed.findOne({ rss_url });
    if (existingFeed) {
      return NextResponse.json({ success: false, error: 'This RSS URL already exists.' }, { status: 409 });
    }

    const newFeed = new Feed({ rss_url, category_id });
    await newFeed.save();

    return NextResponse.json({ success: true, data: newFeed }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating feed:", error);
    if (error.code === 11000) { // Mongoose duplicate key error
        return NextResponse.json({ success: false, error: 'This RSS URL already exists.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await dbConnect();
    // Populate category_id to get category details (e.g., title)
    const feeds = await Feed.find({}).populate('category_id', 'title').sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: feeds });
  } catch (error: any) {
    console.error("Error fetching feeds:", error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
