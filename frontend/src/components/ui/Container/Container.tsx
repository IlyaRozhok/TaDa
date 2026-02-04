/**
 * Container Component
 * 
 * Simple layout container with consistent max-width and padding.
 */

import React from 'react';
import { cn } from '@/app/lib/utils';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  centered?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Container({
  children,
  className,
  size = 'lg',
  centered = true,
  padding = 'md',
  ...props
}: ContainerProps): JSX.Element {
  const baseClasses = 'w-full';

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-none',
  };

  const centerClasses = centered ? 'mx-auto' : '';

  const paddingClasses = {
    none: '',
    sm: 'px-4 py-2',
    md: 'px-6 py-4',
    lg: 'px-8 py-6',
  };

  return (
    <div
      className={cn(
        baseClasses,
        sizeClasses[size],
        centerClasses,
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}