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
      "bg-gradient-to-br from-slate-200/90 via-slate-300/80 to-slate-400/70 backdrop-blur-lg border border-slate-300/60 rounded-3xl shadow-2xl hover:shadow-3xl",
    wave: "bg-gradient-to-r from-slate-300/80 via-slate-400/70 to-slate-500/70 backdrop-blur-md border border-slate-400/50 rounded-2xl shadow-xl",
    bubble:
      "bg-gradient-to-br from-slate-200/80 via-slate-300/70 to-slate-400/70 backdrop-blur-lg border border-slate-300/60 rounded-full shadow-2xl",
    glass:
      "bg-slate-300/75 backdrop-blur-xl border border-slate-400/50 rounded-2xl shadow-lg",
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
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-slate-400/30 to-slate-500/30 rounded-full blur-2xl animate-pulse" />
        <div className="absolute top-1/2 right-0 w-24 h-24 bg-gradient-to-br from-slate-500/30 to-slate-600/30 rounded-full blur-2xl animate-pulse delay-300" />
        <div className="absolute bottom-0 left-1/2 w-40 h-40 bg-gradient-to-br from-slate-400/30 to-slate-500/30 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-slate-600/50 rounded-full animate-bounce" />
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-slate-700/60 rounded-full animate-bounce delay-200" />
        <div className="absolute top-1/2 left-3/4 w-3 h-3 bg-slate-600/40 rounded-full animate-bounce delay-500" />
      </div>

      {/* Content wrapper */}
      <div className="relative z-10">
        {title && (
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 mb-2 drop-shadow-lg">
              {title}
            </h2>
            {description && (
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed drop-shadow-md">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Form content */}
        <div className="space-y-4 sm:space-y-6">{children}</div>
      </div>

      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-300/20 to-transparent rounded-[inherit] animate-pulse" />
    </div>
  );
};

export default LiquidForm;
