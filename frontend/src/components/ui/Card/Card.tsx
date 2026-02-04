/**
 * Card Component
 * 
 * Simple, flexible card component for consistent layouts.
 */

import React from 'react';
import { cn } from '@/app/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated' | 'ghost';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export function Card({
  children,
  className,
  variant = 'default',
  padding = 'md',
  rounded = 'md',
  ...props
}: CardProps): JSX.Element {
  const baseClasses = 'bg-white transition-colors';

  const variantClasses = {
    default: '',
    outlined: 'border border-gray-200',
    elevated: 'shadow-sm border border-gray-100 hover:shadow-md',
    ghost: 'bg-transparent',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        paddingClasses[padding],
        roundedClasses[rounded],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Card sub-components for better composition
export function CardHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <div
      className={cn('pb-3 border-b border-gray-200', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <div className={cn('py-3', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <div
      className={cn('pt-3 border-t border-gray-200', className)}
      {...props}
    >
      {children}
    </div>
  );
}