// elementor-clone/src/types/page-structure.ts

/**
 * Defines the type of a widget.
 */
export enum WidgetType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  BUTTON = 'BUTTON',
  SPACER = 'SPACER',
  // Add other widget types here
}

/**
 * Base interface for all widgets.
 * Each widget must have a unique ID and a type.
 */
export interface BaseWidget {
  id: string; // Unique identifier for the widget
  type: WidgetType;
  name: string; // User-friendly name for the widget instance
  // properties: Record<string, any>; // Widget-specific properties - replaced by typed props below
}

/**
 * Specific widget interfaces
 */

// Text Widget
export interface TextWidgetProps {
  content: string;
  fontSize: string; // e.g., '16px', '1rem', 'text-lg'
  fontWeight: string; // e.g., 'normal', 'bold', 'font-bold'
  textAlign: 'left' | 'center' | 'right' | 'justify';
  color: string; // e.g., '#000000', 'text-red-500'
}
export interface TextWidget extends BaseWidget {
  type: WidgetType.TEXT;
  properties: TextWidgetProps;
}

// Image Widget
export interface ImageWidgetProps {
  src: string;
  alt: string;
  width?: string; // e.g., '100px', '50%', 'w-full'
  height?: string; // e.g., '100px', 'auto', 'h-auto'
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}
export interface ImageWidget extends BaseWidget {
  type: WidgetType.IMAGE;
  properties: ImageWidgetProps;
}

// Button Widget
export interface ButtonWidgetProps {
  text: string;
  variant: 'solid' | 'outline' | 'ghost' | 'link';
  colorScheme: string; // e.g., 'blue', 'red' (maps to Tailwind colors)
  size: 'xs' | 'sm' | 'md' | 'lg';
  href?: string; // Optional link
  onClickAction?: string; // For potential future actions
}
export interface ButtonWidget extends BaseWidget {
  type: WidgetType.BUTTON;
  properties: ButtonWidgetProps;
}

// Spacer Widget
export interface SpacerWidgetProps {
  height: string; // e.g., '20px', 'h-8'
}
export interface SpacerWidget extends BaseWidget {
  type: WidgetType.SPACER;
  properties: SpacerWidgetProps;
}


/**
 * Union type for all possible widget types.
 * This allows us to have an array of different widget structures.
 */
export type Widget = TextWidget | ImageWidget | ButtonWidget | SpacerWidget;

/**
 * Represents a column within a section.
 * A column contains an array of widgets.
 */
export interface Column {
  id: string; // Unique identifier for the column
  // Defines the span of the column, e.g., in a 12-column grid system.
  // Could also be percentages or Tailwind classes like 'w-1/2', 'w-1/3'
  span: number | string;
  widgets: Widget[];
  // Styling specific to the column itself, e.g., background, padding
  styles?: Record<string, any>; // Example: { backgroundColor: 'bg-blue-100', padding: 'p-4' }
}

/**
 * Represents a section on the page.
 * A section contains an array of columns.
 */
export interface Section {
  id: string; // Unique identifier for the section
  columns: Column[];
  // Styling specific to the section itself, e.g., background, padding, full-width
  styles?: Record<string, any>; // Example: { backgroundColor: 'bg-gray-200', margin: 'my-8' }
}

/**
 * Represents the entire page structure.
 * A page contains an array of sections.
 */
export interface Page {
  id: string; // Unique identifier for the page
  name: string; // Name of the page
  sections: Section[];
  // Global page settings, e.g., background color, default font
  settings?: Record<string, any>;
}
