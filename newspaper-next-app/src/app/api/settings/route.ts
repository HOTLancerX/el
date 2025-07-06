import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SiteSetting, { ISiteSetting } from '@/models/SiteSetting';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET: Fetch site settings
export async function GET(req: NextRequest) {
  // Settings might be needed by non-admins (e.g., frontend rendering using some settings)
  // However, if they are purely for admin display or configuration that's baked into the build,
  // then an admin check could be here too. For now, let's assume some settings might be public.
  // If sensitive settings are added, this needs to be more granular or split.

  await dbConnect();
  try {
    let settings = await SiteSetting.findOne({});
    if (!settings) {
      // If no settings document exists, create one with default values from the schema
      // This ensures that there's always a settings document to work with.
      console.log('No settings found, creating one with defaults.');
      settings = new SiteSetting(); // This will use schema defaults
      await settings.save();
    }
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json({ message: 'Error fetching site settings', error: error.message }, { status: 500 });
  }
}

// PUT: Update site settings
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized: Admins only.' }, { status: 401 });
  }

  await dbConnect();
  try {
    const body = await req.json();

    // Basic validation (more specific validation can be added per field)
    if (typeof body !== 'object' || body === null) {
        return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
    }
    if (body.postsPerPage !== undefined && (typeof body.postsPerPage !== 'number' || body.postsPerPage < 1 || body.postsPerPage > 100)) {
        return NextResponse.json({ message: 'Invalid postsPerPage value (must be 1-100).' }, { status: 400 });
    }
    if (body.siteTitle !== undefined && (typeof body.siteTitle !== 'string' || body.siteTitle.trim() === '')) {
        return NextResponse.json({ message: 'Site Title cannot be empty.' }, { status: 400 });
    }


    // Use findOneAndUpdate with upsert:true to create the document if it doesn't exist,
    // or update it if it does. The query {} will match the single document (if any).
    const updatedSettings = await SiteSetting.findOneAndUpdate(
      {}, // An empty query object will match the first document found or create one if upserting
      { $set: body }, // Use $set to update only provided fields
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json(updatedSettings);
  } catch (error: any) {
    console.error('Error updating site settings:', error);
    // Handle Mongoose validation errors specifically if needed
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((val: any) => val.message);
        return NextResponse.json({ message: 'Validation Error', errors: messages }, { status: 400 });
    }
    return NextResponse.json({ message: 'Error updating site settings', error: error.message }, { status: 500 });
  }
}
