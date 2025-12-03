import React, { useState } from 'react';
import { useLocationTypes } from '../contexts/LocationTypesContext';
import TypeModal from '../components/Admin/LocationTypes/TypeModal';
import { createType, updateType } from '../services/locationTypes';

const ManageLocationTypesPage = () => {
  const { types, loading, error, refreshTypes } = useLocationTypes();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);

  const handleAddNew = () => {
    setEditingType(null);
    setIsModalOpen(true);
  };

  const handleEdit = (type) => {
    setEditingType(type);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingType(null);
  };

  const handleSave = async (formData) => {
    try {
      if (editingType) {
        await updateType(editingType.id, formData);
        alert('Location type updated successfully!');
      } else {
        await createType(formData);
        alert('Location type created successfully!');
      }
      handleCloseModal();
      await refreshTypes();
    } catch (err) {
      console.error('Failed to save location type:', err);
      alert(`Error: ${err.message}`);
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-xl text-gray-500">Loading location types...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">
        <p>An error occurred while fetching data:</p>
        <p className="font-mono text-sm">{error.message}</p>
        <button
          onClick={refreshTypes}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">管理地點類型</h1>
          <p className="mt-2 text-sm text-gray-700">
            系統中所有地點類型的清單。您可以建立、編輯和重新排序它們。
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={handleAddNew}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            新增類型
          </button>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">名稱與圖示</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">描述</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">狀態</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">欄位數量</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                    <span className="sr-only">編輯</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {types.map((type) => (
                  <tr key={type.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{type.iconEmoji || '❓'}</span>
                        <div>
                          <div
                            className="font-bold"
                            style={{ color: type.color || '#000000' }}
                          >
                            {type.name}
                          </div>
                          <div className="text-gray-500">排序: {type.order}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-pre-wrap px-3 py-4 text-sm text-gray-500 max-w-xs">{type.description}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {type.isActive ? (
                        <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                          啟用中
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                          未啟用
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{type.fieldSchema?.length || 0}</td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                      <button onClick={() => handleEdit(type)} className="text-indigo-600 hover:text-indigo-900">
                        編輯
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {types.length === 0 && (
                <div className="text-center py-10">
                    <p className="text-gray-500">尚未找到任何地點類型。</p>
                    <p className="text-gray-400 text-sm mt-1">點擊「新增類型」開始。</p>
                </div>
            )}
          </div>
        </div>
      </div>
      <TypeModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        typeData={editingType}
       />
    </div>
  );
};

export default ManageLocationTypesPage;
