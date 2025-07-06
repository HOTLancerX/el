import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import { IUser } from './User'; // Assuming User model might be referenced for author
import { ICategory } from './Category';
import { ITag } from './Tag';
import { IMedia } from './Media'; // For featuredImage, when Media model is created
import { ILayout } from './Layout';

export type ArticleStatus = 'draft' | 'pending_review' | 'published' | 'archived';

export interface IArticle extends Document {
  title: string;
  slug: string;
  content: string; // Rich text content, could be HTML or Markdown
  excerpt?: string;
  author: Types.ObjectId | IUser; // Reference to User model
  status: ArticleStatus;
  publicationDate?: Date; // Date when the article is published
  featuredImage?: Types.ObjectId | IMedia; // Reference to Media model
  category?: Types.ObjectId | ICategory | null; // Optional: An article might not have a category
  tags: (Types.ObjectId | ITag)[]; // Array of references to Tag model
  metaTitle?: string;
  metaDescription?: string;
  views: number; // To track article views
  allowComments: boolean;
  layout?: Types.ObjectId | ILayout | null; // Optional: reference to a specific Layout schema for this article
}

const ArticleSchema: Schema<IArticle> = new Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    unique: true,
    trim: true,
    lowercase: true,
    // Consider a pre-save hook to generate slug from title if not provided
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
  },
  excerpt: {
    type: String,
    trim: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Referencing the User model
    required: [true, 'Author is required'],
  },
  status: {
    type: String,
    enum: ['draft', 'pending_review', 'published', 'archived'],
    default: 'draft',
    required: true,
  },
  publicationDate: {
    type: Date,
  },
  featuredImage: {
    type: Schema.Types.ObjectId,
    ref: 'Media',
    // type: String, // Placeholder: Using string for URL for now
    // trim: true, // Not needed for ObjectId ref
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },
  tags: [{
    type: Schema.Types.ObjectId,
    ref: 'Tag',
  }],
  metaTitle: {
    type: String,
    trim: true,
  },
  metaDescription: {
    type: String,
    trim: true,
  },
  views: {
    type: Number,
    default: 0,
  },
  allowComments: {
    type: Boolean,
    default: true,
  },
  layout: {
    type: Schema.Types.ObjectId,
    ref: 'Layout',
    default: null,
  },
}, { timestamps: true });

// Indexing for frequently queried fields
ArticleSchema.index({ slug: 1 });
ArticleSchema.index({ status: 1, publicationDate: -1 });
ArticleSchema.index({ author: 1 });
ArticleSchema.index({ category: 1 });
ArticleSchema.index({ tags: 1 });

// Pre-save hook to generate slug from title if not provided
ArticleSchema.pre<IArticle>('save', function(next) {
  if (this.isModified('title') && !this.isModified('slug')) { // only generate if title changed and slug wasn't manually set
    this.slug = this.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  }
  // If publishing, set publicationDate if not already set
  if (this.isModified('status') && this.status === 'published' && !this.publicationDate) {
    this.publicationDate = new Date();
  }
  next();
});

const Article: Model<IArticle> = mongoose.models.Article || mongoose.model<IArticle>('Article', ArticleSchema);

export default Article;
