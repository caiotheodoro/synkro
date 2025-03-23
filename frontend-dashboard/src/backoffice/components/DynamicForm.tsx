import React, { useEffect } from "react";
import { BackofficeFormConfig } from "../core/types";
import { TextField } from "./molecules/TextField";
import { TextareaField } from "./molecules/TextareaField";
import { SelectField } from "./molecules/SelectField";
import { CheckboxField } from "./molecules/CheckboxField";
import { NumberField } from "./molecules/NumberField";
import { CustomField } from "./molecules/CustomField";
import { FormSection } from "./organisms/FormSection";
import { FormActions } from "./organisms/FormActions";
import { useFormActions } from "../hooks/useFormActions";

interface DynamicFormProps {
  config: BackofficeFormConfig;
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  queryInvalidations?: string[];
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  config,
  initialValues = {},
  onSubmit,
  onCancel,
  isLoading = false,
  queryInvalidations = [],
}) => {
  const {
    values,
    errors,
    touched,
    handleChange,
    handleValueChange,
    handleSubmit,
  } = useFormActions({
    config,
    initialValues,
    onSubmit,
    queryInvalidations,
  });

  useEffect(() => {
    const handleHiddenFieldUpdate = (event: CustomEvent) => {
      const { name, value } = event.detail;
      handleValueChange(name, value);
    };

    document.addEventListener(
      "update-hidden-field",
      handleHiddenFieldUpdate as EventListener
    );

    return () => {
      document.removeEventListener(
        "update-hidden-field",
        handleHiddenFieldUpdate as EventListener
      );
    };
  }, []);

  const renderField = (field: BackofficeFormConfig["fields"][0]) => {
    const {
      name,
      label,
      type,
      options,
      required,
      placeholder,
      helperText,
      component,
      hidden,
    } = field;

    if (hidden) {
      return null;
    }

    const value = values[name] !== undefined ? values[name] : "";
    const error = touched[name] ? errors[name] : undefined;

    if (component) {
      return (
        <CustomField
          key={name}
          name={name}
          label={label}
          required={required}
          error={error}
          touched={touched[name]}
          helperText={helperText}
          component={component({
            value,
            onChange: (val: any) => handleValueChange(name, val),
          })}
        />
      );
    }

    switch (type) {
      case "textarea":
        return (
          <TextareaField
            key={name}
            name={name}
            label={label}
            required={required}
            error={error}
            touched={touched[name]}
            helperText={helperText}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
          />
        );

      case "select":
        return (
          <SelectField
            key={name}
            name={name}
            label={label}
            required={required}
            error={error}
            touched={touched[name]}
            helperText={helperText}
            value={value}
            onChange={handleChange}
            options={options || []}
            placeholder={`Select ${label}`}
          />
        );

      case "boolean":
        return (
          <CheckboxField
            key={name}
            name={name}
            label={label}
            required={required}
            error={error}
            touched={touched[name]}
            helperText={helperText}
            checked={!!value}
            onChange={handleChange}
          />
        );

      case "number":
        return (
          <NumberField
            key={name}
            name={name}
            label={label}
            required={required}
            error={error}
            touched={touched[name]}
            helperText={helperText}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
          />
        );

      default:
        return (
          <TextField
            key={name}
            name={name}
            label={label}
            required={required}
            error={error}
            touched={touched[name]}
            helperText={helperText}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            type={type as "text" | "email" | "password" | "date"}
          />
        );
    }
  };

  const renderFields = () => {
    if (config.sections) {
      return config.sections.map((section, index) => (
        <FormSection key={index} title={section.title}>
          {section.fields.map((fieldName) => {
            const field = config.fields.find((f) => f.name === fieldName);
            return field ? renderField(field) : null;
          })}
        </FormSection>
      ));
    }

    return (
      <div className="grid grid-cols-1 gap-4">
        {config.fields.map((field) => renderField(field))}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      {renderFields()}
      <FormActions onCancel={onCancel} isLoading={isLoading} />
    </form>
  );
};
