"use client";

import { ReactNode } from "react";
import { cn } from "@/app/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "form" | "modal" | "subtle";
  blur?: "sm" | "md" | "lg" | "xl";
  opacity?: "low" | "medium" | "high";
}

export const GlassCard = ({
  children,
  className,
  variant = "default",
  blur = "md",
  opacity = "medium",
}: GlassCardProps) => {
  const baseClasses =
    "relative overflow-hidden transition-all duration-300 ease-in-out";

  const variants = {
    default:
      "bg-white/20 backdrop-blur-md border border-white/20 rounded-xl shadow-xl",
    form: "bg-white/10 backdrop-blur-lg border border-white/30 rounded-2xl shadow-2xl hover:shadow-3xl",
    modal:
      "bg-white/15 backdrop-blur-xl border border-white/25 rounded-3xl shadow-3xl",
    subtle:
      "bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg",
  };

  const blurClasses = {
    sm: "backdrop-blur-sm",
    md: "backdrop-blur-md",
    lg: "backdrop-blur-lg",
    xl: "backdrop-blur-xl",
  };

  const opacityClasses = {
    low: "bg-white/5",
    medium: "bg-white/10",
    high: "bg-white/20",
  };

  return (
    <div className={cn(baseClasses, variants[variant], className)}>
      {/* Gradient overlay for extra depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 pointer-events-none" />

      {/* Animated border glow */}
      <div className="absolute inset-0 rounded-[inherit] border border-white/20 animate-pulse opacity-50" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default GlassCard;
