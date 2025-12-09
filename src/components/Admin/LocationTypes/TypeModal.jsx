import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import FieldConfigurator from './FieldConfigurator';
import IconPicker from './IconPicker';
import { ICON_LIBRARY } from '../../../config/iconLibrary';

// A generic modal component shell
const Modal = ({ children, onClose, title }) => {
  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

// Form input component
const FormInput = ({ label, id, children, helpText }) => (
    <div className="mb-4">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="mt-1">
            {children}
        </div>
        {helpText && <p className="mt-2 text-sm text-gray-500">{helpText}</p>}
    </div>
);


const TypeModal = ({ isOpen, onClose, onSave, typeData }) => {
  const [formData, setFormData] = useState({});
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  
  useEffect(() => {
    if (typeData) {
      setFormData(typeData);
    } else {
      // Default values for a new type
      setFormData({
        name: '',
        description: '',
        icon: 'pin',
        iconEmoji: '📍',
        color: '#9E9E9E',
        order: 10,
        isActive: true,
        fieldSchema: [],
        commonFields: { name: true, address: true, description: true, photos: true, tags: true }
      });
    }
  }, [typeData, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
  
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
  };

  const handleFieldSchemaChange = (newSchema) => {
    console.log("Field schema updated in TypeModal (received newSchema):", newSchema);
    setFormData(prev => {
      const updatedData = { ...prev, fieldSchema: newSchema };
      console.log("Field schema updated in TypeModal (updated formData):", updatedData);
      return updatedData;
    });
  };

  const handleIconSelect = (icon) => {
    setFormData(prev => ({ ...prev, icon: icon.id, iconEmoji: icon.emoji }));
    setIsIconPickerOpen(false);
  };

  const handleSubmit = (e) => {
    if (e) {
        e.preventDefault();
    }
    console.log("Submitting form data:", formData);
    onSave(formData);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        // Prevent submission if focused on textarea or button (to avoid double submission or unwanted behavior)
        if (e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON') {
            e.preventDefault();
            handleSubmit();
        }
    }
  };

  if (!isOpen) {
    return null;
  }

  const isEditing = !!typeData;
  const selectedIcon = ICON_LIBRARY.find(i => i.id === formData.icon) || { name: '未知', emoji: '❓' };

  return (
    <>
      <Modal onClose={onClose} title={isEditing ? '編輯地點類型' : '新增地點類型'}>
          <div onKeyDown={handleKeyDown}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div>
                      <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4 border-b pb-2">基本資訊</h3>
                      <FormInput label="類型名稱" id="name" helpText="顯示在使用者選擇介面上的名稱。">
                          <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleChange} required className="w-full border border-gray-400 rounded-md shadow-sm p-2"/>
                      </FormInput>
                      <FormInput label="類型描述" id="description" helpText="幫助使用者和管理員理解此類型的用途。">
                          <textarea name="description" id="description" value={formData.description || ''} onChange={handleChange} rows="3" className="w-full border border-gray-400 rounded-md shadow-sm p-2"></textarea>
                      </FormInput>
                      <FormInput label="排序" id="order" helpText="數字越小，顯示越前面。">
                          <input type="number" name="order" id="order" value={formData.order ?? ''} onChange={handleNumberChange} className="w-full border border-gray-400 rounded-md shadow-sm p-2"/>
                      </FormInput>
                       <FormInput label="啟用狀態" id="isActive">
                          <label className="flex items-center">
                              <input type="checkbox" name="isActive" id="isActive" checked={formData.isActive || false} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-400 rounded" />
                              <span className="ml-2 text-sm text-gray-900">啟用此類型</span>
                          </label>
                       </FormInput>
                  </div>

                  {/* Right Column */}
                  <div>
                      <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4 border-b pb-2">視覺配置</h3>
                      <FormInput label="標記顏色" id="color" helpText="在地圖上標記顯示的顏色。">
                          <input type="color" name="color" id="color" value={formData.color || ''} onChange={handleChange} className="h-10 w-full border border-gray-400 rounded-md p-0"/>
                      </FormInput>
                       <div className="mb-4">
                           <label className="block text-sm font-medium text-gray-700">圖示選擇 <span className="text-xs text-gray-500">在地圖上標記顯示的顏色。</span></label>
                           <div className="mt-1">
                                <button
                                    type="button"
                                    onClick={() => setIsIconPickerOpen(true)}
                                    className="w-full flex items-center p-2 border border-gray-400 rounded-md bg-white text-left"
                                    aria-label="選擇圖示"
                                >
                                    <span className="text-3xl w-10 text-center">{selectedIcon.emoji}</span>
                                    <span className="ml-3">
                                        <p className="font-semibold">{selectedIcon.name}</p>
                                        <p className="text-xs text-gray-500">ID: {formData.icon}</p>
                                    </span>
                                    <span className="ml-auto text-gray-400">變更</span>
                                </button>
                           </div>
                       </div>
                  </div>
              </div>

              <div className="mt-8">
                   <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4 border-b pb-2">欄位配置</h3>
                   <FieldConfigurator fields={formData.fieldSchema || []} onChange={handleFieldSchemaChange} />
              </div>


              <div className="mt-8 pt-5 border-t">
                  <div className="flex justify-end space-x-4">
                      <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                          取消
                      </button>
                      <button type="button" onClick={handleSubmit} className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700">
                          儲存
                      </button>
                  </div>
              </div>
          </div>
      </Modal>

      <IconPicker 
        isOpen={isIconPickerOpen}
        onClose={() => setIsIconPickerOpen(false)}
        onChange={handleIconSelect}
      />
    </>
  );
};

export default TypeModal;
