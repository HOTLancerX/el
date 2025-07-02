import React from 'react';
import { WidgetType } from '@/types/page-structure';
import { useDraggable } from '@dnd-kit/core';

// Define a list of available widgets for the panel
// We can extend this with icons, descriptions, etc. later
const availableWidgets = [
  { type: WidgetType.TEXT, name: 'Text', icon: 'T' },
  { type: WidgetType.IMAGE, name: 'Image', icon: 'I' },
  { type: WidgetType.BUTTON, name: 'Button', icon: 'B' },
  { type: WidgetType.SPACER, name: 'Spacer', icon: 'S' },
  // Add more widgets here as they are defined
];

interface DraggablePanelWidgetProps {
  widgetInfo: { type: WidgetType; name: string; icon: string };
}

const DraggablePanelWidget: React.FC<DraggablePanelWidgetProps> = ({ widgetInfo }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `panel-widget-${widgetInfo.type}`, // Unique ID for the draggable item
    data: {
      widgetType: widgetInfo.type,
      isPanelWidget: true, // Custom data to identify this as a widget from the panel
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 100, // Ensure dragged item is above others
    cursor: 'grabbing',
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="p-3 bg-gray-700 rounded hover:bg-gray-600 cursor-grab transition-colors select-none"
    >
      {/* Basic icon placeholder */}
      <div className="w-6 h-6 mb-1 bg-gray-500 flex items-center justify-center rounded text-xs">
        {widgetInfo.icon}
      </div>
      <span className="text-sm">{widgetInfo.name}</span>
    </div>
  );
};

interface ElementorPanelProps {
  addSection: () => void;
}

const ElementorPanel: React.FC<ElementorPanelProps> = ({ addSection }) => {
  return (
    <div className="fixed top-0 left-0 h-screen w-72 bg-gray-800 text-white shadow-lg flex flex-col z-50">
      {/* Panel Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold">Elementor Clone</h2>
      </div>

      {/* Widgets Section */}
      <div className="p-4 flex-grow overflow-y-auto">
        <h3 className="text-lg font-medium mb-3 text-gray-300">Widgets</h3>
        <div className="grid grid-cols-2 gap-2">
          {availableWidgets.map((widget) => (
            <DraggablePanelWidget key={widget.type} widgetInfo={widget} />
          ))}
        </div>

        {/* Structure Elements Section (Placeholder) */}
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3 text-gray-300">Structure</h3>
          <button
            onClick={addSection}
            className="w-full p-3 bg-blue-600 hover:bg-blue-500 rounded text-left transition-colors"
          >
            + Add New Section
          </button>
          {/* Future: Options for different column layouts for new sections */}
        </div>
      </div>

      {/* Panel Footer (Optional) */}
      <div className="p-4 border-t border-gray-700">
        {/* e.g., View Page, Save Draft buttons */}
        <p className="text-xs text-gray-500">Panel Footer</p>
      </div>
    </div>
  );
};

export default ElementorPanel;
