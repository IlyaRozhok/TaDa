"use client";

import { ReactNode } from "react";
import { cn } from "@/app/lib/utils";

interface LiquidFormProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  variant?: "floating" | "wave" | "bubble" | "glass";
}

export const LiquidForm = ({
  children,
  className,
  title,
  description,
  variant = "floating",
}: LiquidFormProps) => {
  const baseClasses =
    "relative overflow-hidden transition-all duration-500 ease-out p-6 sm:p-8 md:p-10";

  const variants = {
    floating:
      "bg-white/40 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl hover:shadow-3xl hover:bg-white/50",
    wave: "bg-white/50 backdrop-blur-md border border-white/40 rounded-2xl shadow-xl hover:bg-white/60",
    bubble:
      "bg-white/40 backdrop-blur-lg border border-white/30 rounded-full shadow-2xl hover:bg-white/50",
    glass:
      "bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl shadow-lg hover:bg-white/70",
  };

  return (
    <div
      className={cn(
        baseClasses,
        variants[variant],
        "hover:scale-[1.01] hover:shadow-4xl",
        className
      )}
    >
      {/* Animated background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-32 h-32 bg-white/20 rounded-full blur-2xl animate-pulse" />
        <div className="absolute top-1/2 right-0 w-24 h-24 bg-white/20 rounded-full blur-2xl animate-pulse delay-300" />
        <div className="absolute bottom-0 left-1/2 w-40 h-40 bg-white/20 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-bounce" />
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-white/40 rounded-full animate-bounce delay-200" />
        <div className="absolute top-1/2 left-3/4 w-3 h-3 bg-white/25 rounded-full animate-bounce delay-500" />
      </div>

      {/* Content wrapper */}
      <div className="relative z-10">
        {title && (
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg">
              {title}
            </h2>
            {description && (
              <p className="text-white/90 text-sm sm:text-base leading-relaxed drop-shadow-md">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Form content */}
        <div className="space-y-4 sm:space-y-6">{children}</div>
      </div>

      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-gray-700" />
    </div>
  );
};

export default LiquidForm;
