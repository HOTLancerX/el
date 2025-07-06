import mongoose, { Document, Schema, Model } from 'mongoose';

// Define an interface for the Site Settings document
export interface ISiteSetting extends Document {
  siteTitle: string;
  siteTagline?: string;
  logoUrl?: string;
  faviconUrl?: string;
  postsPerPage: number;
  defaultOgImage?: string;
  // Timestamps will be added by Mongoose
  createdAt: Date;
  updatedAt: Date;
}

// Define the Site Settings schema
const SiteSettingSchema: Schema<ISiteSetting> = new Schema({
  siteTitle: {
    type: String,
    required: [true, 'Site Title is required.'],
    trim: true,
    default: 'My Awesome Newspaper', // Default value
  },
  siteTagline: {
    type: String,
    trim: true,
  },
  logoUrl: { // URL to the logo image
    type: String,
    trim: true,
  },
  faviconUrl: { // URL to the favicon
    type: String,
    trim: true,
  },
  postsPerPage: {
    type: Number,
    default: 10,
    min: [1, 'Posts per page must be at least 1.'],
    max: [100, 'Posts per page cannot exceed 100.'], // Arbitrary max
  },
  defaultOgImage: { // URL to a default OG image
    type: String,
    trim: true,
  }
}, {
  timestamps: true,
  // Cap the collection at 1 document to ensure only one settings object exists
  // This is a more advanced feature and might be better enforced at application level
  // capped: { size: 1024, max: 1, autoIndexId: true }
  // For simplicity, we'll rely on application logic to fetch/update the single doc.
});

// Ensure there's only one document. This can be done by always using findOneAndUpdate
// with upsert:true, or by having a fixed known ID for the single settings document.
// For this model, we'll assume application logic handles fetching/updating the single document.

const SiteSetting: Model<ISiteSetting> =
  mongoose.models.SiteSetting || mongoose.model<ISiteSetting>('SiteSetting', SiteSettingSchema);

export default SiteSetting;
