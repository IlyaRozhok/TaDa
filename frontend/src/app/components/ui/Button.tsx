import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

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
    const baseClasses = 'btn-base';
    const variantClasses = `btn-${variant}`;
    const sizeClasses = `btn-${size}`;
    const loadingClasses = loading ? 'btn-loading' : '';
    const fullWidthClasses = fullWidth ? 'btn-block' : '';
    const pillClasses = pill ? 'btn-pill' : '';
    const iconClasses = icon && children ? 'btn-with-icon' : '';
    const disabledClasses = (disabled || loading) ? 'btn-disabled' : '';

    const classes = [
      baseClasses,
      variantClasses,
      sizeClasses,
      loadingClasses,
      fullWidthClasses,
      pillClasses,
      iconClasses,
      disabledClasses,
      className
    ].filter(Boolean).join(' ');

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
            {icon}
            <span>{children}</span>
          </>
        ) : (
          <>
            <span>{children}</span>
            {icon}
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

// Icon Button Component
export interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, className = '', ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={`btn-icon ${className}`}
        {...props}
      >
        {icon}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

// Button Group Component
export interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`btn-group ${className}`}>
      {children}
    </div>
  );
};

// Floating Action Button Component
export interface FABProps extends Omit<ButtonProps, 'size' | 'variant'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const FAB = forwardRef<HTMLButtonElement, FABProps>(
  ({ icon, className = '', ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant="primary"
        className={`btn-fab ${className}`}
        {...props}
      >
        {icon}
      </Button>
    );
  }
);

FAB.displayName = 'FAB';

// Link Button Component (looks like button, acts like link)
export interface LinkButtonProps extends ButtonProps {
  href: string;
  target?: string;
  rel?: string;
}

export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(
  ({ href, target, rel, className = '', children, ...buttonProps }, ref) => {
    const baseClasses = 'btn-base';
    const variantClasses = `btn-${buttonProps.variant || 'primary'}`;
    const sizeClasses = `btn-${buttonProps.size || 'md'}`;
    const fullWidthClasses = buttonProps.fullWidth ? 'btn-block' : '';
    const pillClasses = buttonProps.pill ? 'btn-pill' : '';
    const iconClasses = buttonProps.icon && children ? 'btn-with-icon' : '';

    const classes = [
      baseClasses,
      variantClasses,
      sizeClasses,
      fullWidthClasses,
      pillClasses,
      iconClasses,
      className
    ].filter(Boolean).join(' ');

    return (
      <a
        ref={ref}
        href={href}
        target={target}
        rel={rel}
        className={classes}
      >
        {buttonProps.icon && buttonProps.iconPosition === 'left' && buttonProps.icon}
        {children}
        {buttonProps.icon && buttonProps.iconPosition === 'right' && buttonProps.icon}
      </a>
    );
  }
);

LinkButton.displayName = 'LinkButton';

export default Button;