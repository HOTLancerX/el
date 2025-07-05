import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User, { IUser } from '@/models/User';

// Create a new user
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: 'Name, email, and password are required' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ success: false, error: 'User with this email already exists' }, { status: 409 });
    }

    const newUser = new User({ name, email, password });
    await newUser.save();

    // Avoid sending password back, even if it's hashed in the model instance by default
    const userResponse = newUser.toObject();
    delete userResponse.password;

    return NextResponse.json({ success: true, data: userResponse }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating user:", error);
    if (error.name === 'ValidationError') {
        let errors = {};
        Object.keys(error.errors).forEach((key) => {
            // @ts-ignore
            errors[key] = error.errors[key].message;
        });
        return NextResponse.json({ success: false, error: "Validation Error", errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message || 'Server error creating user' }, { status: 500 });
  }
}

// Get all users
export async function GET() {
  try {
    await dbConnect();
    // Exclude password from the results when fetching all users
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ success: false, error: error.message || 'Server error fetching users' }, { status: 500 });
  }
}
