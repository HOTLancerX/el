import React from 'react';
import { Widget, WidgetType } from '@/types/page-structure';

import TextWidgetComponent from './TextWidgetComponent';
import ImageWidgetComponent from './ImageWidgetComponent';
import ButtonWidgetComponent from './ButtonWidgetComponent';
import SpacerWidgetComponent from './SpacerWidgetComponent';

interface WidgetRendererProps {
  widget: Widget;
}

const WidgetRenderer: React.FC<WidgetRendererProps> = ({ widget }) => {
  if (!widget) {
    return <div className="text-red-500">Error: Widget data is missing.</div>;
  }

  switch (widget.type) {
    case WidgetType.TEXT:
      // Type assertion is safe here due to the switch case
      return <TextWidgetComponent widget={widget} />;
    case WidgetType.IMAGE:
      return <ImageWidgetComponent widget={widget} />;
    case WidgetType.BUTTON:
      return <ButtonWidgetComponent widget={widget} />;
    case WidgetType.SPACER:
      return <SpacerWidgetComponent widget={widget} />;
    // Add cases for other widget types here
    default:
      // Optionally render a placeholder or log an error for unknown widget types
      return (
        <div className="p-2 bg-yellow-100 border border-yellow-300 rounded">
          <p className="text-sm text-yellow-700">
            Unsupported widget type: <span className="font-semibold">{widget.type}</span>
          </p>
          <pre className="text-xs mt-1">{JSON.stringify(widget, null, 2)}</pre>
        </div>
      );
  }
};

export default WidgetRenderer;
