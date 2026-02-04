import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from "@/app/lib/utils";
import { colors, semanticColors } from '../tokens/colors';
import { textStyles } from '../tokens/typography';
import { spacing } from '../tokens/spacing';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  pill?: boolean;
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      pill = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
      secondary: "bg-white text-gray-900 hover:bg-gray-50 focus:ring-gray-500 border border-gray-300",
      outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500",
      ghost: "text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500",
      danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
      success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
      warning: "bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500",
    };

    const sizes = {
      xs: "px-2 py-1 text-xs",
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
      xl: "px-8 py-4 text-lg",
    };

    const variantStyles = {
      primary: `bg-[${colors.primary[500]}] text-white hover:bg-[${colors.primary[600]}] focus:ring-[${colors.primary[500]}] active:bg-[${colors.primary[700]}]`,
      secondary: `bg-white text-[${colors.neutral[900]}] hover:bg-[${colors.neutral[50]}] focus:ring-[${colors.neutral[500]}] border border-[${colors.neutral[300]}]`,
      outline: `border border-[${colors.neutral[300]}] text-[${colors.neutral[700]}] hover:bg-[${colors.neutral[50]}] focus:ring-[${colors.neutral[500]}]`,
      ghost: `text-[${colors.neutral[600]}] hover:text-[${colors.neutral[900]}] hover:bg-[${colors.neutral[100]}] focus:ring-[${colors.neutral[500]}]`,
      danger: `bg-[${colors.error[500]}] text-white hover:bg-[${colors.error[600]}] focus:ring-[${colors.error[500]}] active:bg-[${colors.error[700]}]`,
      success: `bg-[${colors.success[500]}] text-white hover:bg-[${colors.success[600]}] focus:ring-[${colors.success[500]}] active:bg-[${colors.success[700]}]`,
      warning: `bg-[${colors.warning[500]}] text-white hover:bg-[${colors.warning[600]}] focus:ring-[${colors.warning[500]}] active:bg-[${colors.warning[700]}]`,
    };

    const sizeStyles = {
      xs: `px-[${spacing[2]}] py-[${spacing[1]}] text-xs`,
      sm: `px-[${spacing[3]}] py-[${spacing[1.5]}] text-sm`,
      md: `px-[${spacing[4]}] py-[${spacing[2]}] text-sm`,
      lg: `px-[${spacing[6]}] py-[${spacing[3]}] text-base`,
      xl: `px-[${spacing[8]}] py-[${spacing[4]}] text-lg`,
    };

    const classes = cn(
      baseClasses,
      variantStyles[variant],
      sizeStyles[size],
      fullWidth && 'w-full',
      pill && 'rounded-full',
      className
    );

    const renderContent = () => {
      if (loading) {
        return (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {children && <span className="ml-2">{children}</span>}
          </>
        );
      }

      if (icon && children) {
        return iconPosition === 'left' ? (
          <>
            <span className="mr-2">{icon}</span>
            <span>{children}</span>
          </>
        ) : (
          <>
            <span>{children}</span>
            <span className="ml-2">{icon}</span>
          </>
        );
      }

      if (icon && !children) {
        return icon;
      }

      return children;
    };

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {renderContent()}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
