import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Category from '@/models/Category';
import mongoose from 'mongoose';

interface Params {
  id: string;
}

export async function GET(request: NextRequest, { params }: { params: Params }) {
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, error: 'Invalid Category ID' }, { status: 400 });
  }

  try {
    await dbConnect();
    const category = await Category.findById(id);

    if (!category) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: category });
  } catch (error: any) {
    console.error(`Error fetching category ${id}:`, error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, error: 'Invalid Category ID' }, { status: 400 });
  }

  try {
    await dbConnect();
    const body = await request.json();
    const { title, images, logo_img } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { title, images, logo_img },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedCategory });
  } catch (error: any) {
    console.error(`Error updating category ${id}:`, error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, error: 'Invalid Category ID' }, { status: 400 });
  }

  try {
    await dbConnect();
    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }

    // Optionally, you might want to handle related News items (e.g., unassign category or delete them)
    // For now, we'll just delete the category.

    return NextResponse.json({ success: true, message: 'Category deleted successfully' });
  } catch (error: any) {
    console.error(`Error deleting category ${id}:`, error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
