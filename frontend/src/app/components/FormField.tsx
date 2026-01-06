import React from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  touched?: boolean;
  children: React.ReactNode;
  className?: string;
  helpText?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  touched,
  children,
  className = '',
  helpText
}) => {
  const hasError = touched && error;

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-white/90">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {children}
        {hasError && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {hasError && (
        <p className="text-sm text-red-400 flex items-center">
          <svg className="h-4 w-4 mr-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {!hasError && helpText && (
        <p className="text-sm text-white/60">{helpText}</p>
      )}
    </div>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input: React.FC<InputProps> = ({ error, className = '', ...props }) => {
  const baseClasses = "w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border rounded-lg focus:ring-2 focus:ring-white/50 text-white placeholder-white/50 transition-colors";
  const errorClasses = error 
    ? "border-red-400 focus:border-red-400" 
    : "border-white/20 focus:border-white/40";

  return (
    <input
      className={`${baseClasses} ${errorClasses} ${className}`}
      {...props}
    />
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({ 
  error, 
  className = '', 
  options, 
  placeholder,
  ...props 
}) => {
  const baseClasses = "w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border rounded-lg focus:ring-2 focus:ring-white/50 text-white transition-colors";
  const errorClasses = error 
    ? "border-red-400 focus:border-red-400" 
    : "border-white/20 focus:border-white/40";

  return (
    <select
      className={`${baseClasses} ${errorClasses} ${className}`}
      {...props}
    >
      {placeholder && (
        <option value="" disabled className="text-gray-400">
          {placeholder}
        </option>
      )}
      {options.map(option => (
        <option key={option.value} value={option.value} className="bg-gray-800 text-white">
          {option.label}
        </option>
      ))}
    </select>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({ error, className = '', ...props }) => {
  const baseClasses = "w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border rounded-lg focus:ring-2 focus:ring-white/50 text-white placeholder-white/50 transition-colors resize-vertical";
  const errorClasses = error 
    ? "border-red-400 focus:border-red-400" 
    : "border-white/20 focus:border-white/40";

  return (
    <textarea
      className={`${baseClasses} ${errorClasses} ${className}`}
      {...props}
    />
  );
};
