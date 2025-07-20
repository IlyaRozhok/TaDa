"use client";

import Image from "next/image";
import { cn } from "../lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  sm: "w-10 h-10 text-sm",
  md: "w-12 h-12 text-base",
  lg: "w-16 h-16 text-lg",
  xl: "w-20 h-20 text-xl",
};

export default function Logo({ size = "md", className, onClick }: LogoProps) {
  const sizeConfig = sizeClasses[size].split(' ');
  const textSizeClass = sizeConfig.find(cls => cls.startsWith('text-')) || 'text-base';
  const dimensionClasses = sizeConfig.filter(cls => !cls.startsWith('text-')).join(' ');
  
  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden border-2 border-white shadow-lg bg-black cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-xl flex items-center justify-center",
        dimensionClasses,
        className
      )}
      onClick={onClick}
    >
      <span className={cn("text-white font-bold", textSizeClass)}>TD</span>
    </div>
  );
}

// Alternative version with background color
export function LogoWithBackground({
  size = "md",
  className,
  onClick,
}: LogoProps) {
  const sizeConfig = sizeClasses[size].split(' ');
  const textSizeClass = sizeConfig.find(cls => cls.startsWith('text-')) || 'text-base';
  const dimensionClasses = sizeConfig.filter(cls => !cls.startsWith('text-')).join(' ');

  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden border-2 border-slate-200 shadow-lg bg-black cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-xl flex items-center justify-center",
        dimensionClasses,
        className
      )}
      onClick={onClick}
    >
      <span className={cn("text-white font-bold", textSizeClass)}>TD</span>
    </div>
  );
}

// Simple version without hover effects
export function SimpleRoundLogo({
  size = "md",
  className,
}: Omit<LogoProps, "onClick">) {
  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden border border-slate-300 shadow-sm bg-black flex items-center justify-center",
        sizeClasses[size],
        className
      )}
    >
      <span className="text-white font-bold text-xs">TD</span>
    </div>
  );
}
