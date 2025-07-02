import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Widget } from '@/types/page-structure';
import WidgetRenderer from '@/components/widgets/WidgetRenderer';

interface SortableWidgetItemProps {
  widget: Widget;
  columnId: string; // For context, if needed in data or for interactions
}

const SortableWidgetItem: React.FC<SortableWidgetItemProps> = ({ widget, columnId }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging, // Useful for styling the dragged item
  } = useSortable({
    id: widget.id,
    data: {
      widgetId: widget.id,
      widgetType: widget.type,
      fromColumnId: columnId,
      isSortableWidget: true, // Identify this as a sortable page widget
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto', // Ensure dragged item is above others
    cursor: isDragging ? 'grabbing' : 'grab',
    // Add some default styling for the widget item wrapper
    // margin: '4px 0',
    // padding: '8px',
    // backgroundColor: 'white',
    // border: '1px solid #eee',
    // borderRadius: '4px',
    // boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.1)',
  };

  return (
    <div ref={setNodeRef} style={style} className="widget-item-wrapper bg-white rounded shadow-sm my-1 relative group">
      {/* Drag Handle (optional, can make the whole item draggable via listeners) */}
      <button
        {...attributes}
        {...listeners}
        className="drag-handle absolute top-1 right-1 p-1 bg-gray-200 hover:bg-gray-300 rounded opacity-20 group-hover:opacity-100 transition-opacity z-10 cursor-grab"
        aria-label="Drag widget"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
          <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
        </svg>
      </button>
      <WidgetRenderer widget={widget} />
    </div>
  );
};

export default SortableWidgetItem;
