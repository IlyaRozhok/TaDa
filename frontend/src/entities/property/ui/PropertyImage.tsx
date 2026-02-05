import React, { useEffect, useState, useRef } from "react";
import FeaturedBadge from "@/shared/ui/Badge/FeaturedBadge";
import { Property } from "@/app/types";
import { PROPERTY_PLACEHOLDER } from "@/app/utils/placeholders";

interface PropertyImageProps {
  property: Property;
  imageLoaded: boolean;
  onImageLoad?: () => void;
  showFeaturedBadge?: boolean;
  matchScore?: number;
  matchCategories?: any[];
  isAuthenticated?: boolean;
}

export const PropertyImage: React.FC<PropertyImageProps> = ({
  property,
  imageLoaded,
  onImageLoad,
  showFeaturedBadge = false,
  matchScore,
  matchCategories,
  isAuthenticated = false,
}) => {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number; maxHeight: number } | null>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  const getMainImage = () => {
    if (property.media && property.media.length > 0) {
      const featuredImage = property.media?.[0];
      return featuredImage ? featuredImage.url : property.media[0].url;
    }
    if (property.images && property.images.length > 0) {
      return property.images[0];
    }
    if (property.photos && property.photos.length > 0) {
      return property.photos[0];
    }
    return PROPERTY_PLACEHOLDER;
  };

  const mainImageUrl = getMainImage();
  const displayImageUrl = imageSrc || mainImageUrl;

  useEffect(() => {
    // Reset states when property changes
    setImageSrc("");
    setIsLoaded(false);
    setHasError(false);
  }, [property.id]);

  // Update tooltip position on scroll
  useEffect(() => {
    if (!tooltipPosition) return;

    const updatePosition = () => {
      if (badgeRef.current) {
        const rect = badgeRef.current.getBoundingClientRect();
        const tooltipWidth = 280; // Reduced from 320px for more compact design
        const tooltipMaxHeight = 500; // Reduced from 600px
        const margin = 20; // Increased margin for better visibility
        const gap = 12;
        
        // Estimate header height (usually 60-80px, using 80px to be safe)
        const headerHeight = 80;
        const topMargin = Math.max(margin, headerHeight + 8); // Ensure tooltip is below header
        
        // Calculate available space
        const availableHeight = window.innerHeight - topMargin - margin;
        const availableWidth = window.innerWidth - margin * 2;
        
        // Use the same positioning logic as onMouseEnter
        const badgeCenterX = rect.left + rect.width / 2;
        const screenCenterX = window.innerWidth / 2;
        
        let left: number;
        let top = rect.top;
        
        // If badge is on the left side of screen, show tooltip to the right
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
        
        // Ensure tooltip stays within screen bounds (strict check)
        if (left < margin) {
          left = margin;
        }
        if (left + tooltipWidth > window.innerWidth - margin) {
          left = window.innerWidth - tooltipWidth - margin;
        }
        
        // Calculate available space below and above badge
        const spaceBelow = window.innerHeight - rect.bottom - gap - margin;
        const spaceAbove = rect.top - gap - topMargin; // Account for header
        
        // Prefer showing below badge if there's enough space
        if (spaceBelow >= Math.min(tooltipMaxHeight, availableHeight)) {
          top = rect.bottom + gap;
        } else if (spaceAbove >= Math.min(tooltipMaxHeight, availableHeight)) {
          // Show above badge if there's more space above (but ensure it's below header)
          top = Math.max(topMargin, rect.top - Math.min(tooltipMaxHeight, availableHeight) - gap);
        } else {
          // Use available space, prefer below
          if (spaceBelow > spaceAbove) {
            top = rect.bottom + gap;
          } else {
            top = Math.max(topMargin, rect.top - Math.min(tooltipMaxHeight, spaceAbove) - gap);
          }
        }
        
        // CRITICAL: Ensure tooltip doesn't go under header
        if (top < topMargin) {
          top = topMargin;
        }
        
        // Ensure tooltip doesn't go off bottom edge
        const maxTop = window.innerHeight - Math.min(tooltipMaxHeight, availableHeight) - margin;
        if (top > maxTop) {
          top = maxTop;
        }
        
        // Final check: ensure tooltip is always below header
        if (top < topMargin) {
          top = topMargin;
        }
        
        // Calculate dynamic max height based on available space
        const calculatedMaxHeight = Math.min(
          tooltipMaxHeight,
          window.innerHeight - top - margin
        );
        
        setTooltipPosition({ top, left, maxHeight: calculatedMaxHeight });
      }
    };

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [tooltipPosition]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    const currentSrc = target.src;

    // Only mark as loaded if it's a real image (not placeholder)
    if (
      currentSrc !== PROPERTY_PLACEHOLDER &&
      !currentSrc.includes("data:image/svg+xml") &&
      !currentSrc.includes("Property Image")
    ) {
      setIsLoaded(true);
      setHasError(false);
      // Store the successfully loaded image URL to prevent switching back to placeholder
      if (!imageSrc || imageSrc === PROPERTY_PLACEHOLDER) {
        setImageSrc(currentSrc);
      }
      if (onImageLoad) {
        onImageLoad();
      }
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    const currentSrc = target.src;

    // Never replace image if it was successfully loaded before
    if (isLoaded && imageSrc && imageSrc !== PROPERTY_PLACEHOLDER) {
      // Restore the successfully loaded image
      target.src = imageSrc;
      return;
    }

    // Only show placeholder if image hasn't been successfully loaded yet
    // and we're not trying to load placeholder itself
    if (
      !isLoaded &&
      currentSrc !== PROPERTY_PLACEHOLDER &&
      !currentSrc.includes("data:image/svg+xml") &&
      !currentSrc.includes("Property Image")
    ) {
      setHasError(true);
      // Prevent infinite loop - only set placeholder if not already set
      if (target.src !== PROPERTY_PLACEHOLDER) {
        target.src = PROPERTY_PLACEHOLDER;
      }
    }
    // Still call onImageLoad to hide skeleton even on error
    if (onImageLoad) {
      onImageLoad();
    }
  };

  return (
    <div className="relative h-48 bg-slate-100">
      {/* Featured Badge */}
      {showFeaturedBadge && <FeaturedBadge />}

      {/* Match Badge - Left Top */}
      {matchScore !== undefined && matchScore > 0 && (
        <div 
          ref={badgeRef}
          className="absolute top-3 left-4 z-10 group/match"
          onMouseEnter={() => {
            if (badgeRef.current) {
              const rect = badgeRef.current.getBoundingClientRect();
              const tooltipWidth = 280; // Reduced from 320px for more compact design
              const tooltipMaxHeight = 500; // Reduced from 600px
              const margin = 20; // Increased margin for better visibility
              const gap = 12;
              
              // Estimate header height (usually 60-80px, using 80px to be safe)
              const headerHeight = 80;
              const topMargin = Math.max(margin, headerHeight + 8); // Ensure tooltip is below header
              
              // Calculate available space
              const availableHeight = window.innerHeight - topMargin - margin;
              const availableWidth = window.innerWidth - margin * 2;
              
              // Determine best horizontal position based on badge position
              const badgeCenterX = rect.left + rect.width / 2;
              const screenCenterX = window.innerWidth / 2;
              
              let left: number;
              let top = rect.top;
              
              // If badge is on the left side of screen, show tooltip to the right
              if (badgeCenterX < screenCenterX) {
                left = rect.right + gap;
                // If not enough space on right, show to the left
                if (left + tooltipWidth > window.innerWidth - margin) {
                  left = rect.left - tooltipWidth - gap;
                }
              } else {
                // If badge is on the right side, show tooltip to the left
                left = rect.left - tooltipWidth - gap;
                // If not enough space on left, show to the right
                if (left < margin) {
                  left = rect.right + gap;
                }
              }
              
              // Ensure tooltip stays within screen bounds (strict check)
              if (left < margin) {
                left = margin;
              }
              if (left + tooltipWidth > window.innerWidth - margin) {
                left = window.innerWidth - tooltipWidth - margin;
              }
              
              // Calculate available space below and above badge
              const spaceBelow = window.innerHeight - rect.bottom - gap - margin;
              const spaceAbove = rect.top - gap - topMargin; // Account for header
              
              // Prefer showing below badge if there's enough space
              if (spaceBelow >= Math.min(tooltipMaxHeight, availableHeight)) {
                top = rect.bottom + gap;
              } else if (spaceAbove >= Math.min(tooltipMaxHeight, availableHeight)) {
                // Show above badge if there's more space above (but ensure it's below header)
                top = Math.max(topMargin, rect.top - Math.min(tooltipMaxHeight, availableHeight) - gap);
              } else {
                // Use available space, prefer below
                if (spaceBelow > spaceAbove) {
                  top = rect.bottom + gap;
                } else {
                  top = Math.max(topMargin, rect.top - Math.min(tooltipMaxHeight, spaceAbove) - gap);
                }
              }
              
              // CRITICAL: Ensure tooltip doesn't go under header
              if (top < topMargin) {
                top = topMargin;
              }
              
              // Ensure tooltip doesn't go off bottom edge
              const maxTop = window.innerHeight - Math.min(tooltipMaxHeight, availableHeight) - margin;
              if (top > maxTop) {
                top = maxTop;
              }
              
              // Final check: ensure tooltip is always below header
              if (top < topMargin) {
                top = topMargin;
              }
              
              // Calculate dynamic max height based on available space
              const calculatedMaxHeight = Math.min(
                tooltipMaxHeight,
                window.innerHeight - top - margin
              );
              
              setTooltipPosition({ top, left, maxHeight: calculatedMaxHeight });
            }
          }}
          onMouseLeave={() => {
            // Delay to allow moving mouse to tooltip
            setTimeout(() => {
              if (!badgeRef.current?.matches(':hover')) {
                setTooltipPosition(null);
              }
            }, 100);
          }}
        >
          <div
            className={`min-w-[100px] bg-black/60 backdrop-blur-[3px] text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg relative transition-all duration-200 cursor-pointer hover:bg-black/75 hover:shadow-xl`}
          >
            {Math.round(matchScore)}% Match
          </div>

          {/* Glassmorphism tooltip with match details */}
          {matchCategories && matchCategories.length > 0 && tooltipPosition ? (
            <div 
              className="fixed w-[280px] bg-black/70 backdrop-blur-md text-white rounded-lg shadow-2xl transition-all duration-200 pointer-events-auto z-[99999] border border-white/15 overflow-hidden"
              style={{
                top: `${tooltipPosition.top}px`,
                left: `${tooltipPosition.left}px`,
                maxHeight: `${tooltipPosition.maxHeight}px`,
              }}
              onMouseEnter={() => {
                // Keep tooltip visible when hovering over it
              }}
              onMouseLeave={() => {
                setTooltipPosition(null);
              }}
            >
              {/* Header */}
              <div className="px-3 py-2 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Match Breakdown</span>
                  <span className="text-base font-bold">{Math.round(matchScore)}%</span>
                </div>
              </div>
              
              {/* Scrollable content */}
              <div 
                className="overflow-y-auto px-3 pt-2 pb-3 space-y-2 custom-scrollbar"
                style={{
                  maxHeight: `${(tooltipPosition.maxHeight || 500) - 45}px`, // Subtract header height (reduced)
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
                }}
              >
                {matchCategories
                  .filter((cat) => cat.hasPreference && cat.maxScore > 0)
                  .map((cat) => {
                    const scorePercentage = cat.maxScore > 0 
                      ? Math.round((cat.score / cat.maxScore) * 100)
                      : 0;
                    return {
                      ...cat,
                      scorePercentage,
                      isMatch: scorePercentage >= 80,
                      isPartial: scorePercentage > 0 && scorePercentage < 80,
                    };
                  })
                  .sort((a, b) => {
                    // First: green (match) > yellow (partial) > grey (no match)
                    if (a.isMatch && !b.isMatch) return -1;
                    if (!a.isMatch && b.isMatch) return 1;
                    if (a.isPartial && !b.isPartial && !a.isMatch && !b.isMatch) return -1;
                    if (!a.isPartial && b.isPartial && !a.isMatch && !b.isMatch) return 1;
                    // Within same group: sort by maxScore (higher first)
                    return b.maxScore - a.maxScore;
                  })
                  .map((category, index) => {
                    const categoryName = category.category || category.name || 'Unknown';
                    const contribution = category.score;
                    const weight = category.maxScore;
                    const scorePercentage = category.scorePercentage;
                    const isMatch = category.isMatch;
                    const isPartial = category.isPartial;
                    
                    // Format category name
                    const formattedName = categoryName
                      .replace(/([A-Z])/g, ' $1')
                      .trim()
                      .split(' ')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                      .join(' ');
                    
                    // Check if this is the first item in a new group (for visual separators)
                    const prevCategory = index > 0 ? matchCategories
                      .filter((cat) => cat.hasPreference && cat.maxScore > 0)
                      .map((cat) => {
                        const scorePercentage = cat.maxScore > 0 
                          ? Math.round((cat.score / cat.maxScore) * 100)
                          : 0;
                        return {
                          ...cat,
                          scorePercentage,
                          isMatch: scorePercentage >= 80,
                          isPartial: scorePercentage > 0 && scorePercentage < 80,
                        };
                      })
                      .sort((a, b) => {
                        if (a.isMatch && !b.isMatch) return -1;
                        if (!a.isMatch && b.isMatch) return 1;
                        if (a.isPartial && !b.isPartial && !a.isMatch && !b.isMatch) return -1;
                        if (!a.isPartial && b.isPartial && !a.isMatch && !b.isMatch) return 1;
                        return b.maxScore - a.maxScore;
                      })[index - 1] : null;
                    
                    const showGroupSeparator = prevCategory && (
                      (prevCategory.isMatch && !isMatch) ||
                      (prevCategory.isPartial && !isPartial && !isMatch)
                    );
                    
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
                            <span className={`font-bold tabular-nums flex-shrink-0 ${
                              isMatch ? 'text-emerald-300' : 
                              isPartial ? 'text-amber-300' : 
                              'text-white/40'
                            }`}>
                              +{contribution.toFixed(1)}/{weight}
                            </span>
                          </div>
                          <div className="relative h-1 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className={`absolute left-0 top-0 h-full rounded-full transition-all duration-300 ${
                                isMatch ? 'bg-emerald-400/70' : 
                                isPartial ? 'bg-amber-400/70' : 
                                'bg-white/20'
                              }`}
                              style={{ width: `${scorePercentage}%` }}
                            />
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                {/* Extra spacing at the bottom to prevent cutoff */}
                <div className="h-1" />
              </div>
            </div>
          ) : null}
        </div>
      )}

      <img
        src={hasError && !isLoaded ? PROPERTY_PLACEHOLDER : displayImageUrl}
        alt={property.title}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          imageLoaded || isLoaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />

      {/* Loading overlay when image is not loaded */}
      {!imageLoaded && !isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_200%] animate-[shimmer_2s_infinite]">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[slideIn_1.5s_infinite]"></div>
        </div>
      )}
    </div>
  );
};
