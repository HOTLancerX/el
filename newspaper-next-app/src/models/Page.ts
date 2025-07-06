import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import { ILayout } from './Layout'; // To link a specific layout
import { IUser } from './User'; // To link author/editor

export interface IPage extends Document {
  title: string;
  slug: string;
  content?: string; // Main content, could be rich text or Markdown. May not be used if layout is complex.
  status: 'draft' | 'published' | 'archived';
  layout?: Types.ObjectId | ILayout | null; // Optional reference to a Layout
  author?: Types.ObjectId | IUser; // User who created/last edited the page
  metaTitle?: string;
  metaDescription?: string;
  publicationDate?: Date;
}

const PageSchema: Schema<IPage> = new Schema({
  title: {
    type: String,
    required: [true, 'Page title is required'],
    trim: true,
  },
  slug: {
    type: String,
    required: [true, 'Page slug is required'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  content: { // This might be used for simple pages or as fallback if no layout
    type: String,
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    required: true,
  },
  layout: {
    type: Schema.Types.ObjectId,
    ref: 'Layout',
    default: null, // Page might not use a custom layout, or use a default site layout
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  metaTitle: {
    type: String,
    trim: true,
  },
  metaDescription: {
    type: String,
    trim: true,
  },
  publicationDate: {
    type: Date,
  },
}, { timestamps: true });

PageSchema.index({ slug: 1 });
PageSchema.index({ status: 1 });

// Pre-save hook to generate slug from title if not provided
PageSchema.pre<IPage>('save', function(next) {
  if (this.isModified('title') && !this.isModified('slug')) {
    this.slug = this.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  }
  // If publishing, set publicationDate if not already set
  if (this.isModified('status') && this.status === 'published' && !this.publicationDate) {
    this.publicationDate = new Date();
  }
  next();
});

const Page: Model<IPage> = mongoose.models.Page || mongoose.model<IPage>('Page', PageSchema);

export default Page;
