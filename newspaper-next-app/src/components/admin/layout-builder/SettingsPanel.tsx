// src/components/admin/layout-builder/SettingsPanel.tsx
'use client';
import React, {useState, useEffect} from 'react';
interface SettingsPanelProps {
  element: {type: 'row' | 'column' | 'widget', id: string, data: any};
  onClose: () => void;
  onSettingsChange: (elementId: string, newSettings: any) => void;
}
export default function SettingsPanel({ element, onClose, onSettingsChange }: SettingsPanelProps) {
  const [currentSettings, setCurrentSettings] = useState(element.data.settings || {});

  useEffect(() => {
    setCurrentSettings(element.data.settings || {});
  }, [element]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value; // Example for checkbox
    setCurrentSettings((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSettingsChange(element.id, currentSettings);
    // onClose(); // Optionally close panel on save
  };

  return (
    <aside className="w-80 bg-white p-4 rounded-lg shadow-lg flex-shrink-0">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold capitalize">{element.type} Settings</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
      </div>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">Editing: {element.data.name || element.type} (ID: {element.id})</p>
        {/* Example setting: Text for a RichTextWidget */}
        {element.type === 'widget' && element.data.type === 'RichTextWidget' && (
          <div>
            <label htmlFor="setting-text" className="block text-sm font-medium">Text Content (HTML)</label>
            <textarea id="setting-text" name="text" value={currentSettings.text || ''} onChange={handleChange} rows={5}
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-sm"/>
          </div>
        )}
         {/* Example setting: Image URL for an ImageWidget */}
        {element.type === 'widget' && element.data.type === 'ImageWidget' && (
          <>
          <div>
            <label htmlFor="setting-src" className="block text-sm font-medium">Image URL</label>
            <input type="text" id="setting-src" name="src" value={currentSettings.src || ''} onChange={handleChange}
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-sm"/>
          </div>
           <div>
            <label htmlFor="setting-alt" className="block text-sm font-medium">Alt Text</label>
            <input type="text" id="setting-alt" name="alt" value={currentSettings.alt || ''} onChange={handleChange}
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-sm"/>
          </div>
          </>
        )}
        {/* Example setting: Column Width Classes (simplified) */}
        {element.type === 'column' && (
            <div>
                <label htmlFor="setting-widthClasses" className="block text-sm font-medium">Width Classes (e.g. w-1/2, md:w-1/3)</label>
                <input type="text" id="setting-widthClasses" name="widthClasses" value={(currentSettings.widthClasses || []).join(' ')}
                       onChange={(e) => setCurrentSettings(prev => ({...prev, widthClasses: e.target.value.split(' ')}))}
                       className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-sm"/>
            </div>
        )}
        {/* Add more dynamic fields based on element.type and element.data.type */}
        {Object.keys(currentSettings).length === 0 && (!element.data.type || !['RichTextWidget', 'ImageWidget'].includes(element.data.type)) && element.type !== 'column' && (
            <p className="text-xs text-gray-400">No specific settings available for this {element.type}. Generic settings can be added to the model.</p>
        )}
        <button onClick={handleSave} className="px-4 py-2 w-full bg-green-500 text-white rounded hover:bg-green-600">Apply Settings</button>
      </div>
    </aside>
  );
}
