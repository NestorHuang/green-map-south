import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { fieldTypeOptions, getFieldTypeInfo } from '../../../config/fieldTypes';

// A generic modal component shell
const Modal = ({ children, onClose, title }) => {
  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

const FormInput = ({ label, id, children, helpText }) => (
    <div className="col-span-12 sm:col-span-6 mb-4">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="mt-1">
            {children}
        </div>
        {helpText && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
    </div>
);

const FieldEditor = ({ isOpen, onCancel, onSave, field }) => {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (field) {
            setFormData({ ...field });
        } else {
            // Defaults for a new field
            setFormData({
                fieldId: `field_${Date.now()}`,
                label: '',
                type: 'text',
                required: false,
                order: 0,
                placeholder: '',
                helpText: '',
                validation: {},
                options: [],
                displayInList: false,
                displayInDetail: true,
                displayOnMap: false,
            });
        }
    }, [field, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name.startsWith('validation.')) {
            const key = name.split('.')[1];
            setFormData(p => ({ ...p, validation: { ...p.validation, [key]: value } }));
        } else if (name.startsWith('display')) {
             setFormData(p => ({ ...p, [name]: checked }));
        }
        else {
            setFormData(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
        }
    };

    const handleOptionsChange = (e) => {
        const optionsString = e.target.value;
        const options = optionsString.split('\n').map(line => {
            const [value, label] = line.split('|').map(s => s.trim());
            return { value: value || '', label: label || value || '' };
        });
        setFormData(p => ({ ...p, options }));
    };

    const handleSubmit = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        onSave(formData);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            // Prevent submission if it's a textarea, unless Ctrl+Enter is used (optional logic, usually Enter in inputs submits)
            // For now, let's just submit on Enter for inputs, but maybe not textareas to allow new lines?
            // Actually, in a modal form, usually Enter submits.
            // But let's be careful with textarea.
            if (e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                handleSubmit();
            }
        }
    };

    if (!isOpen) return null;

    const isEditing = !!field;
    const selectedTypeInfo = getFieldTypeInfo(formData.type);
    const optionsAsString = formData.options?.map(o => `${o.value}|${o.label}`).join('\n') || '';

    return (
        <Modal onClose={onCancel} title={isEditing ? '編輯欄位' : '新增欄位'}>
            <div className="space-y-6" onKeyDown={handleKeyDown}>
                {/* Basic Info */}
                <div className="grid grid-cols-12 gap-x-6 border-b pb-6">
                    <FormInput label="欄位名稱" id="label"><input type="text" id="label" name="label" value={formData.label || ''} onChange={handleChange} className="w-full border border-gray-400 rounded-md p-2" required /></FormInput>
                    <FormInput label="欄位 ID" id="fieldId" helpText="此欄位的唯一識別碼，自動產生。"><input type="text" id="fieldId" name="fieldId" value={formData.fieldId || ''} onChange={handleChange} className="w-full border border-gray-400 rounded-md p-2 bg-gray-100" required readOnly/></FormInput>
                    <FormInput label="欄位類型" id="type"><select id="type" name="type" value={formData.type || 'text'} onChange={handleChange} className="w-full border border-gray-400 rounded-md p-2">{fieldTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></FormInput>
                    <div className="col-span-12 sm:col-span-6 flex items-center mb-4"><label><input type="checkbox" name="required" checked={formData.required || false} onChange={handleChange} className="mr-2"/> 必填欄位</label></div>
                </div>

                {/* Display & Help Text */}
                <div className="grid grid-cols-12 gap-x-6 border-b pb-6">
                    <FormInput label="提示文字" id="placeholder"><input type="text" id="placeholder" name="placeholder" value={formData.placeholder || ''} onChange={handleChange} className="w-full border border-gray-400 rounded-md p-2"/></FormInput>
                    <FormInput label="說明文字" id="helpText"><input type="text" id="helpText" name="helpText" value={formData.helpText || ''} onChange={handleChange} className="w-full border border-gray-400 rounded-md p-2"/></FormInput>
                    
                    {formData.type === 'number' && (
                        <FormInput label="單位" id="unit" helpText="例如：人、間、公尺"><input type="text" id="unit" name="unit" value={formData.unit || ''} onChange={handleChange} className="w-full border border-gray-400 rounded-md p-2"/></FormInput>
                    )}

                    <div className="col-span-12 text-sm font-medium text-gray-700">顯示控制</div>
                    <div className="col-span-12 flex space-x-6 pt-2">
                        <label><input type="checkbox" name="displayInList" checked={formData.displayInList || false} onChange={handleChange} className="mr-2"/> 顯示於列表</label>
                        <label><input type="checkbox" name="displayInDetail" checked={formData.displayInDetail || false} onChange={handleChange} className="mr-2"/> 顯示於詳情</label>
                        <label><input type="checkbox" name="displayOnMap" checked={formData.displayOnMap || false} onChange={handleChange} className="mr-2"/> 顯示於地圖</label>
                    </div>
                </div>

                {/* Options (for select, radio, etc.) */}
                {selectedTypeInfo.hasOptions && (
                    <div className="border-b pb-6">
                         <FormInput label="選項" id="options" helpText="每行一個選項。格式：值|顯示文字 (例如：projector|投影設備)">
                            <textarea id="options" name="options" value={optionsAsString} onChange={handleOptionsChange} rows="5" className="w-full border border-gray-400 rounded-md p-2 font-mono text-sm"></textarea>
                        </FormInput>
                    </div>
                )}
                
                {/* Validation Rules */}
                {selectedTypeInfo.hasValidation.length > 0 && (
                    <div className="grid grid-cols-12 gap-x-6 border-b pb-6">
                        <legend className="col-span-12 text-sm font-medium text-gray-700 mb-2">驗證規則</legend>
                        {selectedTypeInfo.hasValidation.includes('minLength') && <FormInput label="最小長度" id="validation.minLength"><input type="number" id="validation.minLength" name="validation.minLength" value={formData.validation?.minLength || ''} onChange={handleChange} className="w-full border border-gray-400 rounded-md p-2"/></FormInput>}
                        {selectedTypeInfo.hasValidation.includes('maxLength') && <FormInput label="最大長度" id="validation.maxLength"><input type="number" id="validation.maxLength" name="validation.maxLength" value={formData.validation?.maxLength || ''} onChange={handleChange} className="w-full border border-gray-400 rounded-md p-2"/></FormInput>}
                        {selectedTypeInfo.hasValidation.includes('min') && <FormInput label="最小值" id="validation.min"><input type="number" id="validation.min" name="validation.min" value={formData.validation?.min || ''} onChange={handleChange} className="w-full border border-gray-400 rounded-md p-2"/></FormInput>}
                        {selectedTypeInfo.hasValidation.includes('max') && <FormInput label="最大值" id="validation.max"><input type="number" id="validation.max" name="validation.max" value={formData.validation?.max || ''} onChange={handleChange} className="w-full border border-gray-400 rounded-md p-2"/></FormInput>}
                        {selectedTypeInfo.hasValidation.includes('pattern') && <FormInput label="正規表達式 (Regex)" id="validation.pattern"><input type="text" id="validation.pattern" name="validation.pattern" value={formData.validation?.pattern || ''} onChange={handleChange} className="w-full border border-gray-400 rounded-md p-2"/></FormInput>}
                        {selectedTypeInfo.hasValidation.includes('integer') && <div className="col-span-12 sm:col-span-6 flex items-center mb-4"><label><input type="checkbox" name="validation.integer" checked={formData.validation?.integer || false} onChange={handleChange} className="mr-2"/> 必須是整數</label></div>}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-4">
                    <button type="button" onClick={onCancel} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">取消</button>
                    <button type="button" onClick={handleSubmit} className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700">儲存欄位</button>
                </div>
            </div>
        </Modal>
    );
};

export default FieldEditor;
