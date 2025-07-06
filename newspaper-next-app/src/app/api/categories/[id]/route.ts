import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Category, { ICategory } from '@/models/Category';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust path

async function findCategoryByIdOrSlug(idOrSlug: string): Promise<ICategory | null> {
  if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
    return await Category.findById(idOrSlug);
  }
  return await Category.findOne({ slug: idOrSlug });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  try {
    const category = await findCategoryByIdOrSlug(params.id);
    if (!category) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json(category);
  } catch (error: any) {
    console.error(`Error fetching category ${params.id}:`, error);
    return NextResponse.json({ message: 'Error fetching category', error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  // const session = await getServerSession(authOptions);
  // if (!session || session.user?.role !== 'admin') {
  //   return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  // }
  await dbConnect();
  try {
    const body = await req.json();
    // Ensure slug is updated if name changes and slug is not explicitly provided
    if (body.name && !body.slug) {
        body.slug = body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    }
    const category = await Category.findByIdAndUpdate(params.id, body, { new: true, runValidators: true });
    if (!category) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json(category);
  } catch (error: any) {
    console.error(`Error updating category ${params.id}:`, error);
    if (error.code === 11000) {
        return NextResponse.json({ message: 'Category with this name or slug already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Error updating category', error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  // const session = await getServerSession(authOptions);
  // if (!session || session.user?.role !== 'admin') {
  //   return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  // }
  await dbConnect();
  try {
    // TODO: Consider what happens to articles if their category is deleted.
    // Option 1: Disassociate (set category to null).
    // Option 2: Prevent deletion if articles are using this category.
    // Option 3: Delete articles (less common for categories).
    // For now, simple deletion.
    const category = await Category.findByIdAndDelete(params.id);
    if (!category) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    console.error(`Error deleting category ${params.id}:`, error);
    return NextResponse.json({ message: 'Error deleting category', error: error.message }, { status: 500 });
  }
}
