import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Feed from '@/models/Feed';
import Category from '@/models/Category'; // To validate category_id
import mongoose from 'mongoose';

interface Params {
  id: string;
}

export async function GET(request: NextRequest, { params }: { params: Params }) {
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, error: 'Invalid Feed ID' }, { status: 400 });
  }

  try {
    await dbConnect();
    const feed = await Feed.findById(id).populate('category_id', 'title');

    if (!feed) {
      return NextResponse.json({ success: false, error: 'Feed not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: feed });
  } catch (error: any) {
    console.error(`Error fetching feed ${id}:`, error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, error: 'Invalid Feed ID' }, { status: 400 });
  }

  try {
    await dbConnect();
    const body = await request.json();
    const { rss_url, category_id, is_active } = body;

    if (!rss_url || !category_id) {
      return NextResponse.json({ success: false, error: 'RSS URL and Category ID are required' }, { status: 400 });
    }

    // Validate if category_id exists
    const categoryExists = await Category.findById(category_id);
    if (!categoryExists) {
      return NextResponse.json({ success: false, error: 'Invalid Category ID' }, { status: 400 });
    }

    // Check for duplicate RSS URL if it's being changed
    const existingFeed = await Feed.findOne({ rss_url, _id: { $ne: id } });
    if (existingFeed) {
        return NextResponse.json({ success: false, error: 'This RSS URL already exists for another feed.' }, { status: 409 });
    }

    const updateData: any = { rss_url, category_id };
    if (typeof is_active === 'boolean') {
        updateData.is_active = is_active;
    }


    const updatedFeed = await Feed.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category_id', 'title');

    if (!updatedFeed) {
      return NextResponse.json({ success: false, error: 'Feed not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedFeed });
  } catch (error: any) {
    console.error(`Error updating feed ${id}:`, error);
     if (error.code === 11000) {
        return NextResponse.json({ success: false, error: 'This RSS URL already exists.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, error: 'Invalid Feed ID' }, { status: 400 });
  }

  try {
    await dbConnect();
    const deletedFeed = await Feed.findByIdAndDelete(id);

    if (!deletedFeed) {
      return NextResponse.json({ success: false, error: 'Feed not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Feed deleted successfully' });
  } catch (error: any) {
    console.error(`Error deleting feed ${id}:`, error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
