import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import { IUser } from './User'; // To link uploader

export type MediaType = 'image' | 'video' | 'audio' | 'document' | 'other';

export interface IMedia extends Document {
  url: string; // URL of the media file (could be local or from a cloud storage)
  altText?: string; // Alt text for images, for accessibility
  caption?: string;
  fileName: string;
  fileType: string; // MIME type e.g., image/jpeg, video/mp4
  mediaType: MediaType; // Broader categorization
  size?: number; // File size in bytes
  uploadedBy?: Types.ObjectId | IUser;
  dimensions?: { // For images/videos
    width: number;
    height: number;
  };
}

const MediaSchema: Schema<IMedia> = new Schema({
  url: {
    type: String,
    required: [true, 'Media URL is required'],
    trim: true,
  },
  altText: {
    type: String,
    trim: true,
  },
  caption: {
    type: String,
    trim: true,
  },
  fileName: {
    type: String,
    required: [true, 'File name is required'],
    trim: true,
  },
  fileType: { // e.g., image/png, video/mp4
    type: String,
    required: [true, 'File type is required'],
    trim: true,
  },
  mediaType: {
    type: String,
    enum: ['image', 'video', 'audio', 'document', 'other'],
    default: 'other',
  },
  size: { // in bytes
    type: Number,
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  dimensions: {
    width: { type: Number },
    height: { type: Number },
  },
}, { timestamps: true });

MediaSchema.index({ uploadedBy: 1 });
MediaSchema.index({ mediaType: 1 });

const Media: Model<IMedia> = mongoose.models.Media || mongoose.model<IMedia>('Media', MediaSchema);

export default Media;
