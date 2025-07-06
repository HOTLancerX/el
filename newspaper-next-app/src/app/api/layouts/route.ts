import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Layout from '@/models/Layout';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// POST: Create a new layout
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') { // Only admins can create layouts
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  try {
    const body = await req.json();
    if (!body.name || !body.structure) {
      return NextResponse.json({ message: 'Layout name and structure are required' }, { status: 400 });
    }
    // Add more validation for the structure if needed (e.g., using Zod or Joi)

    const layout = new Layout(body);
    await layout.save();
    return NextResponse.json(layout, { status: 201 });
  } catch (error: any) {
    console.error('Error creating layout:', error);
    if (error.code === 11000) { // Duplicate key error (likely for layout name)
        return NextResponse.json({ message: 'Layout with this name already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Error creating layout', error: error.message }, { status: 500 });
  }
}

// GET: Fetch all layouts
export async function GET() {
  // No specific role check for GET all, could be used by frontend rendering logic too.
  // Or, add role check if layouts are purely admin-managed entities.
  // For now, allowing general access.
  await dbConnect();
  try {
    const layouts = await Layout.find({}).sort({ name: 1 });
    return NextResponse.json(layouts);
  } catch (error: any) {
    console.error('Error fetching layouts:', error);
    return NextResponse.json({ message: 'Error fetching layouts', error: error.message }, { status: 500 });
  }
}
