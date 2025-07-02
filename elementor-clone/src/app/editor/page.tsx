"use client"; // Required for event handlers, state, and effects

import React, { useState } from 'react'; // useState for activeId, page state from Zustand
import ElementorPanel from '@/components/editor/ElementorPanel';
import PageCanvas from '@/components/editor/PageCanvas';
import { WidgetType } from '@/types/page-structure'; // Page, Section, Column, Widget are implicitly used via store
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
// arrayMove is now used within the store
// nanoid is now used within the store

import { usePageStore } from '@/store/pageStore';


const LOCAL_STORAGE_KEY = 'elementorClonePageData';

export default function EditorPage() {
  const page = usePageStore(state => state.page);
  const setPage = usePageStore(state => state.setPage); // For loading
  const storeAddSection = usePageStore(state => state.addSection);
  const addWidgetToColumn = usePageStore(state => state.addWidgetToColumn);
  const moveWidget = usePageStore(state => state.moveWidget);
  // const setPageName = usePageStore(state => state.setPageName); // Example for later

  const [activeId, setActiveId] = useState<string | null>(null); // For dnd-kit's active item visual state

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    // console.log('Drag Start:', event.active);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // console.log('Drag Over:', event.over?.id);
    // Potentially useful for visual feedback, like highlighting drop zones
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    // console.log('Drag End:', active, over);

    if (!over) return; // Dropped outside a valid droppable

    const activeId = active.id as string;
    const overId = over.id as string;

    // Scenario 1: Dragging a new widget from the panel into a column
    if (active.data.current?.isPanelWidget && over.data.current?.isColumnDropZone) {
      const widgetType = active.data.current.widgetType as WidgetType;
      const targetColumnId = overId;
      // Add new widget to the end of the column for now
      // TODO: Calculate insertion index if dropping onto an existing widget or specific part of column
      addWidgetToColumn(targetColumnId, widgetType);
      return;
    }

    // Scenario 2: Reordering widgets within the same column
    // Scenario 3: Moving widgets between columns
    // Scenario 4: Reordering columns within a section
    // Scenario 5: Moving columns between sections (more complex)
    // Scenario 6: Reordering sections on the page

    // For sortable widgets
    const activeIsSortableWidget = active.data.current?.isSortableWidget;

    if (activeIsSortableWidget) {
      const sourceWidgetId = active.id as string;
      const sourceColumnId = active.data.current?.fromColumnId as string;

      let targetColumnId: string | null = null;
      let targetIndex: number = 0; // Default to 0, will be calculated

      if (over.data.current?.isSortableWidget) { // Dropped onto another widget
        targetColumnId = over.data.current?.fromColumnId as string;
        const overWidgetId = over.id as string;
        // Find index of overWidgetId in its column
        const targetCol = page.sections.flatMap(s => s.columns).find(c => c.id === targetColumnId);
        if (targetCol) {
          targetIndex = targetCol.widgets.findIndex(w => w.id === overWidgetId);
          if (targetIndex === -1) targetIndex = targetCol.widgets.length; // Fallback if not found (should not happen)
        } else {
          targetIndex = 0; // Fallback
        }

      } else if (over.data.current?.isColumnDropZone) { // Dropped directly onto a column
        targetColumnId = over.id as string;
        const targetCol = page.sections.flatMap(s => s.columns).find(c => c.id === targetColumnId);
        targetIndex = targetCol ? targetCol.widgets.length : 0; // Drop at the end of the target column
      }

      if (!targetColumnId) {
        console.warn("Could not determine target column for sortable widget.");
        return;
      }

      // If dropping onto itself in the same column, targetIndex might need adjustment or dnd-kit might handle it.
      // For arrayMove, the targetIndex is the desired final position.
      // If active.id === over.id, it means it's dropped on itself.
      // The store's moveWidget should handle this logic correctly.
      if (active.id === over.id && sourceColumnId === targetColumnId) {
        // No actual move if dropped on itself in the same spot
        return;
      }

      moveWidget({
        sourceColumnId,
        sourceWidgetId,
        targetColumnId,
        targetIndex,
      });
    }

    // TODO: Implement other scenarios like column/section reordering
  };


  const handleSavePage = () => {
    try {
      const pageJson = JSON.stringify(page);
      localStorage.setItem(LOCAL_STORAGE_KEY, pageJson);
      alert('Page saved to LocalStorage!');
      console.log('Page saved:', page);
    } catch (error) {
      console.error("Error saving page to LocalStorage:", error);
      alert('Error saving page. See console for details.');
    }
  };

  const handleLoadPage = () => {
    try {
      const savedPageJson = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedPageJson) {
        const loadedPage = JSON.parse(savedPageJson);
        // TODO: Add validation here to ensure loadedPage conforms to Page interface
        setPage(loadedPage);
        alert('Page loaded from LocalStorage!');
        console.log('Page loaded:', loadedPage);
      } else {
        alert('No saved page found in LocalStorage.');
      }
    } catch (error) {
      console.error("Error loading page from LocalStorage:", error);
      alert('Error loading page. See console for details.');
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen">
      {/* Save/Load Controls */}
      <div className="p-2 bg-gray-700 text-white flex items-center gap-2 justify-end">
        <button
          onClick={handleSavePage}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
        >
          Save to LocalStorage
        </button>
        <button
          onClick={handleLoadPage}
          className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
        >
          Load from LocalStorage
        </button>
      </div>

      {/* Editor DndContext and Layout */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      // collisionDetection={closestCenter} // or closestCorners, rectangleIntersection
    >
        <div className="flex flex-grow overflow-hidden"> {/* flex-grow allows this to take remaining space */}
        <ElementorPanel addSection={storeAddSection} />
        <PageCanvas page={page} /* TODO: pass callbacks for modifications if needed directly by canvas */ />
      </div>
      {/* For SortableContext, it's often better to place it closer to the items being sorted.
          e.g., inside PageCanvas for sections, SectionComponent for columns, ColumnComponent for widgets.
          This top-level context is for general drag/drop operations.
      */}
    </DndContext>
  );
}
