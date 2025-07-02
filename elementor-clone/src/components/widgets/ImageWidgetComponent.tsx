import React from 'react';
import { ImageWidget } from '@/types/page-structure';

interface ImageWidgetComponentProps {
  widget: ImageWidget;
}

const ImageWidgetComponent: React.FC<ImageWidgetComponentProps> = ({ widget }) => {
  const { src, alt, width, height, objectFit } = widget.properties;

  // For Tailwind, width and height could be like 'w-full', 'h-auto', 'w-32', 'h-32'
  // objectFit maps to 'object-cover', 'object-contain', etc.

  const containerClasses = [
    width || 'w-full', // Default to full width if not specified
    height || 'h-auto',   // Default to auto height if not specified
  ].join(' ');

  const imgClasses = [
    'w-full', // Image takes full width of its container
    'h-full', // Image takes full height of its container
    objectFit ? `object-${objectFit}` : 'object-cover', // Default object-fit
  ].filter(Boolean).join(' ');

  if (!src) {
    return (
      <div className="p-1 w-full">
        <div className="bg-gray-200 aspect-video flex items-center justify-center text-gray-500 rounded">
          <span>No Image Selected</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-1 ${containerClasses}`}>
      <img
        src={src}
        alt={alt || 'Image'}
        className={imgClasses}
        // If width/height are direct pixel values, they could go into style
        // style={{
        //   width: width && !width.startsWith('w-') ? width : undefined,
        //   height: height && !height.startsWith('h-') ? height : undefined,
        // }}
      />
    </div>
  );
};

export default ImageWidgetComponent;
