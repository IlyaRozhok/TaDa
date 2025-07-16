"use client";

import { forwardRef, ButtonHTMLAttributes } from "react";
import { cn } from "@/app/lib/utils";

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "liquid";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "relative overflow-hidden transition-all duration-300 ease-out font-medium focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed group";

    const variants = {
      primary:
        "bg-gradient-to-r from-blue-500/20 via-slate-500/20 to-slate-600/20 backdrop-blur-lg border border-white/30 text-white shadow-lg hover:shadow-xl hover:from-blue-500/30 hover:to-slate-600/30 hover:scale-105",
      secondary:
        "bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 shadow-md hover:bg-white/20 hover:border-white/40 hover:shadow-lg",
      ghost:
        "bg-transparent backdrop-blur-none border border-white/10 text-white/80 hover:bg-white/10 hover:border-white/30 hover:text-white",
      liquid:
        "bg-gradient-to-br from-cyan-400/20 via-blue-500/20 to-slate-600/20 backdrop-blur-md border border-white/25 text-white shadow-xl hover:shadow-2xl hover:scale-110",
    };

    const sizes = {
      sm: "px-4 py-2 text-sm rounded-lg",
      md: "px-6 py-3 text-base rounded-xl",
      lg: "px-8 py-4 text-lg rounded-2xl",
    };

    const iconClasses = icon ? "flex items-center space-x-2" : "";

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          iconClasses,
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-0 transition-transform duration-700" />

        {/* Ripple effect */}
        <div className="absolute inset-0 bg-white/10 rounded-[inherit] scale-0 group-active:scale-100 transition-transform duration-200" />

        {/* Content */}
        <div className="relative z-10 flex items-center justify-center space-x-2">
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            icon && (
              <span className="text-white/80 group-hover:text-white">
                {icon}
              </span>
            )
          )}

          {children && (
            <span className="drop-shadow-sm group-hover:drop-shadow-md transition-all duration-300">
              {children}
            </span>
          )}
        </div>

        {/* Glow effect */}
        <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-r from-blue-400/20 via-slate-400/20 to-slate-500/20 opacity-2 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
      </button>
    );
  }
);

GlassButton.displayName = "GlassButton";

export default GlassButton;
