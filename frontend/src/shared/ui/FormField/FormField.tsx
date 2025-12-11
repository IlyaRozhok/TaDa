"use client";

import React from "react";
import { cn } from "@/app/lib/utils";

interface FormFieldProps {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
  description?: string;
}

export default function FormField({
  label,
  name,
  error,
  required = false,
  className = "",
  children,
  description,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {description && <p className="text-sm text-gray-500">{description}</p>}

      {children}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface InputFieldProps {
  label: string;
  name: string;
  type?: "text" | "email" | "password" | "number" | "tel" | "url";
  placeholder?: string;
  value: string | number;
  onChange: (value: string | number) => void;
  error?: string;
  required?: boolean;
  className?: string;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

export function InputField({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  required = false,
  className = "",
  description,
  min,
  max,
  step,
  disabled = false,
}: InputFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue =
      type === "number" ? Number(e.target.value) : e.target.value;
    onChange(newValue);
  };

  return (
    <FormField
      label={label}
      name={name}
      error={error}
      required={required}
      className={className}
      description={description}
    >
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={cn(
          "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
          error && "border-red-300 focus:ring-red-500 focus:border-red-500"
        )}
      />
    </FormField>
  );
}

interface TextAreaFieldProps {
  label: string;
  name: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  className?: string;
  description?: string;
  rows?: number;
  disabled?: boolean;
}

export function TextAreaField({
  label,
  name,
  placeholder,
  value,
  onChange,
  error,
  required = false,
  className = "",
  description,
  rows = 4,
  disabled = false,
}: TextAreaFieldProps) {
  return (
    <FormField
      label={label}
      name={name}
      error={error}
      required={required}
      className={className}
      description={description}
    >
      <textarea
        id={name}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        disabled={disabled}
        className={cn(
          "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
          error && "border-red-300 focus:ring-red-500 focus:border-red-500"
        )}
      />
    </FormField>
  );
}

interface SelectFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  error?: string;
  required?: boolean;
  className?: string;
  description?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  error,
  required = false,
  className = "",
  description,
  disabled = false,
  placeholder,
}: SelectFieldProps) {
  return (
    <FormField
      label={label}
      name={name}
      error={error}
      required={required}
      className={className}
      description={description}
    >
      <select
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
          error && "border-red-300 focus:ring-red-500 focus:border-red-500"
        )}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}
