import { create } from 'zustand';
import { Page, Section, Column, Widget, WidgetType, TextWidgetProps, ImageWidgetProps, ButtonWidgetProps, SpacerWidgetProps } from '@/types/page-structure';
import { nanoid } from 'nanoid';
import { arrayMove } from '@dnd-kit/sortable'; // For moveWidget action

// Helper to create a new widget instance (can be expanded)
const createNewWidgetInstance = (type: WidgetType): Widget => {
  const baseWidget = { id: nanoid(), name: `${type.toLowerCase().replace('_', ' ')} widget`, type };
  switch (type) {
    case WidgetType.TEXT:
      return { ...baseWidget, type: WidgetType.TEXT, properties: { content: 'New Text Block', fontSize: 'text-base', fontWeight: 'font-normal', textAlign: 'left', color: 'text-gray-800' } as TextWidgetProps };
    case WidgetType.IMAGE:
      return { ...baseWidget, type: WidgetType.IMAGE, properties: { src: '', alt: 'New Image', width: 'w-full', objectFit: 'cover' } as ImageWidgetProps };
    case WidgetType.BUTTON:
      return { ...baseWidget, type: WidgetType.BUTTON, properties: { text: 'Click Me', variant: 'solid', colorScheme: 'blue', size: 'md' } as ButtonWidgetProps };
    case WidgetType.SPACER:
      return { ...baseWidget, type: WidgetType.SPACER, properties: { height: 'h-8' } as SpacerWidgetProps };
    default:
      // This case should ideally not be reached if types are handled correctly
      console.error(`Unknown widget type requested for creation: ${type}`);
      // Fallback to a simple text widget or throw error
      return { ...baseWidget, id: nanoid(), type: WidgetType.TEXT, name: 'Error Widget', properties: { content: `Error: Unknown widget type ${type}`, fontSize: 'text-base', fontWeight: 'font-normal', textAlign: 'left', color: 'text-red-500' } as TextWidgetProps};
  }
};

interface PageState {
  page: Page;
  setPage: (page: Page) => void;
  setPageName: (name: string) => void;
  addSection: () => void;
  // deleteSection: (sectionId: string) => void;
  // addColumn: (sectionId: string, /* columnStructure: any */) => void;
  // deleteColumn: (sectionId: string, columnId: string) => void;
  addWidgetToColumn: (columnId: string, widgetType: WidgetType, index?: number) => void;
  // updateWidgetProperties: <T extends WidgetType>(widgetId: string, newProperties: Partial<WidgetPropsMap[T]>) => void;
  // deleteWidget: (columnId: string, widgetId: string) => void;
  moveWidget: (args: {
    sourceColumnId: string;
    sourceWidgetId: string;
    targetColumnId: string;
    targetIndex: number; // Index in the target column's widget list
  }) => void;
}

const initialPageData: Page = {
  id: nanoid(),
  name: 'Untitled Page',
  sections: [],
  settings: { backgroundColor: 'bg-white' },
};

export const usePageStore = create<PageState>((set, get) => ({
  page: initialPageData,
  setPage: (newPage) => set({ page: newPage }),
  setPageName: (name) => set(state => ({ page: { ...state.page, name } })),

  addSection: () => set(state => {
    const newSection: Section = {
      id: nanoid(),
      columns: [{ id: nanoid(), span: 'w-full', widgets: [], styles: {} }], // Default to one full-width column
      styles: {},
    };
    return { page: { ...state.page, sections: [...state.page.sections, newSection] } };
  }),

  addWidgetToColumn: (columnId, widgetType, index) => set(state => {
    const newWidget = createNewWidgetInstance(widgetType);
    const newSections = state.page.sections.map(section => ({
      ...section,
      columns: section.columns.map(col => {
        if (col.id === columnId) {
          const updatedWidgets = [...col.widgets];
          if (index !== undefined && index !== null && index >= 0 && index <= updatedWidgets.length) {
            updatedWidgets.splice(index, 0, newWidget);
          } else {
            updatedWidgets.push(newWidget);
          }
          return { ...col, widgets: updatedWidgets };
        }
        return col;
      }),
    }));
    return { page: { ...state.page, sections: newSections } };
  }),

  moveWidget: ({ sourceColumnId, sourceWidgetId, targetColumnId, targetIndex }) => set(state => {
    let widgetToMove: Widget | undefined;
    let originalSourceWidgets: Widget[] = [];

    // Find and remove widget from source column
    const sectionsAfterRemoval = state.page.sections.map(s => ({
      ...s,
      columns: s.columns.map(c => {
        if (c.id === sourceColumnId) {
          widgetToMove = c.widgets.find(w => w.id === sourceWidgetId);
          originalSourceWidgets = [...c.widgets]; // Keep a copy for arrayMove if same column
          return { ...c, widgets: c.widgets.filter(w => w.id !== sourceWidgetId) };
        }
        return c;
      }),
    }));

    if (!widgetToMove) {
      console.error("Widget to move not found!");
      return state; // Or handle error appropriately
    }

    // Add widget to target column
    const sectionsAfterInsertion = sectionsAfterRemoval.map(s => ({
      ...s,
      columns: s.columns.map(c => {
        if (c.id === targetColumnId) {
          if (sourceColumnId === targetColumnId) {
            // Reordering within the same column
            const oldIndex = originalSourceWidgets.findIndex(w => w.id === sourceWidgetId);
            // targetIndex here is the index of the item it's dropped on/near in the original list
            return { ...c, widgets: arrayMove(originalSourceWidgets, oldIndex, targetIndex) };
          } else {
            // Moving to a different column
            const newTargetWidgets = [...c.widgets];
            newTargetWidgets.splice(targetIndex, 0, widgetToMove!);
            return { ...c, widgets: newTargetWidgets };
          }
        }
        return c;
      }),
    }));
    return { page: { ...state.page, sections: sectionsAfterInsertion } };
  }),

  // TODO: Implement other actions like deleteSection, updateWidgetProperties etc.
}));

// Optional: Persist store to localStorage (example)
// import { persist, createJSONStorage } from 'zustand/middleware'
// export const usePageStore = create(
//   persist<PageState>(
//     (set, get) => ({
//       // ... store definition
//     }),
//     {
//       name: 'elementor-clone-page-storage', // name of item in the storage (must be unique)
//       storage: createJSONStorage(() => localStorage), // (optional) by default the 'localStorage' is used
//     }
//   )
// )
