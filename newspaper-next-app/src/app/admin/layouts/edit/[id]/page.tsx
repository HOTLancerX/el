'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { ILayout, IRow, IColumn, IWidgetConfig } from '@/models/Layout'; // Assuming types are exported
import { nanoid } from 'nanoid'; // For generating unique IDs

// --- Reusable Draggable/Sortable Item Components (Simplified Placeholders) ---
import { SortableItem, Draggable } from '@/components/admin/layout-builder/SortableItem'; // Placeholder path
import RowComponent from '@/components/admin/layout-builder/RowComponent'; // Placeholder path
import WidgetPalette from '@/components/admin/layout-builder/WidgetPalette'; // Placeholder path
import SettingsPanel from '@/components/admin/layout-builder/SettingsPanel'; // Placeholder path


// Helper function to create a new row
const createNewRow = (): IRow => ({
  id: `row-${nanoid()}`,
  columns: [{ id: `col-${nanoid()}`, widthClasses: ['w-full'], widgets: [] }], // Default to one full-width column
  settings: {},
});

// Helper function to create a new widget (example)
const createNewWidget = (type: string): IWidgetConfig => ({
  id: `widget-${nanoid()}`,
  type: type,
  settings: type === 'RichTextWidget' ? { text: '<p>Hello World!</p>' } :
            type === 'ImageWidget' ? { src: '', alt: ''} : {}
});


