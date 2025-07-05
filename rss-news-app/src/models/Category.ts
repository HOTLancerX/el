import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ICategory extends Document {
  title: string;
  images?: string; // URL for the category image
  logo_img?: string; // URL for the category logo
}

const CategorySchema: Schema<ICategory> = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  images: {
    type: String,
    trim: true,
  },
  logo_img: {
    type: String,
    trim: true,
  },
}, { timestamps: true });

// To prevent model recompilation issue in Next.js with HMR
const Category: Model<ICategory> = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);

export default Category;
