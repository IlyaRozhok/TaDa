"use client";

import Image from "next/image";
import { cn } from "../lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-20 h-20",
};

export default function Logo({ size = "md", className, onClick }: LogoProps) {
  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden border-2 border-white shadow-lg bg-white cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-xl",
        sizeClasses[size],
        className
      )}
      onClick={onClick}
    >
      <Image
        src="/key-crown.jpg"
        alt="TaDa Logo"
        fill
        className="object-cover"
        priority
      />
    </div>
  );
}

// Alternative version with background color
export function LogoWithBackground({
  size = "md",
  className,
  onClick,
}: LogoProps) {
  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden border-2 border-slate-200 shadow-lg bg-gradient-to-br from-slate-100 to-slate-200 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-xl",
        sizeClasses[size],
        className
      )}
      onClick={onClick}
    >
      <Image
        src="/key-crown.jpg"
        alt="TaDa Logo"
        fill
        className="object-cover opacity-90"
        priority
      />
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
        "relative rounded-full overflow-hidden border border-slate-300 shadow-sm",
        sizeClasses[size],
        className
      )}
    >
      <Image
        src="/key-crown.jpg"
        alt="TaDa Logo"
        fill
        className="object-cover"
        priority
      />
    </div>
  );
}
