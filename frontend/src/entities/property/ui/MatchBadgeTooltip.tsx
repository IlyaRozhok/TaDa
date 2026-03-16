import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface MatchCategory {
  category?: string;
  name?: string;
  score: number;
  maxScore: number;
  hasPreference?: boolean;
}

interface MatchBadgeTooltipProps {
  matchScore?: number;
  matchCategories?: MatchCategory[];
}

export const MatchBadgeTooltip: React.FC<MatchBadgeTooltipProps> = ({
  matchScore,
  matchCategories,
}) => {
  const [tooltipPosition, setTooltipPosition] = useState<{
    top: number;
    left: number;
    maxHeight: number;
  } | null>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tooltipPosition) return;

    const updatePosition = () => {
      if (!badgeRef.current) {
        return;
      }

      const rect = badgeRef.current.getBoundingClientRect();
      const tooltipWidth = 280;
      const tooltipMaxHeight = 500;
      const margin = 20;
      const gap = 12;

      const headerHeight = 80;
      const topMargin = Math.max(margin, headerHeight + 8);

      const availableHeight = window.innerHeight - topMargin - margin;

      const badgeCenterX = rect.left + rect.width / 2;
      const screenCenterX = window.innerWidth / 2;

      let left: number;
      let top = rect.top;

      if (badgeCenterX < screenCenterX) {
        left = rect.right + gap;
        if (left + tooltipWidth > window.innerWidth - margin) {
          left = rect.left - tooltipWidth - gap;
        }
      } else {
        left = rect.left - tooltipWidth - gap;
        if (left < margin) {
          left = rect.right + gap;
        }
      }

      if (left < margin) {
        left = margin;
      }
      if (left + tooltipWidth > window.innerWidth - margin) {
        left = window.innerWidth - tooltipWidth - margin;
      }

      const spaceBelow = window.innerHeight - rect.bottom - gap - margin;
      const spaceAbove = rect.top - gap - topMargin;

      if (spaceBelow >= Math.min(tooltipMaxHeight, availableHeight)) {
        top = rect.bottom + gap;
      } else if (spaceAbove >= Math.min(tooltipMaxHeight, availableHeight)) {
        top = Math.max(
          topMargin,
          rect.top - Math.min(tooltipMaxHeight, availableHeight) - gap,
        );
      } else if (spaceBelow > spaceAbove) {
        top = rect.bottom + gap;
      } else {
        top = Math.max(
          topMargin,
          rect.top - Math.min(tooltipMaxHeight, spaceAbove) - gap,
        );
      }

      if (top < topMargin) {
        top = topMargin;
      }

      const maxTop =
        window.innerHeight - Math.min(tooltipMaxHeight, availableHeight) - margin;
      if (top > maxTop) {
        top = maxTop;
      }

      if (top < topMargin) {
        top = topMargin;
      }

      const calculatedMaxHeight = Math.min(
        tooltipMaxHeight,
        window.innerHeight - top - margin,
      );

      setTooltipPosition({ top, left, maxHeight: calculatedMaxHeight });
    };

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [tooltipPosition]);

  if (matchScore === undefined) {
    return null;
  }

  const handleMouseEnter = () => {
    if (!badgeRef.current) {
      return;
    }

    const rect = badgeRef.current.getBoundingClientRect();
    const tooltipWidth = 280;
    const tooltipMaxHeight = 500;
    const margin = 20;
    const gap = 12;

    const headerHeight = 80;
    const topMargin = Math.max(margin, headerHeight + 8);

    const availableHeight = window.innerHeight - topMargin - margin;

    const badgeCenterX = rect.left + rect.width / 2;
    const screenCenterX = window.innerWidth / 2;

    let left: number;
    let top = rect.top;

    if (badgeCenterX < screenCenterX) {
      left = rect.right + gap;
      if (left + tooltipWidth > window.innerWidth - margin) {
        left = rect.left - tooltipWidth - gap;
      }
    } else {
      left = rect.left - tooltipWidth - gap;
      if (left < margin) {
        left = rect.right + gap;
      }
    }

    if (left < margin) {
      left = margin;
    }
    if (left + tooltipWidth > window.innerWidth - margin) {
      left = window.innerWidth - tooltipWidth - margin;
    }

    const spaceBelow = window.innerHeight - rect.bottom - gap - margin;
    const spaceAbove = rect.top - gap - topMargin;

    if (spaceBelow >= Math.min(tooltipMaxHeight, availableHeight)) {
      top = rect.bottom + gap;
    } else if (spaceAbove >= Math.min(tooltipMaxHeight, availableHeight)) {
      top = Math.max(
        topMargin,
        rect.top - Math.min(tooltipMaxHeight, availableHeight) - gap,
      );
    } else if (spaceBelow > spaceAbove) {
      top = rect.bottom + gap;
    } else {
      top = Math.max(
        topMargin,
        rect.top - Math.min(tooltipMaxHeight, spaceAbove) - gap,
      );
    }

    if (top < topMargin) {
      top = topMargin;
    }

    const maxTop =
      window.innerHeight - Math.min(tooltipMaxHeight, availableHeight) - margin;
    if (top > maxTop) {
      top = maxTop;
    }

    if (top < topMargin) {
      top = topMargin;
    }

    const calculatedMaxHeight = Math.min(
      tooltipMaxHeight,
      window.innerHeight - top - margin,
    );

    setTooltipPosition({ top, left, maxHeight: calculatedMaxHeight });
  };

  const handleMouseLeave = () => {
    setTimeout(() => {
      if (!badgeRef.current?.matches(":hover")) {
        setTooltipPosition(null);
      }
    }, 100);
  };

  const hasCategories =
    matchCategories && matchCategories.filter((c) => c.maxScore > 0).length > 0;

  return (
    <div
      ref={badgeRef}
      className="absolute top-3 left-4 z-10"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="min-w-[100px] bg-black/60 backdrop-blur-[3px] text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg relative transition-all duration-200 cursor-pointer hover:bg-black/75 hover:shadow-xl">
        {Math.round(matchScore)}% Match
      </div>

      {hasCategories &&
      tooltipPosition &&
      typeof document !== "undefined" &&
      matchCategories ? (
        createPortal(
          <div
            className="fixed w-[280px] bg-black/70 backdrop-blur-md text-white rounded-lg shadow-2xl transition-all duration-200 pointer-events-auto z-[99999] border border-white/15 overflow-hidden"
            style={{
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              maxHeight: `${tooltipPosition.maxHeight}px`,
            }}
          >
            <div className="px-3 py-2 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Match Breakdown</span>
                <span className="text-base font-bold">
                  {Math.round(matchScore)}%
                </span>
              </div>
            </div>

            <div
              className="overflow-y-auto px-3 pt-2 pb-3 space-y-2 custom-scrollbar"
              style={{
                maxHeight: `${(tooltipPosition.maxHeight || 500) - 45}px`,
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(255, 255, 255, 0.2) transparent",
              }}
            >
              {matchCategories
                .filter((cat) => cat.hasPreference && cat.maxScore > 0)
                .map((cat) => {
                  const scorePercentage =
                    cat.maxScore > 0
                      ? Math.round((cat.score / cat.maxScore) * 100)
                      : 0;
                  const isMatch = scorePercentage >= 80;
                  const isPartial =
                    scorePercentage > 0 && scorePercentage < 80;
                  return {
                    ...cat,
                    scorePercentage,
                    isMatch,
                    isPartial,
                  };
                })
                .sort((a, b) => {
                  if (a.isMatch && !b.isMatch) return -1;
                  if (!a.isMatch && b.isMatch) return 1;
                  if (
                    a.isPartial &&
                    !b.isPartial &&
                    !a.isMatch &&
                    !b.isMatch
                  ) {
                    return -1;
                  }
                  if (
                    !a.isPartial &&
                    b.isPartial &&
                    !a.isMatch &&
                    !b.isMatch
                  ) {
                    return 1;
                  }
                  return b.maxScore - a.maxScore;
                })
                .map((category, index, sortedCategories) => {
                  const categoryName =
                    category.category || category.name || "Unknown";
                  const contribution = category.score;
                  const weight = category.maxScore;
                  const scorePercentage = category.scorePercentage;
                  const isMatch = category.isMatch;
                  const isPartial = category.isPartial;

                  const formattedName = categoryName
                    .replace(/([A-Z])/g, " $1")
                    .trim()
                    .split(" ")
                    .map(
                      (word) =>
                        word.charAt(0).toUpperCase() +
                        word.slice(1).toLowerCase(),
                    )
                    .join(" ");

                  const prevCategory =
                    index > 0 ? sortedCategories[index - 1] : null;

                  const showGroupSeparator =
                    prevCategory &&
                    ((prevCategory.isMatch && !isMatch) ||
                      (prevCategory.isPartial && !isPartial && !isMatch));

                  return (
                    <React.Fragment key={index}>
                      {showGroupSeparator && (
                        <div className="pt-2 mt-2 -mx-3 px-3 border-t border-white/10" />
                      )}
                      <div className="group/item">
                        <div className="flex items-center justify-between text-[11px] mb-0.5">
                          <span className="text-white/80 font-medium truncate pr-2">
                            {formattedName}
                          </span>
                          <span
                            className={`font-bold tabular-nums flex-shrink-0 ${
                              isMatch
                                ? "text-emerald-300"
                                : isPartial
                                  ? "text-amber-300"
                                  : "text-white/40"
                            }`}
                          >
                            +{contribution.toFixed(1)}/{weight}
                          </span>
                        </div>
                        <div className="relative h-1 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`absolute left-0 top-0 h-full rounded-full transition-all duration-300 ${
                              isMatch
                                ? "bg-emerald-400/70"
                                : isPartial
                                  ? "bg-amber-400/70"
                                  : "bg-white/20"
                            }`}
                            style={{ width: `${scorePercentage}%` }}
                          />
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              <div className="h-1" />
            </div>
          </div>,
          document.body,
        )
      ) : null}
    </div>
  );
};

