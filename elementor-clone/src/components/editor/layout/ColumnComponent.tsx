import React from 'react';
import { Column as ColumnType } from '@/types/page-structure';
// WidgetRenderer is now used by SortableWidgetItem
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableWidgetItem from './SortableWidgetItem';

interface ColumnComponentProps {
  column: ColumnType;
}

const ColumnComponent: React.FC<ColumnComponentProps> = ({ column }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      isColumnDropZone: true, // Identify this as a column droppable
      columnId: column.id,
    },
  });

  const columnBaseClasses = "p-2 relative"; // Added relative for potential absolute positioned overlays
  const columnSpanClass = typeof column.span === 'string' ? column.span : 'flex-1';

  const columnStyle: React.CSSProperties = {};
  if (column.styles) {
    if (column.styles.backgroundColor && !String(column.styles.backgroundColor).startsWith('bg-')) {
        columnStyle.backgroundColor = String(column.styles.backgroundColor);
    }
    // Apply other non-Tailwind styles from column.styles
  }

  // Apply Tailwind classes from styles if they exist
  const dynamicTailwindClasses: string[] = [];
  if (column.styles) {
    Object.values(column.styles).forEach(value => {
      if (typeof value === 'string' && (value.match(/^(bg-|p[xytrbl]?-|m[xytrbl]?-|border-|text-)/) || value.includes(':'))) {
        dynamicTailwindClasses.push(value);
      }
    });
  }

  const combinedClasses = [
    'column-wrapper',
    columnBaseClasses,
    columnSpanClass,
    ...dynamicTailwindClasses,
    isOver ? 'bg-blue-100 outline-blue-300 outline-dashed outline-2 outline-offset-2' : 'bg-transparent', // Visual feedback for drop
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={setNodeRef}
      className={combinedClasses}
      style={columnStyle}
      data-column-id={column.id}
    >
      <SortableContext
        items={column.widgets.map(w => w.id)}
        strategy={verticalListSortingStrategy}
        id={column.id} // Giving context an ID can be useful for complex scenarios
      >
        {column.widgets && column.widgets.length > 0 ? (
          column.widgets.map((widget) => (
            <SortableWidgetItem key={widget.id} widget={widget} columnId={column.id} />
          ))
        ) : (
          <div className={`min-h-[80px] flex items-center justify-center text-sm p-2 rounded
            ${isOver ? 'border-blue-500 border-solid' : 'border-gray-300 border-dashed'} `}>
            <span className={isOver ? 'text-blue-600 font-semibold' : 'text-gray-400'}>
              {column.widgets.length === 0 ? 'Drop Widget Here' : ''}
            </span>
          </div>
        )}
      {/* </SortableContext> */}
      {isOver && column.widgets.length > 0 && ( // Visual cue for dropping into a non-empty column
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-blue-300 opacity-50 pointer-events-none"></div>
      )}
    </div>
  );
};

export default ColumnComponent;
