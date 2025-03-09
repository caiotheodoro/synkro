import React, { useState, useEffect } from 'react';
import { BackofficeFormConfig } from '../core/BackofficeBuilder';
import { Button } from '@/components/ui/Button';

interface FormComponentProps {
  value: any;
  onChange: (value: any) => void;
}

type FormComponent = React.ReactElement<FormComponentProps>;

interface DynamicFormProps {
  config: BackofficeFormConfig;
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  config,
  initialValues = {},
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const validateField = (name: string, value: any) => {
    const field = config.fields.find(f => f.name === name);
    
    if (!field) return undefined;
    
    if (field.required && (value === undefined || value === null || value === '')) {
      return `${field.label} is required`;
    }
    
    if (field.validation) {
      return field.validation(value);
    }
    
    return undefined;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    config.fields.forEach(field => {
      const error = validateField(field.name, values[field.name]);
      
      if (error) {
        newErrors[field.name] = error;
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    let newValue: any = value;
    
    if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      newValue = value === '' ? '' : Number(value);
    }
    
    setValues({
      ...values,
      [name]: newValue,
    });
    
    setTouched({
      ...touched,
      [name]: true,
    });
    
    const error = validateField(name, newValue);
    
    setErrors({
      ...errors,
      [name]: error ?? '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const allTouched: Record<string, boolean> = {};
    config.fields.forEach(field => {
      allTouched[field.name] = true;
    });
    
    setTouched(allTouched);
    
    if (validateForm()) {
      onSubmit(values);
    }
  };

  const renderField = (field: BackofficeFormConfig['fields'][0]) => {
    const { name, label, type, options, required, placeholder, helperText, component } = field;
    
    const value = values[name] !== undefined ? values[name] : '';
    const error = touched[name] && errors[name];
    
    if (component) {
      return (
        <div key={name} className="mb-4">
          <label className="block mb-2 font-bold">{label}{required && <span className="text-red-500">*</span>}</label>
          {component({
            value,
            onChange: (val: any) => {
              setValues({
                ...values,
                [name]: val,
              });
              
              setTouched({
                ...touched,
                [name]: true,
              });
              
              const error = validateField(name, val);
              
              setErrors({
                ...errors,
                [name]: error ?? '',
              });
            },
          })}
          {error && <p className="mt-2 text-sm text-red-500 font-medium">{error}</p>}
          {helperText && !error && <p className="mt-2 text-sm text-neutral-600">{helperText}</p>}
        </div>
      );
    }
    
    switch (type) {
      case 'textarea':
        return (
          <div key={name} className="mb-4">
            <label className="block mb-2 font-bold" htmlFor={name}>
              {label}{required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              id={name}
              name={name}
              value={value}
              onChange={handleChange}
              placeholder={placeholder}
              className="w-full p-3 bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
              rows={5}
            />
            {error && <p className="mt-2 text-sm text-red-500 font-medium">{error}</p>}
            {helperText && !error && <p className="mt-2 text-sm text-neutral-600">{helperText}</p>}
          </div>
        );
      
      case 'select':
        return (
          <div key={name} className="mb-4">
            <label className="block mb-2 font-bold" htmlFor={name}>
              {label}{required && <span className="text-red-500">*</span>}
            </label>
            <select
              id={name}
              name={name}
              value={value}
              onChange={handleChange}
              className="w-full p-3 bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            >
              <option value="">Select {label}</option>
              {options?.map((option, index) => (
                <option key={index} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {error && <p className="mt-2 text-sm text-red-500 font-medium">{error}</p>}
            {helperText && !error && <p className="mt-2 text-sm text-neutral-600">{helperText}</p>}
          </div>
        );
      
      case 'boolean':
        return (
          <div key={name} className="mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id={name}
                name={name}
                checked={!!value}
                onChange={handleChange}
                className="w-5 h-5 border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
              />
              <label className="ml-3 font-bold" htmlFor={name}>
                {label}{required && <span className="text-red-500">*</span>}
              </label>
            </div>
            {error && <p className="mt-2 text-sm text-red-500 font-medium">{error}</p>}
            {helperText && !error && <p className="mt-2 text-sm text-neutral-600">{helperText}</p>}
          </div>
        );
      
      case 'number':
        return (
          <div key={name} className="mb-4">
            <label className="block mb-2 font-bold" htmlFor={name}>
              {label}{required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="number"
              id={name}
              name={name}
              value={value}
              onChange={handleChange}
              placeholder={placeholder}
              className="w-full p-3 bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            />
            {error && <p className="mt-2 text-sm text-red-500 font-medium">{error}</p>}
            {helperText && !error && <p className="mt-2 text-sm text-neutral-600">{helperText}</p>}
          </div>
        );
      
      default:
        return (
          <div key={name} className="mb-4">
            <label className="block mb-2 font-bold" htmlFor={name}>
              {label}{required && <span className="text-red-500">*</span>}
            </label>
            <input
              type={type}
              id={name}
              name={name}
              value={value}
              onChange={handleChange}
              placeholder={placeholder}
              className="w-full p-3 bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            />
            {error && <p className="mt-2 text-sm text-red-500 font-medium">{error}</p>}
            {helperText && !error && <p className="mt-2 text-sm text-neutral-600">{helperText}</p>}
          </div>
        );
    }
  };

  const renderFields = () => {
    if (config.sections) {
      return config.sections.map((section, index) => (
        <div key={index} className="mb-6">
          <h3 className="mb-4 text-xl font-bold border-b-4 border-black pb-2">{section.title}</h3>
          <div className="grid grid-cols-1 gap-4">
            {section.fields.map(fieldName => {
              const field = config.fields.find(f => f.name === fieldName);
              return field ? renderField(field) : null;
            })}
          </div>
        </div>
      ));
    }
    
    return (
      <div className="grid grid-cols-1 gap-4">
        {config.fields.map(field => renderField(field))}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      {renderFields()}
      
      <div className="mt-6 flex justify-end space-x-4 gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-white text-black font-bold rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            disabled={isLoading}
          >
            Cancel
          </button>
        )}
        
        <Button
          type="submit"
          variant="primary"
          className="px-6 py-3"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
}; 