import React from 'react';
import { useLocationTypes } from '../contexts/LocationTypesContext';

const TypeSelector = ({ onSelectType }) => {
  const { activeTypes, loading: typesLoading, error } = useLocationTypes();

  if (typesLoading) return (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
    </div>
  );

  if (error) return (
    <div className="max-w-2xl mx-auto p-6 bg-red-50 border border-red-200 rounded-lg">
      <h3 className="text-lg font-semibold text-red-800 mb-2">載入地點類型時發生錯誤</h3>
      <p className="text-sm text-red-600">{error.message || '無法載入地點類型，請重新整理頁面'}</p>
    </div>
  );

  if (!activeTypes || activeTypes.length === 0) return (
    <div className="max-w-2xl mx-auto p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="text-lg font-semibold text-yellow-800 mb-2">目前沒有可用的地點類型</h3>
      <p className="text-sm text-yellow-600">請聯絡管理員新增地點類型。</p>
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