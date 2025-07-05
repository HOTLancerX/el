import mongoose, { Document, Schema, Model } from 'mongoose';
import { ICategory } from './Category';

export interface INews extends Document {
  title: string;
  images?: string[]; // Array of image URLs
  description?: string;
  source_link: string; // Unique URL for the news item
  category: ICategory['_id']; // Reference to Category _id
  pubDate?: Date; // Publication date
  domain?: string; // Domain from which the news was fetched
  isActive: boolean; // Admin control for visibility
  // Potentially add other fields from the old NewsItem interface if needed
  // guid: string;
}

const NewsSchema: Schema<INews> = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  images: [{
    type: String,
    trim: true,
  }],
  description: {
    type: String,
    trim: true,
  },
  source_link: {
    type: String,
    required: true,
    unique: true, // Ensures source_link is unique
    trim: true,
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  pubDate: {
    type: Date,
  },
  domain: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true, // Posts are active by default
  }
}, { timestamps: true });

// Indexing for faster queries, e.g., by category or publication date
NewsSchema.index({ category: 1, pubDate: -1 });
NewsSchema.index({ pubDate: -1 });

const News: Model<INews> = mongoose.models.News || mongoose.model<INews>('News', NewsSchema);

export default News;
