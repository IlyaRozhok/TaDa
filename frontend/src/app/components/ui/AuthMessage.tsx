"use client";

import React from "react";
import { cn } from "@/app/lib/utils";
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export interface AuthMessageProps {
  message: string;
  variant?: "success" | "error" | "warning" | "info";
  className?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: boolean;
  size?: "sm" | "md" | "lg";
}

export const AuthMessage: React.FC<AuthMessageProps> = ({
  message,
  variant = "info",
  className,
  dismissible = false,
  onDismiss,
  icon = true,
  size = "md",
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  const getIcon = () => {
    switch (variant) {
      case "success":
        return CheckCircle;
      case "error":
        return AlertCircle;
      case "warning":
        return AlertTriangle;
      case "info":
        return Info;
      default:
        return Info;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return "p-2 text-sm";
      case "lg":
        return "p-4 text-base";
      case "md":
      default:
        return "p-3 text-sm";
    }
  };

  const Icon = getIcon();
  const iconSize =
    size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5";

  return (
    <div
      className={cn(
        "flex items-start gap-3 border rounded-lg transition-all duration-200",
        getVariantStyles(),
        getSizeStyles(),
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {icon && (
        <div className="flex-shrink-0 mt-0.5">
          <Icon className={iconSize} />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="leading-relaxed break-words">{message}</p>
      </div>

      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 ml-2 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Dismiss message"
        >
          <X className={iconSize} />
        </button>
      )}
    </div>
  );
};

// Convenience wrapper components
export const AuthSuccessMessage: React.FC<Omit<AuthMessageProps, "variant">> = (
  props
) => <AuthMessage {...props} variant="success" />;

export const AuthErrorMessage: React.FC<Omit<AuthMessageProps, "variant">> = (
  props
) => <AuthMessage {...props} variant="error" />;

export const AuthWarningMessage: React.FC<Omit<AuthMessageProps, "variant">> = (
  props
) => <AuthMessage {...props} variant="warning" />;

export const AuthInfoMessage: React.FC<Omit<AuthMessageProps, "variant">> = (
  props
) => <AuthMessage {...props} variant="info" />;
