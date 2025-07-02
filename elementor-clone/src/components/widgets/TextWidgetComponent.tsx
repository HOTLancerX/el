import React from 'react';
import { TextWidget } from '@/types/page-structure';

interface TextWidgetComponentProps {
  widget: TextWidget;
}

const TextWidgetComponent: React.FC<TextWidgetComponentProps> = ({ widget }) => {
  const { content, fontSize, fontWeight, textAlign, color } = widget.properties;

  // Basic style object, can be enhanced for Tailwind class generation
  const style: React.CSSProperties = {
    fontSize: fontSize, // Assuming direct CSS values for now, e.g., '16px', '2em'
    fontWeight: fontWeight, // e.g., 'bold', '400'
    textAlign: textAlign,
    color: color, // e.g., '#RRGGBB', 'red'
  };

  // If properties are Tailwind classes, we'd apply them directly in className.
  // For now, this example assumes direct CSS values or that Tailwind utility classes
  // are passed directly in these props (e.g., fontSize: 'text-xl').
  // A more robust solution would parse these or have a mapping.

  // Let's assume for now that Tailwind classes are passed in directly for simplicity
  // e.g., color = "text-blue-500", fontSize = "text-2xl"
  const classNames = [
    fontSize,
    fontWeight,
    `text-${textAlign}`, // textAlign values are 'left', 'center', 'right', 'justify'
    color,
  ].filter(Boolean).join(' ');

  return (
    <div className="p-1"> {/* Basic padding for the widget itself */}
      <p className={classNames} style={color?.startsWith('#') || color?.startsWith('rgb') ? { color } : {}}>
        {content || 'Enter your text here...'}
      </p>
    </div>
  );
};

export default TextWidgetComponent;
