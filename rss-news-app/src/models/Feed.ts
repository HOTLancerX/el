import mongoose, { Document, Schema, Model } from 'mongoose';
import { ICategory } from './Category';

export interface IFeed extends Document {
  rss_url: string;
  category_id: ICategory['_id']; // Reference to Category _id
  last_fetched_at?: Date; // To track when the feed was last processed
  is_active?: boolean; // To enable/disable a feed
}

const FeedSchema: Schema<IFeed> = new Schema({
  rss_url: {
    type: String,
    required: true,
    trim: true,
    unique: true, // Assuming one entry per RSS URL
  },
  category_id: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  last_fetched_at: {
    type: Date,
  },
  is_active: {
    type: Boolean,
    default: true,
  }
}, { timestamps: true });

FeedSchema.index({ category_id: 1 });
FeedSchema.index({ rss_url: 1 }, { unique: true });


const Feed: Model<IFeed> = mongoose.models.Feed || mongoose.model<IFeed>('Feed', FeedSchema);

export default Feed;
