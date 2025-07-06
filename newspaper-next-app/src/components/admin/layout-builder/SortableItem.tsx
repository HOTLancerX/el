// src/components/admin/layout-builder/SortableItem.tsx
'use client';
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function SortableItem(props: { id: string; children: React.ReactNode; className?: string, disabled?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.id, data: { type: 'sortable', parentId: null /* can be set by parent */ }, disabled: props.disabled });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    // touchAction: 'none', // Important for touch devices if not using PointerSensor directly on handles
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={props.className}>
      {props.children}
    </div>
  );
}

// Basic Draggable (not sortable in a list, just draggable)
// Might be useful for items from a palette
export function Draggable(props: { id: string; children: React.ReactNode; className?: string; data?: any }) {
    const { attributes, listeners, setNodeRef, transform } = useSortable({ // Using useSortable for consistency, can be simplified if only drag is needed
        id: props.id,
        data: props.data || { type: 'draggable-item' }
    });
    const style = transform ? { transform: CSS.Translate.toString(transform) } : {};
    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={props.className}>
            {props.children}
        </div>
    );
}
