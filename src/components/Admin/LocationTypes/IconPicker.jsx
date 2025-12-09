import React, { useState, useMemo } from 'react';
import { ICON_LIBRARY, ICON_CATEGORIES } from '../../../config/iconLibrary';

const IconPicker = ({ isOpen, onClose, onChange }) => {
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  const filteredIcons = useMemo(() => {
    return ICON_LIBRARY.filter(icon => {
      const matchCategory = category === 'all' || icon.category === category;
      const matchSearch = !search || 
        icon.name.toLowerCase().includes(search.toLowerCase()) ||
        icon.id.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [category, search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[70vh] flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">選擇圖示</h2>
          <input
            type="text"
            placeholder="搜尋圖示名稱..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full mt-2 p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="p-2 border-b flex flex-wrap gap-2">
          {ICON_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`px-3 py-1 text-sm rounded-full ${category === cat.id ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="p-4 overflow-y-auto">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
            {filteredIcons.map(icon => (
              <button
                key={icon.id}
                onClick={() => onChange(icon)}
                className="p-2 flex flex-col items-center justify-center rounded-lg hover:bg-gray-100 aspect-square"
                title={icon.name}
              >
                <span className="text-4xl">{icon.emoji}</span>
                <span className="text-xs text-gray-600 mt-1 truncate">{icon.name}</span>
              </button>
            ))}
          </div>
          {filteredIcons.length === 0 && (
            <div className="text-center py-10 text-gray-500">找不到符合的圖示</div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 text-right">
            <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                關閉
            </button>
        </div>
      </div>
    </div>
  );
};

export default IconPicker;
