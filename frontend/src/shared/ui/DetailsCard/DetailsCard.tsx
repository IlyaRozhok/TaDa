import React from "react";
import { cn } from "@/app/lib/utils";

export interface DetailsCardItem {
  label: string;
  value: React.ReactNode;
}

export interface DetailsCardProps {
  /** Section title, e.g. "Details" */
  title?: string;
  /** List of label/value pairs */
  items: DetailsCardItem[];
  /** Show vertical dividers between items (property page style) */
  showDividers?: boolean;
  /** Tailwind grid classes for the items row, e.g. "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" */
  gridClassName?: string;
  /** Title size: "large" (property) or "compact" (building) */
  titleSize?: "large" | "compact";
  /** Center labels/values (property); left-aligned (building) */
  align?: "left" | "center";
  className?: string;
}

const defaultGridClass =
  "grid-cols-2 sm:grid-cols-[repeat(3,minmax(5.5rem,1fr))] lg:grid-cols-[repeat(6,minmax(5.5rem,1fr))]";

export function DetailsCard({
  title = "Details",
  items,
  showDividers = false,
  gridClassName = defaultGridClass,
  titleSize = "large",
  align = "left",
  className,
}: DetailsCardProps): React.ReactElement {
  return (
    <div className={className}>
      {title && (
        <h2
          className={cn(
            "font-semibold text-gray-900",
            titleSize === "large" && "text-xl sm:text-2xl mb-3 sm:mb-6",
            titleSize === "compact" && "text-base sm:text-lg mb-3"
          )}
        >
          {title}
        </h2>
      )}
      <div className="bg-gray-50 rounded-xl sm:rounded-2xl py-3 px-3 sm:py-4 sm:px-4">
        <div className={cn("grid gap-x-3 gap-y-4 sm:gap-6", gridClassName)}>
          {items.map((item, index) => (
            <div
              key={item.label}
              className={cn(
                showDividers &&
                  index > 0 &&
                  "flex items-center gap-2 sm:gap-4 pl-0 sm:pl-6 min-w-[5rem] sm:min-w-0"
              )}
            >
              {showDividers && index > 0 && (
                <div className="hidden sm:block h-8 w-px bg-gray-200 flex-shrink-0" />
              )}
              <div
                className={cn(
                  "flex flex-col min-w-0 py-1",
                  showDividers && "flex-1",
                  align === "center" && "items-center justify-center text-center"
                )}
              >
                <p className="text-xs sm:text-sm text-gray-500 sm:whitespace-nowrap mb-0.5 sm:mb-1">
                  {item.label}
                </p>
                <p
                  className={cn(
                    "text-sm sm:text-base font-semibold text-gray-900 break-words text-black",
                    align === "left" && "truncate"
                  )}
                >
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
