// src/utils/fieldValidation.js

/**
 * Checks if a value is empty.
 * @param {*} value The value to check.
 * @returns {boolean} True if the value is null, undefined, an empty string, or an empty array.
 */
function isEmpty(value) {
  return value == null || 
         value === '' || 
         (Array.isArray(value) && value.length === 0);
}

/**
 * Validates a single number field.
 * @param {object} field - The field schema object.
 * @param {*} value - The value to validate.
 * @returns {string[]} An array of error messages.
 */
function validateNumber(field, value) {
  const errors = [];
  const num = Number(value);

  if (isNaN(num)) {
    return [`${field.label} 必須是數字`];
  }

  if (field.validation?.integer && !Number.isInteger(num)) {
    errors.push(`${field.label} 必須是整數`);
  }
  if (field.validation?.min != null && num < field.validation.min) {
    errors.push(`${field.label} 不能小於 ${field.validation.min}`);
  }
  if (field.validation?.max != null && num > field.validation.max) {
    errors.push(`${field.label} 不能大於 ${field.validation.max}`);
  }
  return errors;
}

/**
 * Validates a single text-based field.
 * @param {object} field - The field schema object.
 * @param {*} value - The value to validate.
 * @returns {string[]} An array of error messages.
 */
function validateText(field, value) {
  const errors = [];
  const length = String(value).length;

  if (field.validation?.minLength != null && length < field.validation.minLength) {
    errors.push(`${field.label} 至少需要 ${field.validation.minLength} 個字`);
  }
  if (field.validation?.maxLength != null && length > field.validation.maxLength) {
    errors.push(`${field.label} 不能超過 ${field.validation.maxLength} 個字`);
  }
  if (field.validation?.pattern) {
    try {
      const regex = new RegExp(field.validation.pattern);
      if (!regex.test(value)) {
        errors.push(field.validation.errorMessage || `${field.label} 格式不正確`);
      }
    } catch (e) {
      console.error("Invalid regex pattern in field validation:", field.validation.pattern);
      errors.push(`欄位 "${field.label}" 的驗證規則設定錯誤。`);
    }
  }
  return errors;
}

/**
 * Validates a URL.
 * @param {*} value - The value to validate.
 * @returns {string[]} An array of error messages.
 */
function validateUrl(value) {
  try {
    new URL(value);
    return [];
  } catch {
    return ['網址格式不正確，請確認包含 http:// 或 https://'];
  }
}

/**
 * Validates an email address.
 * @param {*} value - The value to validate.
 * @returns {string[]} An array of error messages.
 */
function validateEmail(value) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(value) ? [] : ['電子郵件格式不正確'];
}

/**
 * Validates a single field based on its schema.
 * @param {object} field - The field schema object.
 * @param {*} value - The value to validate.
 * @returns {string[]} An array of error messages. An empty array means validation passed.
 */
export function validateField(field, value) {
  if (field.required && isEmpty(value)) {
    return [`${field.label} 為必填欄位`];
  }

  // Skip further validation for non-required empty fields
  if (isEmpty(value)) {
    return [];
  }

  switch (field.type) {
    case 'number':
      return validateNumber(field, value);
    case 'text':
    case 'textarea':
    case 'phone': // Often uses text validation logic
      return validateText(field, value);
    case 'url':
      return validateUrl(value);
    case 'email':
      return validateEmail(value);
    // Date/time validation can be added here if needed
    // 'select', 'multi-select', 'boolean' types usually don't need value validation beyond 'required'
    default:
      return [];
  }
}

/**
 * Validates a set of dynamic field values against a field schema.
 * @param {object[]} fieldSchema - The schema array for the fields.
 * @param {object} values - An object of fieldId: value pairs.
 * @returns {object} An errors object where keys are fieldIds and values are the first error message.
 */
export function validateDynamicFields(fieldSchema, values) {
  const errors = {};
  if (!fieldSchema) return errors;

  fieldSchema.forEach(field => {
    const value = values[field.fieldId];
    const fieldErrors = validateField(field, value);
    if (fieldErrors.length > 0) {
      errors[field.fieldId] = fieldErrors[0];
    }
  });

  return errors;
}
