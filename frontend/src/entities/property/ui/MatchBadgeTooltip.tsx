import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "@/app/hooks/useTranslation";
import { listingPropertyKeys } from "@/app/lib/translationsKeys/listingPropertyTranslationKeys";
import {
  PoundSterling,
  MapPin,
  Bed,
  Home,
  Calendar,
  Sparkles,
  Briefcase,
  Users,
  Baby,
  Bath,
  Building,
  Clock,
  Maximize,
  Sofa,
  Cigarette,
  PawPrint,
  Receipt,
} from "lucide-react";

interface MatchCategory {
  category?: string;
  name?: string;
  score: number;
  maxScore: number;
  hasPreference?: boolean;
}

interface MatchBadgeTooltipProps {
  /** When undefined and not loading, the badge is hidden (e.g. property cards without match data). */
  matchScore?: number | null;
  matchCategories?: MatchCategory[];
  /** When true, shows a placeholder until match data is available (property detail page). */
  loading?: boolean;
}

export const MatchBadgeTooltip: React.FC<MatchBadgeTooltipProps> = ({
  matchScore,
  matchCategories,
  loading = false,
}) => {
  const { t } = useTranslation();
  const [tooltipPosition, setTooltipPosition] = useState<{
    top: number;
    left: number;
    maxHeight: number;
    width: number;
  } | null>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tooltipPosition) return;

    const updatePosition = () => {
      if (!badgeRef.current) {
        return;
      }

      const rect = badgeRef.current.getBoundingClientRect();
      // Responsive tooltip width based on screen size
      const tooltipWidth =
        window.innerWidth < 640 ? Math.min(320, window.innerWidth - 40) : 320;
      const tooltipMaxHeight =
        window.innerHeight < 800
          ? Math.min(600, window.innerHeight * 0.7)
          : 600;
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
        window.innerHeight -
        Math.min(tooltipMaxHeight, availableHeight) -
        margin;
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

      setTooltipPosition({
        top,
        left,
        maxHeight: calculatedMaxHeight,
        width: tooltipWidth,
      });
    };

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [tooltipPosition]);

  if (matchScore === undefined && !loading) {
    return null;
  }

  const handleMouseEnter = () => {
    if (loading || matchScore === null || matchScore === undefined) {
      return;
    }
    if (!badgeRef.current) {
      return;
    }

    const rect = badgeRef.current.getBoundingClientRect();
    // Responsive tooltip width based on screen size
    const tooltipWidth =
      window.innerWidth < 640 ? Math.min(320, window.innerWidth - 40) : 320;
    const tooltipMaxHeight =
      window.innerHeight < 800 ? Math.min(900, window.innerHeight * 0.9) : 900;
    const margin = 10;
    const gap = 6;

    const headerHeight = 50;
    const topMargin = Math.max(margin, headerHeight + 6);

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

    setTooltipPosition({
      top,
      left,
      maxHeight: calculatedMaxHeight,
      width: tooltipWidth,
    });
  };

  const handleMouseLeave = () => {
    setTimeout(() => {
      if (!badgeRef.current?.matches(":hover")) {
        setTooltipPosition(null);
      }
    }, 100);
  };

  const hasCategories =
    !loading &&
    matchScore !== null &&
    matchScore !== undefined &&
    matchCategories &&
    matchCategories.filter((c) => c.maxScore > 0).length > 0;

  const badgeLabel = loading
    ? "Calculating..."
    : matchScore === null || matchScore === undefined
      ? "—"
      : `${Math.round(matchScore)}% ${t(listingPropertyKeys.card.match)}`;

  return (
    <div
      ref={badgeRef}
      className="absolute top-3 left-4 z-10"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`min-w-[100px] bg-black/60 backdrop-blur-[3px] text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg relative transition-all duration-200 ${
          loading
            ? "cursor-wait animate-pulse"
            : matchScore === null
              ? "cursor-default opacity-90"
              : "cursor-pointer hover:bg-black/75 hover:shadow-xl"
        }`}
        aria-busy={loading}
        aria-live="polite"
      >
        {badgeLabel}
      </div>

      {hasCategories &&
      tooltipPosition &&
      typeof document !== "undefined" &&
      matchCategories
        ? createPortal(
            <div
              className="fixed bg-black/75 backdrop-blur-md text-white rounded-lg shadow-2xl transition-all duration-200 pointer-events-auto z-[99999] border border-white/15 overflow-hidden"
              style={{
                top: `${tooltipPosition.top}px`,
                left: `${tooltipPosition.left}px`,
                maxHeight: `${tooltipPosition.maxHeight}px`,
                width: `${tooltipPosition.width}px`,
              }}
            >
              <div className="px-4 py-3 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">
                    {t("matching.title.name")}
                  </span>
                  <span className="text-base font-bold">
                    {Math.round(matchScore)}%
                  </span>
                </div>
              </div>

              <div
                className="overflow-y-auto px-4 pt-3 pb-4 space-y-3 custom-scrollbar"
                style={{
                  maxHeight: `${(tooltipPosition.maxHeight || 600) - 55}px`,
                  scrollbarWidth: "thin",
                  scrollbarColor: "rgba(255, 255, 255, 0.3) transparent",
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
                    // Priority order for better UX - most important categories first
                    const priorityOrder = [
                      "budget",
                      "location",
                      "bedrooms",
                      "propertyType",
                      "availability",
                      "amenities",
                      "occupation",
                      "familyStatus",
                      "children",
                      "bathrooms",
                      "buildingStyle",
                      "duration",
                      "squareMeters",
                      "furnishing",
                      "smoking",
                      "pets",
                      "bills",
                    ];

                    const aPriority = priorityOrder.indexOf(
                      a.category || a.name || "",
                    );
                    const bPriority = priorityOrder.indexOf(
                      b.category || b.name || "",
                    );

                    // First sort by match status
                    if (a.isMatch && !b.isMatch) return -1;
                    if (!a.isMatch && b.isMatch) return 1;

                    // Then by partial match status
                    if (a.isPartial && !b.isPartial && !a.isMatch && !b.isMatch)
                      return -1;
                    if (!a.isPartial && b.isPartial && !a.isMatch && !b.isMatch)
                      return 1;

                    // Finally by priority order, then by weight
                    if (aPriority !== -1 && bPriority !== -1) {
                      return aPriority - bPriority;
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

                    // Enhanced category name formatting and icons for new lifestyle categories
                    const categoryNameMap: { [key: string]: string } = {
                      occupation: t("wizard.step8.title"),
                      familyStatus: t("matching.family.status.title"),
                      children: t("matching.сhildren.title"),
                      propertyType: t("wizard.step3.des.text1"),
                      buildingStyle: t("wizard.step4.des.text1"),
                      squareMeters: t("matching.square.feet.title"),
                      budget: t("matching.budget.title"),
                      location: t("preferences.location"),
                      bedrooms: t("matching.bedrooms.name"),
                      bathrooms: t("wizard.step3.des.text3"),
                      availability: t("matching.availability.title"),
                      amenities: t("wizard.step7.title"),
                      duration: t("wizard.step4.des.text2"),
                      furnishing: t("wizard.step3.des.text4"),
                      smoking: "Smoking",
                      pets: t("wizard.step7.des.text4"),
                      bills: t("wizard.step4.des.text3"),
                    };

                    const categoryIconMap: { [key: string]: React.ReactNode } =
                      {
                        occupation: <Briefcase className="w-3 h-3" />,
                        familyStatus: <Users className="w-3 h-3" />,
                        children: <Baby className="w-3 h-3" />,
                        propertyType: <Home className="w-3 h-3" />,
                        buildingStyle: <Building className="w-3 h-3" />,
                        squareMeters: <Maximize className="w-3 h-3" />,
                        budget: <PoundSterling className="w-3 h-3" />,
                        location: <MapPin className="w-3 h-3" />,
                        bedrooms: <Bed className="w-3 h-3" />,
                        bathrooms: <Bath className="w-3 h-3" />,
                        availability: <Calendar className="w-3 h-3" />,
                        amenities: <Sparkles className="w-3 h-3" />,
                        duration: <Clock className="w-3 h-3" />,
                        furnishing: <Sofa className="w-3 h-3" />,
                        smoking: <Cigarette className="w-3 h-3" />,
                        pets: <PawPrint className="w-3 h-3" />,
                        bills: <Receipt className="w-3 h-3" />,
                      };

                    const formattedName =
                      categoryNameMap[categoryName] ||
                      categoryName
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

                    // Enhanced group separation logic
                    const showGroupSeparator =
                      prevCategory &&
                      ((prevCategory.isMatch && !isMatch) ||
                        (prevCategory.isPartial && !isPartial && !isMatch) ||
                        // Add separator after core categories (budget, location, bedrooms, propertyType)
                        (index === 4 && sortedCategories.length > 6));

                    return (
                      <React.Fragment key={index}>
                        {showGroupSeparator && (
                          <div className="pt-3 mt-3 -mx-4 px-4 border-t border-white/10" />
                        )}
                        <div className="group/item">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <div className="flex items-center gap-2 truncate pr-3">
                              <span
                                className={`flex-shrink-0 ${
                                  isMatch
                                    ? "text-emerald-300"
                                    : isPartial
                                      ? "text-amber-300"
                                      : "text-white/50"
                                }`}
                              >
                                {categoryIconMap[categoryName] || (
                                  <Home className="w-3 h-3" />
                                )}
                              </span>
                              <span className="text-white/90 font-medium truncate">
                                {formattedName}
                              </span>
                            </div>
                            <span
                              className={`font-bold tabular-nums flex-shrink-0 text-xs ${
                                isMatch
                                  ? "text-emerald-300"
                                  : isPartial
                                    ? "text-amber-300"
                                    : "text-white/50"
                              }`}
                            >
                              +{contribution.toFixed(1)}/{weight}
                            </span>
                          </div>
                          <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`absolute left-0 top-0 h-full rounded-full transition-all duration-300 ${
                                isMatch
                                  ? "bg-emerald-400/80"
                                  : isPartial
                                    ? "bg-amber-400/80"
                                    : "bg-white/25"
                              }`}
                              style={{ width: `${scorePercentage}%` }}
                            />
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                <div className="h-2" />
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
};
