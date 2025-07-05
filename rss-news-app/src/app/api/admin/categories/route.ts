import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Category, { ICategory } from '@/models/Category';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { title, images, logo_img } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const newCategory = new Category({ title, images, logo_img });
    await newCategory.save();

    return NextResponse.json({ success: true, data: newCategory }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating category:", error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await dbConnect();
    const categories = await Category.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
