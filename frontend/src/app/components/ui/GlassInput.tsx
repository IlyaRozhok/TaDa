"use client";

import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/app/lib/utils";

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  variant?: "floating" | "wave" | "bubble" | "minimal";
  icon?: React.ReactNode;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ label, error, variant = "floating", icon, className, ...props }, ref) => {
    const baseClasses =
      "w-full px-4 py-3 transition-all duration-300 ease-in-out placeholder-white/50 text-white/90 focus:outline-none focus:ring-0";

    const variants = {
      floating:
        "bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl focus:bg-white/20 focus:border-white/40 focus:shadow-lg",
      wave: "bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-pink-400/10 backdrop-blur-md border border-white/30 rounded-xl focus:from-blue-400/20 focus:to-pink-400/20",
      bubble:
        "bg-white/5 backdrop-blur-lg border border-white/10 rounded-full focus:bg-white/15 focus:border-white/30 focus:shadow-2xl",
      minimal:
        "bg-white/5 backdrop-blur-sm border-b border-white/20 rounded-none focus:bg-white/10 focus:border-white/40",
    };

    const iconClasses = icon ? "pl-12" : "";

    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-white/80 drop-shadow-sm">
            {label}
          </label>
        )}

        <div className="relative group">
          {icon && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 group-focus-within:text-white/80 transition-colors">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            className={cn(
              baseClasses,
              variants[variant],
              iconClasses,
              "group-hover:bg-white/15 group-hover:border-white/30",
              error && "border-red-400/50 focus:border-red-400/80",
              className
            )}
            {...props}
          />

          {/* Animated underline */}
          <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-400/50 to-purple-400/50 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300" />

          {/* Glow effect on focus */}
          <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>

        {error && (
          <p className="text-red-400/80 text-sm mt-1 drop-shadow-sm">{error}</p>
        )}
      </div>
    );
  }
);

GlassInput.displayName = "GlassInput";

export default GlassInput;
