import React from 'react';
import { useLocationTypes } from '../contexts/LocationTypesContext';

const TypeSelector = ({ onSelectType }) => {
  const { activeTypes, loading: typesLoading } = useLocationTypes();

  if (typesLoading) return (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-8 text-center text-gray-800">步驟 1: 選擇地點類型</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {activeTypes.map(type => (
          <button
            key={type.id}
            onClick={() => onSelectType(type)}
            className="group relative flex flex-col items-center p-6 bg-white border-2 border-gray-100 rounded-xl hover:border-green-500 hover:shadow-lg transition-all duration-200"
          >
            <div className="h-20 w-20 flex items-center justify-center bg-gray-50 rounded-full mb-4 group-hover:bg-green-50 transition-colors">
              <span className="text-5xl">{type.iconEmoji}</span>
            </div>
            <h3 className="font-bold text-lg text-gray-800 group-hover:text-green-700">{type.name}</h3>
            <p className="text-sm text-gray-500 mt-2 text-center line-clamp-2">{type.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TypeSelector;