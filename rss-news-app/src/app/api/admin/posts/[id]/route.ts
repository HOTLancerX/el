import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import News, { INews } from '@/models/News';
import Category from '@/models/Category'; // To validate category_id if changed
import mongoose from 'mongoose';

interface Params {
  id: string;
}

// Get a single post by ID (for editing)
export async function GET(request: NextRequest, { params }: { params: Params }) {
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, error: 'Invalid Post ID' }, { status: 400 });
  }

  try {
    await dbConnect();
    const post = await News.findById(id).populate('category', 'title');

    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: post });
  } catch (error: any) {
    console.error(`Error fetching post ${id}:`, error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

// Update a post (admin can edit title, description, category, isActive status, images)
export async function PUT(request: NextRequest, { params }: { params: Params }) {
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, error: 'Invalid Post ID' }, { status: 400 });
  }

  try {
    await dbConnect();
    const body = await request.json();
    const { title, description, category: category_id, isActive, images, source_link, domain, pubDate } = body;

    const updateData: Partial<INews> = {};

    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (images && Array.isArray(images)) updateData.images = images; // Expecting an array of strings
    if (source_link) updateData.source_link = source_link; // Allow editing source link if necessary
    if (domain) updateData.domain = domain;
    if (pubDate) updateData.pubDate = new Date(pubDate);


    if (category_id) {
      if (!mongoose.Types.ObjectId.isValid(category_id)) {
        return NextResponse.json({ success: false, error: 'Invalid Category ID format' }, { status: 400 });
      }
      const categoryExists = await Category.findById(category_id);
      if (!categoryExists) {
        return NextResponse.json({ success: false, error: 'Category not found' }, { status: 400 });
      }
      updateData.category = category_id;
    }

    // Ensure source_link remains unique if it's changed
    if (source_link) {
        const existingPostWithLink = await News.findOne({ source_link: source_link, _id: { $ne: id } });
        if (existingPostWithLink) {
            return NextResponse.json({ success: false, error: 'Another post with this source link already exists.' }, { status: 409 });
        }
    }


    const updatedPost = await News.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('category', 'title');

    if (!updatedPost) {
      return NextResponse.json({ success: false, error: 'Post not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedPost });
  } catch (error: any) {
    console.error(`Error updating post ${id}:`, error);
    if (error.name === 'ValidationError') {
        let errors = {};
        Object.keys(error.errors).forEach((key) => {
            // @ts-ignore
            errors[key] = error.errors[key].message;
        });
        return NextResponse.json({ success: false, error: "Validation Error", errors }, { status: 400 });
    }
     if (error.code === 11000 && error.keyPattern && error.keyPattern.source_link) {
        return NextResponse.json({ success: false, error: 'Another post with this source link already exists.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: error.message || 'Server error updating post' }, { status: 500 });
  }
}

// Delete a post
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, error: 'Invalid Post ID' }, { status: 400 });
  }

  try {
    await dbConnect();
    const deletedPost = await News.findByIdAndDelete(id);

    if (!deletedPost) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Post deleted successfully' });
  } catch (error: any) {
    console.error(`Error deleting post ${id}:`, error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
