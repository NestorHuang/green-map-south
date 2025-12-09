import React, { useMemo } from 'react';
import DynamicFieldInput from './DynamicFieldInput';

const DynamicForm = ({ fieldSchema, values, onChange, errors }) => {
  // Memoize the sorted fields to prevent re-sorting on every render
  const sortedFields = useMemo(() => {
    if (!fieldSchema) return [];
    return [...fieldSchema].sort((a, b) => a.order - b.order);
  }, [fieldSchema]);

  const handleFieldChange = (e) => {
    const { name, value, type } = e.target;
    
    let processedValue = value;
    // Handle number inputs that might return strings
    const fieldType = fieldSchema.find(f => f.fieldId === name)?.type;
    if (fieldType === 'number' && value !== '') {
        processedValue = Number(value);
    }

    onChange({
      ...values,
      [name]: processedValue,
    });
  };

  if (!fieldSchema || fieldSchema.length === 0) {
    return (
        <div className="text-center p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-500">此地點類型尚未定義任何自訂欄位。</p>
        </div>
    );
  }

  return (
    <div className="dynamic-form space-y-4">
      {sortedFields.map(field => (
        <DynamicFieldInput
          key={field.fieldId}
          field={field}
          value={values[field.fieldId]}
          onChange={handleFieldChange}
          error={errors[field.fieldId]}
        />
      ))}
    </div>
  );
};

export default DynamicForm;
