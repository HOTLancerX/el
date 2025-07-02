import React from 'react';
import { SpacerWidget } from '@/types/page-structure';

interface SpacerWidgetComponentProps {
  widget: SpacerWidget;
}

const SpacerWidgetComponent: React.FC<SpacerWidgetComponentProps> = ({ widget }) => {
  const { height } = widget.properties;

  // Assuming height is a Tailwind class like 'h-8', 'h-16', or a pixel value like '20px'
  // If it's a pixel value, it should be applied via style prop.
  // If it's a Tailwind class, it's applied via className.

  const isTailwindClass = height && (height.startsWith('h-') || height.startsWith('pt-') || height.startsWith('pb-') || height.startsWith('mt-') || height.startsWith('mb-') || height.startsWith('my-') || height.startsWith('py-'));


  if (isTailwindClass) {
    return <div className={`p-1 w-full ${height}`} />;
  } else {
    // Assuming it's a direct CSS value like '20px'
    return <div className="p-1 w-full" style={{ height: height || '20px' }} />;
  }
};

export default SpacerWidgetComponent;
