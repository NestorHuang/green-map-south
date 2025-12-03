import React from 'react';

const FormLabel = ({ field }) => (
  <label htmlFor={field.fieldId} className="block text-sm font-medium text-gray-700">
    {field.label}
    {field.required && <span className="text-red-500 ml-1">*</span>}
  </label>
);

const HelpText = ({ text }) => (
  text ? <p className="mt-2 text-sm text-gray-500">{text}</p> : null
);

const ErrorMessage = ({ message }) => (
  message ? <p className="mt-2 text-sm text-red-600">{message}</p> : null
);

// Individual Input Components
const TextInput = ({ field, ...props }) => <input type="text" id={field.fieldId} maxLength={field.validation?.maxLength} {...props} />;
const TextArea = ({ field, ...props }) => <textarea id={field.fieldId} rows={field.rows || 4} maxLength={field.validation?.maxLength} {...props} />;
const NumberInput = ({ field, ...props }) => (
  <div className="flex items-center gap-2">
    <input 
      type="number" 
      id={field.fieldId} 
      min={field.validation?.min} 
      max={field.validation?.max} 
      step={field.validation?.integer ? 1 : 'any'} 
      {...props} 
      className={`${props.className.replace('w-full', 'w-40')} text-right`} 
    />
    {field.unit && <span className="text-gray-600">{field.unit}</span>}
  </div>
);
const UrlInput = ({ field, ...props }) => <input type="url" id={field.fieldId} {...props} />;
const EmailInput = ({ field, ...props }) => <input type="email" id={field.fieldId} {...props} />;
const PhoneInput = ({ field, ...props }) => <input type="tel" id={field.fieldId} {...props} />;
const DateInput = ({ field, ...props }) => <input type="date" id={field.fieldId} {...props} />;
const TimeInput = ({ field, ...props }) => <input type="time" id={field.fieldId} {...props} />;

const Select = ({ field, ...props }) => (
  <select id={field.fieldId} {...props}>
    <option value="">{field.placeholder || '請選擇...'}</option>
    {field.options?.map(opt => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

const CheckboxGroup = ({ field, value = [], onChange, ...props }) => {
  const handleChange = (e) => {
    const { value: checkboxValue, checked } = e.target;
    const newValue = checked
      ? [...value, checkboxValue]
      : value.filter(v => v !== checkboxValue);
    onChange({ target: { name: props.name, value: newValue } });
  };
  return (
    <div className="space-y-2">
      {field.options?.map(opt => (
        <label key={opt.value} className="flex items-center">
          <input
            type="checkbox"
            value={opt.value}
            checked={value.includes(opt.value)}
            onChange={handleChange}
            name={props.name}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm">{opt.label}</span>
        </label>
      ))}
    </div>
  );
};

const RadioGroup = ({ field, ...props }) => (
  <div className="space-y-2">
    {field.options?.map(opt => (
      <label key={opt.value} className="flex items-center">
        <input type="radio" value={opt.value} {...props} className="h-4 w-4 text-indigo-600 border-gray-300" />
        <span className="ml-2 text-sm">{opt.label}</span>
      </label>
    ))}
  </div>
);

const BooleanSwitch = ({ field, value, onChange, ...props }) => {
    const handleChange = (e) => {
        onChange({ target: { name: props.name, value: e.target.checked }});
    };
    return (
        <label className="flex items-center cursor-pointer">
            <div className="relative">
                <input type="checkbox" className="sr-only" checked={!!value} onChange={handleChange} {...props} />
                <div className={`block w-10 h-6 rounded-full ${value ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${value ? 'transform translate-x-4' : ''}`}></div>
            </div>
            <div className="ml-3 text-gray-700 text-sm">{value ? '是' : '否'}</div>
        </label>
    );
};


const DynamicFieldInput = ({ field, value, onChange, error }) => {
  const commonProps = {
    name: field.fieldId,
    value: value ?? (field.type === 'multi-select' || field.type === 'checkbox' ? [] : ''),
    onChange: onChange,
    placeholder: field.placeholder,
    className: "block w-full border border-gray-400 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm",
  };

  let InputComponent;
  switch (field.type) {
    case 'textarea': InputComponent = TextArea; break;
    case 'number': InputComponent = NumberInput; break;
    case 'select': InputComponent = Select; break;
    case 'multi-select':
    case 'checkbox': InputComponent = CheckboxGroup; break;
    case 'radio': InputComponent = RadioGroup; commonProps.className = ""; break;
    case 'boolean': InputComponent = BooleanSwitch; commonProps.className = ""; break;
    case 'date': InputComponent = DateInput; break;
    case 'time': InputComponent = TimeInput; break;
    case 'url': InputComponent = UrlInput; break;
    case 'email': InputComponent = EmailInput; break;
    case 'phone': InputComponent = PhoneInput; break;
    case 'text':
    default:
      InputComponent = TextInput;
  }
  
  // RadioGroup and CheckboxGroup need specific handling for value/checked
  if(field.type === 'radio') {
    commonProps.checked = value === field.value;
  }

  return (
    <div className="mb-6">
      <FormLabel field={field} />
      <div className="mt-1">
        <InputComponent field={field} {...commonProps} />
      </div>
      <HelpText text={field.helpText} />
      <ErrorMessage message={error} />
    </div>
  );
};

export default DynamicFieldInput;
