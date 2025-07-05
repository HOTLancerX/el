import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Password will not be returned in queries by default
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema<IUser> = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/.+\@.+\..+/, 'Please fill a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    select: false, // Do not return password by default
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Pre-save hook to hash password
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err: any) {
    return next(err);
  }
});

// Method to compare password for login
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  const user = await mongoose.models.User.findById(this._id).select('+password').exec();
  if (!user || !user.password) {
      return false;
  }
  return bcrypt.compare(candidatePassword, user.password);
};

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
