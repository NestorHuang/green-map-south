// src/config/fieldTypes.js

export const FIELD_TYPES = {
  text: { label: '單行文字', icon: 'T', hasOptions: false, hasValidation: ['minLength', 'maxLength', 'pattern'] },
  textarea: { label: '多行文字', icon: '¶', hasOptions: false, hasValidation: ['minLength', 'maxLength'] },
  number: { label: '數字', icon: '#', hasOptions: false, hasValidation: ['min', 'max', 'integer'] },
  select: { label: '單選下拉式選單', icon: '▼', hasOptions: true, hasValidation: [] },
  'multi-select': { label: '多選式選單', icon: '✓✓', hasOptions: true, hasValidation: [] },
  radio: { label: '單選按鈕', icon: '◉', hasOptions: true, hasValidation: [] },
  checkbox: { label: '多選核取方塊', icon: '☑', hasOptions: true, hasValidation: [] },
  boolean: { label: '布林值 (開關)', icon: ' 开关', hasOptions: false, hasValidation: [] },
  date: { label: '日期', icon: '📅', hasOptions: false, hasValidation: ['minDate', 'maxDate'] },
  time: { label: '時間', icon: '🕒', hasOptions: false, hasValidation: [] },
  url: { label: '網址', icon: '🔗', hasOptions: false, hasValidation: [] },
  email: { label: '電子郵件', icon: '@', hasOptions: false, hasValidation: [] },
  phone: { label: '電話號碼', icon: '📞', hasOptions: false, hasValidation: ['pattern'] },
};

export const getFieldTypeInfo = (type) => {
    return FIELD_TYPES[type] || { label: '未知', icon: '?', hasOptions: false, hasValidation: [] };
};

export const fieldTypeOptions = Object.entries(FIELD_TYPES).map(([value, { label }]) => ({
  value,
  label,
}));
