// src/components/admin/layout-builder/RowComponent.tsx
'use client';
import React from 'react';
import { IRow, IColumn, IWidgetConfig } from '@/models/Layout'; // Types
import { SortableItem } from './SortableItem';
// import ColumnComponent from './ColumnComponent'; // Will be created

interface RowComponentProps {
  row: IRow;
  rowIndex: number;
  setRows: React.Dispatch<React.SetStateAction<IRow[]>>;
  onSelectElement: (selection: {type: 'row' | 'column' | 'widget', id: string, data: any}) => void;
  canManage: boolean;
}
export default function RowComponent({ row, rowIndex, setRows, onSelectElement, canManage }: RowComponentProps) {
  // TODO: Implement column rendering, adding columns, dnd for columns/widgets within this row
  const handleAddColumn = () => {
    // Simplified: adds a new full-width column
    const newColumn: IColumn = { id: `col-${Date.now()}`, widthClasses: ['w-full'], widgets: [] };
    setRows(prev => prev.map(r => r.id === row.id ? { ...r, columns: [...r.columns, newColumn] } : r));
  };
  return (
    <SortableItem id={row.id} className="p-4 mb-4 bg-gray-50 border border-gray-300 rounded-md shadow hover:shadow-lg" disabled={!canManage}>
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold">Row {rowIndex + 1} (ID: {row.id})</h4>
        {canManage && <button onClick={() => onSelectElement({type: 'row', id: row.id, data: row})} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Settings</button>}
      </div>
      <div className="flex gap-4 p-2 border-t border-gray-200 min-h-[100px] bg-white">
        {row.columns.map((col, colIndex) => (
          <div key={col.id} className={`p-2 border border-dashed border-gray-400 ${col.widthClasses?.join(' ') || 'w-full'}`}>
            <p className="text-xs text-gray-500">Col {colIndex+1} (ID: {col.id})</p>
            {/* Placeholder for ColumnComponent and widgets */}
            {col.widgets.map(widget => <div key={widget.id} className='p-1 my-1 bg-green-50 border border-green-200 rounded text-xs'>{widget.type} (ID: {widget.id})</div>)}
            {canManage && <button className='text-xs mt-1 p-1 bg-green-100 hover:bg-green-200 rounded' onClick={() => alert('Add widget to this column - TBD')}>+ Widget</button>}
          </div>
        ))}
         {row.columns.length === 0 && <p className='text-sm text-gray-400'>This row is empty. Add columns.</p>}
      </div>
      {canManage && <button onClick={handleAddColumn} className="text-xs mt-2 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">+ Add Column</button>}
    </SortableItem>
  );
}
