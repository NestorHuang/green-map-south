import React, { useState } from 'react';
import DraggableFieldList from './DraggableFieldList';
import FieldEditor from './FieldEditor';

const FieldConfigurator = ({ fields, onChange }) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);

  const handleAddField = () => {
    setEditingField(null);
    setIsEditorOpen(true);
  };

  const handleEditField = (field) => {
    setEditingField(field);
    setIsEditorOpen(true);
  };

  const handleDeleteField = (fieldIdToDelete) => {
    if (window.confirm('確定要刪除此欄位嗎？此操作無法復原。')) {
      onChange(fields.filter(f => f.fieldId !== fieldIdToDelete));
    }
  };

  const handleSaveField = (fieldData) => {
    // It's safer to get the latest fields state directly before modification
    const currentFields = fields || [];
    let newFields;
    const isEditing = currentFields.some(f => f.fieldId === fieldData.fieldId);

    if (isEditing) {
      // Update existing field
      newFields = currentFields.map(f => (f.fieldId === fieldData.fieldId ? fieldData : f));
    } else {
      // Add new field
      const newField = {
        ...fieldData,
        fieldId: fieldData.fieldId || `field_${Date.now()}`,
        order: currentFields.length + 1
      };
      newFields = [...currentFields, newField];
    }
    
    // Ensure order is always correct after any change
    const orderedFields = newFields.sort((a, b) => a.order - b.order);

    onChange(orderedFields);
    setIsEditorOpen(false);
    setEditingField(null);
  };
  
  const handleReorder = (dragIndex, hoverIndex) => {
    const reorderedFields = [...fields];
    const [draggedItem] = reorderedFields.splice(dragIndex, 1);
    reorderedFields.splice(hoverIndex, 0, draggedItem);
    
    // Update the order property for each field
    const updatedFields = reorderedFields.map((field, index) => ({
        ...field,
        order: index + 1
    }));

    onChange(updatedFields);
  };

  return (
    <div className="p-4 bg-gray-50 rounded-md border">
        <div className="flex justify-between items-center mb-4">
            <h4 className="text-md font-semibold text-gray-700">自訂欄位</h4>
            <button
                type="button"
                onClick={handleAddField}
                className="px-3 py-1.5 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500"
            >
                + 新增欄位
            </button>
        </div>
        
        <DraggableFieldList
            fields={fields}
            onReorder={handleReorder}
            onEdit={handleEditField}
            onDelete={handleDeleteField}
        />

        <FieldEditor
            isOpen={isEditorOpen}
            onCancel={() => setIsEditorOpen(false)}
            onSave={handleSaveField}
            field={editingField}
        />
    </div>
  );
};

export default FieldConfigurator;
