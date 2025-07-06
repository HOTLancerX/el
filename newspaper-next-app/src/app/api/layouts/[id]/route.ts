import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Layout from '@/models/Layout';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET: Fetch a single layout by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  try {
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ message: 'Invalid layout ID format' }, { status: 400 });
    }
    const layout = await Layout.findById(params.id);
    if (!layout) {
      return NextResponse.json({ message: 'Layout not found' }, { status: 404 });
    }
    return NextResponse.json(layout);
  } catch (error: any) {
    console.error(`Error fetching layout ${params.id}:`, error);
    return NextResponse.json({ message: 'Error fetching layout', error: error.message }, { status: 500 });
  }
}

// PUT: Update a layout by ID
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') { // Only admins can update layouts
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  await dbConnect();
  try {
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ message: 'Invalid layout ID format' }, { status: 400 });
    }
    const body = await req.json();
    // Add more validation for the structure if needed
    if (body.name && typeof body.name !== 'string') { // Example basic validation
        return NextResponse.json({ message: 'Layout name must be a string' }, { status: 400 });
    }

    const layout = await Layout.findByIdAndUpdate(params.id, body, { new: true, runValidators: true });
    if (!layout) {
      return NextResponse.json({ message: 'Layout not found' }, { status: 404 });
    }
    return NextResponse.json(layout);
  } catch (error: any) {
    console.error(`Error updating layout ${params.id}:`, error);
    if (error.code === 11000) {
        return NextResponse.json({ message: 'Layout with this name already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Error updating layout', error: error.message }, { status: 500 });
  }
}

// DELETE: Delete a layout by ID
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') { // Only admins can delete layouts
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  await dbConnect();
  try {
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ message: 'Invalid layout ID format' }, { status: 400 });
    }
    // TODO: Consider what happens if this layout is currently in use by Pages or Articles.
    // Add checks or disassociation logic if necessary.
    const layout = await Layout.findByIdAndDelete(params.id);
    if (!layout) {
      return NextResponse.json({ message: 'Layout not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Layout deleted successfully' });
  } catch (error: any) {
    console.error(`Error deleting layout ${params.id}:`, error);
    return NextResponse.json({ message: 'Error deleting layout', error: error.message }, { status: 500 });
  }
}
