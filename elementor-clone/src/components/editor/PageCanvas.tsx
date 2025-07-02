import React from 'react';
import { Page } from '@/types/page-structure';
import SectionComponent from './layout/SectionComponent';

interface PageCanvasProps {
  page?: Page;
  // TODO: Callbacks for when elements are dropped or modified
  // onDropWidget: (widgetType: string, targetColumnId: string, position: number) => void;
  // onAddSection: (sectionStructure: any) => void;
}

const PageCanvas: React.FC<PageCanvasProps> = ({ page }) => {
  // This should match the width of ElementorPanel + any gap desired.
  // ElementorPanel is w-72 (288px). Let's assume direct usage.
  const panelWidthClass = "ml-72"; // Tailwind class for margin

  return (
    <main className={`${panelWidthClass} p-4 md:p-8 bg-gray-100 min-h-screen flex-grow`}>
      <div
        className="w-full max-w-full mx-auto bg-white shadow-lg rounded-md p-6" // Added max-w-full and mx-auto for better centering if content is narrower
        // TODO: Add drop zone event handlers (onDragOver, onDrop) for the canvas itself
      >
        {page && page.sections && page.sections.length > 0 ? (
          <div className="page-content-wrapper">
            {/* <p className="text-gray-700 font-semibold mb-2">Page: {page.name}</p> */}
            {page.sections.map(section => (
              <SectionComponent key={section.id} section={section} />
            ))}
            {/* Raw Page Data for debugging can be kept or removed as needed */}
            {/* <div className="mt-8 bg-gray-50 p-4 rounded">
              <h3 className="text-sm text-gray-500 mb-2">Raw Page Data (for debugging):</h3>
              <pre className="text-xs bg-white p-2 rounded mt-2 overflow-auto max-h-96">
                {JSON.stringify(page, null, 2)}
              </pre>
            </div> */}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] border-2 border-dashed border-gray-300 rounded-md p-10">
            {/* Adjusted height for better visibility if canvas is tall */}
            <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 13l-7 7-7-7m14-6l-7-7-7 7" />
            </svg>
            <p className="text-gray-400 text-lg mb-2">Your Page is Empty</p>
            <p className="text-gray-400 text-sm">
              Drag widgets from the left panel or add a new section to begin.
            </p>
          </div>
        )}
      </div>
    </main>
  );
};

export default PageCanvas;
