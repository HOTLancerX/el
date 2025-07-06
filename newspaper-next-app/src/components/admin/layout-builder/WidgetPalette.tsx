// src/components/admin/layout-builder/WidgetPalette.tsx
'use client';
import React from 'react';
import { Draggable } from './SortableItem'; // Using the basic Draggable for palette items

const availableWidgets = [
  { id: 'palette-richtext', type: 'RichTextWidget', name: 'Rich Text' },
  { id: 'palette-image', type: 'ImageWidget', name: 'Image' },
  { id: 'palette-button', type: 'ButtonWidget', name: 'Button' },
  // Add more predefined widget types here
];
export default function WidgetPalette() {
  return (
    <aside className="w-64 bg-white p-4 rounded-lg shadow-lg flex-shrink-0">
      <h3 className="text-lg font-semibold mb-4">Widgets</h3>
      <div className="space-y-2">
        {availableWidgets.map(widget => (
          <Draggable key={widget.id} id={widget.id} data={{type: 'widget-palette-item', widgetType: widget.type, widgetName: widget.name}}>
            <div className="p-3 border border-gray-300 rounded-md shadow-sm hover:shadow-md cursor-grab bg-gray-50">
              {widget.name}
            </div>
          </Draggable>
        ))}
      </div>
    </aside>
  );
}
