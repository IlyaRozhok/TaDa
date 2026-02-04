/**
 * Textarea Component
 * 
 * Simple, reusable textarea component with consistent styling.
 */

import React, { forwardRef } from 'react';
import { cn } from '@/app/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  variant?: 'default' | 'filled' | 'outline';
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({
    className,
    label,
    error,
    hint,
    variant = 'default',
    resize = 'vertical',
    disabled,
    required,
    id,
    rows = 3,
    ...props
  }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

    const baseClasses = 'w-full rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variantClasses = {
      default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
      filled: 'border-transparent bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-blue-500',
      outline: 'border-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500',
    };

    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    };

    const errorClasses = error 
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
      : '';

    const textareaClasses = cn(
      baseClasses,
      variantClasses[variant],
      resizeClasses[resize],
      errorClasses,
      'px-3 py-2 text-sm',
      className
    );

    return (
      <div className="space-y-1">
        {/* Label */}
        {label && (
          <label 
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Textarea */}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={textareaClasses}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
          {...props}
        />

        {/* Hint */}
        {hint && !error && (
          <p id={`${textareaId}-hint`} className="text-xs text-gray-500">
            {hint}
          </p>
        )}

        {/* Error */}
        {error && (
          <p id={`${textareaId}-error`} className="text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';