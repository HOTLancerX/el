import React from 'react';
import { Section as SectionType } from '@/types/page-structure';
import ColumnComponent from './ColumnComponent';

interface SectionComponentProps {
  section: SectionType;
}

const SectionComponent: React.FC<SectionComponentProps> = ({ section }) => {
  // Basic styling for sections. More complex styles (e.g., background images) would need more handling.
  // Example: section.styles = { backgroundColor: 'bg-gray-100', padding: 'py-8' }
  const sectionClasses = [
    'section-wrapper',
    'flex flex-wrap', // Using flexbox for column layout
    'my-4 p-2 border border-dashed border-transparent hover:border-blue-300 relative', // Basic styling and hover effect for editor
    // section.styles?.padding || 'py-4',
    // section.styles?.backgroundColor,
  ].filter(Boolean).join(' ');

  const sectionStyle: React.CSSProperties = {};
  if (section.styles) {
    if (section.styles.backgroundColor && !String(section.styles.backgroundColor).startsWith('bg-')) {
        sectionStyle.backgroundColor = String(section.styles.backgroundColor);
    }
    if (section.styles.padding && !String(section.styles.padding).match(/p[xytrbl]?-/)) {
        sectionStyle.padding = String(section.styles.padding);
    }
     if (section.styles.margin && !String(section.styles.margin).match(/m[xytrbl]?-/)) {
        sectionStyle.margin = String(section.styles.margin);
    }
    // Add other style mappings as needed
  }

  // Apply Tailwind classes from styles if they exist
  const dynamicTailwindClasses: string[] = [];
  if (section.styles) {
    Object.values(section.styles).forEach(value => {
      if (typeof value === 'string' && (value.match(/^(bg-|p[xytrbl]?-|m[xytrbl]?-|border-|text-|w-|h-)/) || value.includes(':'))) {
        dynamicTailwindClasses.push(value);
      }
    });
  }

  return (
    <div
      className={`${sectionClasses} ${dynamicTailwindClasses.join(' ')}`}
      style={sectionStyle}
      data-section-id={section.id}
      // TODO: Add section-level controls (e.g., drag handle, settings button)
    >
      {/* Section Toolbar (Example - invisible by default, shown on hover/selection) */}
      {/* <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full p-1 bg-blue-500 text-white text-xs rounded-t opacity-0 group-hover:opacity-100 transition-opacity">
        Section Controls
      </div> */}

      {section.columns && section.columns.length > 0 ? (
        section.columns.map((column, index) => (
          <ColumnComponent key={column.id || index} column={column} />
        ))
      ) : (
        <div className="w-full min-h-[80px] border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-sm p-4">
          Empty Section (Add Columns/Widgets Here)
          {/* TODO: Placeholder for adding columns directly */}
        </div>
      )}
    </div>
  );
};

export default SectionComponent;
