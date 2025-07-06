import mongoose, { Document, Schema, Model } from 'mongoose';

// Define an interface for the User document
export interface IUser extends Document {
  name?: string | null;
  email?: string | null; // From NextAuth, can be null if using credentials without email
  emailVerified?: Date | null;
  image?: string | null; // Avatar URL from NextAuth
  role: 'admin' | 'editor' | 'author' | 'user'; // User roles
  // You might want to link to NextAuth's User ID if you store users separately
  // from NextAuth's internal handling, or if you want to add more fields
  // not directly managed by NextAuth. For now, we assume NextAuth handles
  // the core user identity and we augment it with roles here.
  // nextAuthUserId: { type: String, unique: true, sparse: true }
}

// Define the User schema
const UserSchema: Schema<IUser> = new Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple documents to have a null email, but unique if email is present
  },
  emailVerified: {
    type: Date,
  },
  image: {
    type: String,
  },
  role: {
    type: String,
    enum: ['admin', 'editor', 'author', 'user'],
    default: 'user',
    required: true,
  },
}, { timestamps: true }); // Add createdAt and updatedAt timestamps

// Create and export the User model
// Check if the model already exists before defining it to prevent OverwriteModelError in Next.js hot reloading
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