export default function EditLayoutBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const layoutId = params.id as string;

  const { data: session } = useSession();
  const [layout, setLayout] = useState<ILayout | null>(null);
  const [layoutName, setLayoutName] = useState('');
  const [rows, setRows] = useState<IRow[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [activeId, setActiveId] = useState<string | null>(null); // For drag overlay or context
  const [selectedElement, setSelectedElement] = useState<{type: 'row' | 'column' | 'widget', id: string, data: any} | null>(null);


  useEffect(() => {
    if (layoutId) {
      setIsLoading(true);
      fetch(`/api/layouts/${layoutId}`)
        .then(res => res.ok ? res.json() : Promise.reject(new Error('Failed to fetch layout')))
        .then((data: ILayout) => {
          setLayout(data);
          setLayoutName(data.name);
          setRows(data.structure.rows || []); // Initialize with existing rows or empty
          setIsLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setIsLoading(false);
        });
    } else {
        setError("No layout ID provided.");
        setIsLoading(false);
    }
  }, [layoutId]);

  const handleAddRow = () => {
    setRows(prevRows => [...prevRows, createNewRow()]);
  };

  // This is a simplified handleDragEnd for rows. More complex logic needed for widgets/columns.
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null); // Clear active drag item

    if (over && active.id !== over.id) {
      // Check if we are reordering rows
      if (active.data.current?.type === 'row' && over.data.current?.type === 'row') {
        setRows((currentRows) => {
          const oldIndex = currentRows.findIndex(row => row.id === active.id);
          const newIndex = currentRows.findIndex(row => row.id === over.id);
          if (oldIndex === -1 || newIndex === -1) return currentRows; // Should not happen
          return arrayMove(currentRows, oldIndex, newIndex);
        });
      }
      // TODO: Add logic for dragging widgets into columns, reordering widgets, reordering columns
      // This will involve identifying the type of draggable and droppable, and updating nested structures.
      // For example, if a widget is dropped into a column:
      // 1. Identify source (palette or another column) and target column.
      // 2. If from palette, create new widget instance.
      // 3. Update the target column's widgets array.
      // 4. If reordering, use arrayMove within the column's widgets or between columns.
      console.log("Drag End:", { activeId: active.id, overId: over.id, activeData: active.data.current, overData: over.data.current });
    }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
    // Potentially set data for drag overlay based on event.active.data.current
  }

  const handleSaveLayout = async () => {
    if (!layout) return;
    setIsSaving(true);
    setError(null);
    try {
      const updatedLayoutData = {
        name: layoutName, // Allow editing name if needed, or keep original from `layout.name`
        structure: { ...layout.structure, rows }, // Update rows
      };
      const response = await fetch(`/api/layouts/${layoutId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedLayoutData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save layout');
      }
      // Optionally show a success message
      alert('Layout saved successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Placeholder for updating widget/column/row settings
  const handleSettingsChange = (elementId: string, newSettings: any) => {
    // Find the element (row, column, or widget) by ID and update its settings
    // This requires traversing the `rows` array and its nested structures.
    // Example for a row's settings:
    setRows(prevRows => prevRows.map(row =>
        row.id === elementId ? { ...row, settings: { ...row.settings, ...newSettings } } : row
    ));
    // Similar logic for columns and widgets.
    setSelectedElement(prev => prev ? {...prev, data: {...prev.data, settings: newSettings}} : null);
  };


  if (isLoading) return <div className=\"p-6\"><p>Loading layout builder...</p></div>;
  if (error && !layout) return <div className=\"p-6 text-red-600\"><p>Error: {error}</p></div>;
  if (!layout) return <div className=\"p-6\"><p>Layout not found.</p></div>;

  const canManage = session?.user?.role === 'admin';
  if (session && !canManage) {
    return <div className=\"p-6 text-red-600\"><p>Access Denied: You do not have permission to edit layouts.</p></div>;
  }


  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className=\"min-h-screen bg-gray-100 flex flex-col\">
        {/* Header */}
        <header className=\"bg-white shadow-md p-4 flex justify-between items-center\">
          <div>
            <input
              type=\"text\"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              className=\"text-xl font-semibold text-gray-800 border-b-2 border-transparent focus:border-indigo-500 outline-none\"
              disabled={!canManage}
            />
             <Link href=\"/admin/layouts\" className=\"ml-4 text-sm text-indigo-600 hover:text-indigo-800\">
                &larr; Back to Layouts List
            </Link>
          </div>
          {canManage && (
            <button
              onClick={handleSaveLayout}
              disabled={isSaving}
              className=\"px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50\">
              {isSaving ? 'Saving...' : 'Save Layout'}
            </button>
          )}
        </header>

        {error && <div className=\"p-4 m-4 bg-red-100 text-red-700 rounded-md\"><p>{error}</p></div>}

        {/* Main Builder Area */}
        <div className=\"flex-grow flex p-4 gap-4\">
          {/* Widget Palette (Left Sidebar) */}
          {canManage && <WidgetPalette />}

          {/* Canvas (Center Area) */}
          <main className=\"flex-grow bg-white p-6 rounded-lg shadow-lg overflow-y-auto\">
            <h2 className=\"text-lg font-medium mb-4\">Layout Canvas</h2>
            <SortableContext items={rows.map(row => ({id: row.id, type: 'row'}))} strategy={verticalListSortingStrategy}>
              {rows.map((row, rowIndex) => (
                 <RowComponent
                    key={row.id}
                    row={row}
                    rowIndex={rowIndex}
                    setRows={setRows} // Pass setter to allow RowComponent to modify its own columns/widgets
                    onSelectElement={setSelectedElement}
                    canManage={canManage}
                 />
              ))}
            </SortableContext>
            {canManage && (
                <button onClick={handleAddRow} className=\"mt-6 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600\">
                Add Row
                </button>
            )}
             {!canManage && rows.length === 0 && <p className=\"text-gray-500\">This layout is empty.</p>}
          </main>

          {/* Settings Panel (Right Sidebar) */}
          {selectedElement && canManage && (
            <SettingsPanel
                element={selectedElement}
                onClose={() => setSelectedElement(null)}
                onSettingsChange={handleSettingsChange}
            />
          )}
        </div>

        {/* Drag Overlay - to render a custom preview while dragging */}
        {/* <DragOverlay>
          {activeId ? (
            // Render a component based on activeId or its data type
            // This is a very simplified placeholder
            <div className=\"p-2 bg-indigo-100 border rounded shadow-xl\">Dragging {activeId}</div>
          ) : null}
        </DragOverlay> */}
      </div>
    </DndContext>
  );
}
