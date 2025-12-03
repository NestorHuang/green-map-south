import React from 'react';

/**
 * Formats a dynamic field's value for display based on its schema.
 * @param {object} field - The schema object for the field.
 * @param {*} value - The value of the field.
 * @returns {React.ReactNode|string} The formatted value for rendering.
 */
export function formatFieldValue(field, value) {
  if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) {
    return <span className="text-gray-400">-</span>;
  }

  const renderWithOptions = (isMultiSelect = false) => {
    if (!Array.isArray(field.options)) return value;
    const values = isMultiSelect ? value : [value];
    const selectedOptions = field.options.filter(opt => values.includes(opt.value));
    if (selectedOptions.length === 0) return isMultiSelect ? '-' : value;
    return selectedOptions.map(opt => `${opt.icon || ''} ${opt.label}`).join('、');
  };

  switch (field.type) {
    case 'number':
      return `${field.prefix || ''}${value}${field.suffix || ''}`;

    case 'boolean':
      return value ? '✅ 是' : '❌ 否';

    case 'select':
    case 'radio':
      return renderWithOptions(false);

    case 'multi-select':
    case 'checkbox':
      return renderWithOptions(true);

    case 'url':
      return (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline break-all">
          {value}
        </a>
      );

    case 'email':
      return <a href={`mailto:${value}`} className="text-indigo-600 hover:underline">{value}</a>;

    case 'phone':
      return <a href={`tel:${value}`} className="text-indigo-600 hover:underline">{value}</a>;

    case 'date':
        try {
            return new Date(value).toLocaleDateString('zh-TW');
        } catch (e) {
            return value; // Fallback for invalid date format
        }

    case 'time':
      return value;

    case 'textarea':
      return <p className="whitespace-pre-wrap">{value}</p>;
      
    case 'text':
    default:
      return value;
  }
}
