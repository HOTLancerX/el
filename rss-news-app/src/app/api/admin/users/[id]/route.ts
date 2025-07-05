import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User, { IUser } from '@/models/User';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

interface Params {
  id: string;
}

// Get a single user by ID
export async function GET(request: NextRequest, { params }: { params: Params }) {
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, error: 'Invalid User ID' }, { status: 400 });
  }

  try {
    await dbConnect();
    const user = await User.findById(id).select('-password'); // Exclude password

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    console.error(`Error fetching user ${id}:`, error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

// Update a user
export async function PUT(request: NextRequest, { params }: { params: Params }) {
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, error: 'Invalid User ID' }, { status: 400 });
  }

  try {
    await dbConnect();
    const body = await request.json();
    const { name, email, password, isActive } = body;

    const updateData: Partial<IUser> & { password?: string } = {};

    if (name) updateData.name = name;
    if (email) {
      // Check if email is being changed and if it already exists for another user
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return NextResponse.json({ success: false, error: 'Email already in use by another user' }, { status: 409 });
      }
      updateData.email = email;
    }
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    // If password is provided, hash it before saving
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    // Need to fetch the user first if we are conditionally hashing password
    // Or use findByIdAndUpdate and handle password hashing carefully
    // For simplicity with findByIdAndUpdate, we'll update password directly if provided
    // This means the pre-save hook in the model won't run for findByIdAndUpdate on 'password' field directly
    // So, we hash it here.

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password'); // Exclude password from the returned object

    if (!updatedUser) {
      return NextResponse.json({ success: false, error: 'User not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error: any) {
    console.error(`Error updating user ${id}:`, error);
     if (error.name === 'ValidationError') {
        let errors = {};
        Object.keys(error.errors).forEach((key) => {
            // @ts-ignore
            errors[key] = error.errors[key].message;
        });
        return NextResponse.json({ success: false, error: "Validation Error", errors }, { status: 400 });
    }
    if (error.code === 11000) { // Duplicate key error for email
        return NextResponse.json({ success: false, error: 'Email already in use by another user' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: error.message || 'Server error updating user' }, { status: 500 });
  }
}

// Delete a user
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, error: 'Invalid User ID' }, { status: 400 });
  }

  try {
    await dbConnect();
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Consider if there's a super admin that cannot be deleted, etc.
    // For now, any user can be deleted.

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    console.error(`Error deleting user ${id}:`, error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
