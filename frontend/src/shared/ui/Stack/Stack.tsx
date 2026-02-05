/**
 * Stack Component
 * 
 * Simple layout component for consistent spacing between elements.
 */

import React from 'react';
import { cn } from '@/app/lib/utils';

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'horizontal' | 'vertical';
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
}

export function Stack({
  children,
  className,
  direction = 'vertical',
  spacing = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  ...props
}: StackProps): React.ReactElement {
  const isHorizontal = direction === 'horizontal';

  const baseClasses = cn(
    'flex',
    isHorizontal ? 'flex-row' : 'flex-col',
    wrap && 'flex-wrap'
  );

  const spacingClasses = {
    xs: isHorizontal ? 'gap-1' : 'space-y-1',
    sm: isHorizontal ? 'gap-2' : 'space-y-2',
    md: isHorizontal ? 'gap-4' : 'space-y-4',
    lg: isHorizontal ? 'gap-6' : 'space-y-6',
    xl: isHorizontal ? 'gap-8' : 'space-y-8',
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  return (
    <div
      className={cn(
        baseClasses,
        spacingClasses[spacing],
        alignClasses[align],
        justifyClasses[justify],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Convenience components
export function HStack(props: Omit<StackProps, 'direction'>): React.ReactElement {
  return <Stack {...props} direction="horizontal" />;
}

export function VStack(props: Omit<StackProps, 'direction'>): React.ReactElement {
  return <Stack {...props} direction="vertical" />;
}