import mongoose, { Document, Schema, Model } from 'mongoose';

// Interface for a Widget's configuration
export interface IWidgetConfig {
  id: string; // Unique ID for this widget instance within the layout
  type: string; // e.g., 'RichTextWidget', 'ImageWidget', 'LatestArticlesWidget'
  settings: Record<string, any>; // Widget-specific settings
}

// Interface for a Column
export interface IColumn {
  id: string; // Unique ID for this column within the row
  // e.g., '1/2' for half width, '1/3' for third, 'auto', or specific Tailwind classes like 'w-1/2'
  // This needs to be flexible to allow various grid systems or responsive behaviors.
  // For Tailwind, we might store an array of responsive width classes: e.g., ['w-full', 'md:w-1/2', 'lg:w-1/3']
  widthClasses?: string[];
  widgets: IWidgetConfig[];
}

// Interface for a Row
export interface IRow {
  id: string; // Unique ID for this row within the layout
  columns: IColumn[];
  // Optional: Row-specific settings, like background color, padding, etc.
  settings?: Record<string, any>;
}

// Define an interface for the Layout document
export interface ILayout extends Document {
  name: string; // e.g., 'Homepage Layout', 'Standard Article Layout'
  structure: {
    rows: IRow[];
    // Optional: Global layout settings, like default spacing, max width, etc.
    globalSettings?: Record<string, any>;
  };
  // Potentially add a 'type' field if layouts can be for 'page', 'article_template', 'header', 'footer' etc.
  // layoutType: 'page' | 'template' | 'partial';
}

// Define the Layout schema
const LayoutSchema: Schema<ILayout> = new Schema({
  name: {
    type: String,
    required: [true, 'Layout name is required'],
    trim: true,
    unique: true, // Assuming layout names should be unique
  },
  structure: {
    rows: [{
      _id: false, // Don't create default _id for subdocuments if 'id' is managed manually
      id: { type: String, required: true },
      columns: [{
        _id: false,
        id: { type: String, required: true },
        widthClasses: [{ type: String }], // Array of strings for Tailwind classes
        widgets: [{
          _id: false,
          id: { type: String, required: true },
          type: { type: String, required: true }, // Widget type identifier
          settings: { type: Schema.Types.Mixed, default: {} }, // Free-form settings object
        }],
      }],
      settings: { type: Schema.Types.Mixed, default: {} },
    }],
    globalSettings: { type: Schema.Types.Mixed, default: {} },
  },
  // layoutType: {
  //   type: String,
  //   enum: ['page', 'template', 'partial'],
  //   default: 'page',
  // }
}, { timestamps: true });

LayoutSchema.index({ name: 1 });

const Layout: Model<ILayout> = mongoose.models.Layout || mongoose.model<ILayout>('Layout', LayoutSchema);

export default Layout;
