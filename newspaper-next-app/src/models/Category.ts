import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
}

const CategorySchema: Schema<ICategory> = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    // Add a setter to auto-generate slug from name if not provided or to ensure format
  },
  description: {
    type: String,
    trim: true,
  },
}, { timestamps: true });

// Pre-save hook to generate slug from name if not provided or to ensure it's URL-friendly
CategorySchema.pre<ICategory>('save', function(next) {
  if (!this.slug) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  }
  next();
});

const Category: Model<ICategory> = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);

export default Category;
