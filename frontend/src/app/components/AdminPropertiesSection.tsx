import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Home,
  Edit,
  Trash2,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Property } from "../types/property";
import { GetPropertiesArgs } from "@/store/api/properties.api";
import { PROPERTY_TYPE_OPTIONS } from "@/constants/admin-form-options";
import CopyableId from "./CopyableId";

/**
 * The table's filter state, in the buckets the dropdown offers.
 * `propertyFiltersToQuery` turns it into the endpoint's query params.
 */
export interface PropertyFilters {
  /** Narrow to the properties flagged for the landings' listings section. */
  landingOnly: boolean;
  /** "" is any type; otherwise a `property_type` value. */
  propertyType: string;
  /** "" is any; "0"–"3" are exact counts, "4+" is open-ended. */
  beds: string;
  /** "" is any; "1"–"2" are exact counts, "3+" is open-ended. */
  baths: string;
}

export const EMPTY_PROPERTY_FILTERS: PropertyFilters = {
  landingOnly: false,
  propertyType: "",
  beds: "",
  baths: "",
};

const BED_OPTIONS = [
  { value: "", label: "Any" },
  { value: "0", label: "Studio" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4+", label: "4+" },
];

const BATH_OPTIONS = [
  { value: "", label: "Any" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3+", label: "3+" },
];

/** A bucket is either an exact count or, with a trailing "+", a lower bound. */
const roomBucket = (bucket: string): { exact?: number; min?: number } => {
  if (!bucket) return {};
  const count = Number.parseInt(bucket, 10);
  if (!Number.isFinite(count)) return {};
  return bucket.endsWith("+") ? { min: count } : { exact: count };
};

export const propertyFiltersToQuery = (
  filters: PropertyFilters,
): GetPropertiesArgs => {
  const beds = roomBucket(filters.beds);
  const baths = roomBucket(filters.baths);

  return {
    ...(filters.landingOnly ? { is_landing_listing: true } : {}),
    ...(filters.propertyType ? { property_type: filters.propertyType } : {}),
    ...(beds.exact !== undefined ? { bedrooms: beds.exact } : {}),
    ...(beds.min !== undefined ? { bedrooms_min: beds.min } : {}),
    ...(baths.exact !== undefined ? { bathrooms: baths.exact } : {}),
    ...(baths.min !== undefined ? { bathrooms_min: baths.min } : {}),
  };
};

const countActiveFilters = (filters: PropertyFilters): number =>
  (filters.landingOnly ? 1 : 0) +
  (filters.propertyType ? 1 : 0) +
  (filters.beds ? 1 : 0) +
  (filters.baths ? 1 : 0);

interface AdminPropertiesSectionProps {
  /** The current page's rows — the server has already narrowed them. */
  properties: Property[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchLoading: boolean;
  filters: PropertyFilters;
  onFiltersChange: (filters: PropertyFilters) => void;
  onView: (property: Property) => void;
  onEdit: (property: Property) => void;
  onDelete: (property: Property) => void;
  onAdd: () => void;
  onCopyId?: (id: string, type: "property" | "building") => void;
  /** Flags/unflags the property for the landings' listings section. */
  onToggleLanding: (property: Property, next: boolean) => void;
}

/** One labelled group of mutually exclusive chips inside the filter popover. */
const FilterChoice: React.FC<{
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}> = ({ label, value, options, onChange }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
      {label}
    </p>
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <button
          key={option.value || "any"}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={`px-2.5 py-1 rounded-md border text-xs font-medium cursor-pointer transition-colors ${
            value === option.value
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white text-black border-gray-200 hover:bg-gray-50"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>
);

const AdminPropertiesSection: React.FC<AdminPropertiesSectionProps> = ({
  properties,
  total,
  page,
  totalPages,
  onPageChange,
  searchTerm,
  onSearchChange,
  searchLoading,
  filters,
  onFiltersChange,
  onView,
  onEdit,
  onDelete,
  onAdd,
  onCopyId,
  onToggleLanding,
}) => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);
  const activeFilters = countActiveFilters(filters);

  // A click anywhere else closes the popover — it overlays the table, and the
  // row underneath must not swallow the click that dismissed it.
  useEffect(() => {
    if (!filtersOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!filtersRef.current?.contains(event.target as Node)) {
        setFiltersOpen(false);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFiltersOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [filtersOpen]);

  const pageButtons = useMemo(() => {
    const last = totalPages || 1;
    const pages: (number | "...")[] = [];

    if (last <= 7) {
      for (let i = 1; i <= last; i++) pages.push(i);
    } else if (page <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", last);
    } else if (page >= last - 3) {
      pages.push(1, "...", last - 4, last - 3, last - 2, last - 1, last);
    } else {
      pages.push(1, "...", page - 1, page, page + 1, "...", last);
    }

    return pages;
  }, [page, totalPages]);

  const isFiltered = activeFilters > 0 || searchTerm.trim().length > 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-black">
            Properties Management
          </h3>
          <p className="text-black">Manage apartment listings</p>
        </div>
        <button
          onClick={onAdd}
          data-testid="admin-add-property"
          className="px-6 py-2 bg-gray-900 cursor-pointer text-white hover:bg-gray-800 rounded-lg transition-all duration-200 font-medium"
        >
          Add Property
        </button>
      </div>

      <div className="flex items-start gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search title or description..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            data-testid="admin-property-search"
            className="w-full pl-9 pr-9 py-2 border border-gray-200 rounded-lg text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
          {searchLoading && (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
          )}
        </div>

        <div className="relative" ref={filtersRef}>
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
            data-testid="admin-property-filters"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer text-sm font-medium transition-colors ${
              activeFilters > 0
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-black border-gray-200 hover:bg-gray-50"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilters > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-xs">
                {activeFilters}
              </span>
            )}
          </button>

          {filtersOpen && (
            <div
              data-testid="admin-property-filters-panel"
              className="absolute right-0 z-20 mt-2 w-72 p-4 space-y-4 bg-white border border-gray-200 rounded-xl shadow-lg"
            >
              <FilterChoice
                label="Landing listing"
                value={filters.landingOnly ? "only" : ""}
                options={[
                  { value: "", label: "All" },
                  { value: "only", label: "Only landing listings" },
                ]}
                onChange={(value) =>
                  onFiltersChange({ ...filters, landingOnly: value === "only" })
                }
              />
              <FilterChoice
                label="Property type"
                value={filters.propertyType}
                options={[
                  { value: "", label: "All" },
                  ...PROPERTY_TYPE_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  })),
                ]}
                onChange={(value) =>
                  onFiltersChange({ ...filters, propertyType: value })
                }
              />
              <FilterChoice
                label="Beds"
                value={filters.beds}
                options={BED_OPTIONS}
                onChange={(value) =>
                  onFiltersChange({ ...filters, beds: value })
                }
              />
              <FilterChoice
                label="Baths"
                value={filters.baths}
                options={BATH_OPTIONS}
                onChange={(value) =>
                  onFiltersChange({ ...filters, baths: value })
                }
              />

              <button
                type="button"
                onClick={() => onFiltersChange(EMPTY_PROPERTY_FILTERS)}
                disabled={activeFilters === 0}
                className="w-full px-3 py-1.5 rounded-md border border-gray-200 text-sm text-black cursor-pointer hover:bg-gray-50 disabled:opacity-40 disabled:cursor-default transition-colors"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        <p className="ml-auto self-center text-sm text-gray-500">
          {total} {total === 1 ? "property" : "properties"}
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs font-semibold text-black uppercase tracking-wider">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Property ID</th>
                <th className="px-4 py-3">Building ID</th>
                <th className="px-4 py-3">Price (PCM)</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Beds/Baths</th>
                <th className="px-4 py-3">Available</th>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Landing</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {properties.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Home className="w-12 h-12 text-black mb-4" />
                      <h3 className="text-lg font-medium text-black mb-2">
                        No properties found
                      </h3>
                      <p className="text-black">
                        {isFiltered
                          ? "No properties match the current search and filters"
                          : "No properties have been registered yet"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                properties.map((property) => (
                  <tr
                    key={property.id}
                    data-testid="admin-property-row"
                    onClick={() => onView(property)}
                    className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                  >
                    {/* The one column with free-form text in it. Capped and
                        ellipsised so a long title cannot widen the table; the
                        full text stays available as the cell's tooltip. */}
                    <td className="px-4 py-3">
                      <div
                        className="max-w-[220px] truncate text-sm font-medium text-black"
                        title={property.title || undefined}
                      >
                        {property.title || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <CopyableId
                        id={property.id}
                        maxLength={8}
                        onCopy={(id) => {
                          if (onCopyId) {
                            onCopyId(id, "property");
                          }
                        }}
                        className="text-sm font-medium text-black"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <CopyableId
                        id={property.building_id || property.building?.id}
                        maxLength={8}
                        onCopy={(id) => {
                          if (onCopyId) {
                            onCopyId(id, "building");
                          }
                        }}
                        className="text-sm text-black"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-black whitespace-nowrap">
                        {property.price != null
                          ? `£${property.price.toLocaleString()}`
                          : "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-black border border-gray-200 whitespace-nowrap">
                        {property.property_type || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-black whitespace-nowrap">
                        {property.bedrooms ?? "-"} 🛏️ /{" "}
                        {property.bathrooms ?? "-"} 🚿
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-black whitespace-nowrap">
                        {property.available_from
                          ? new Date(
                              property.available_from,
                            ).toLocaleDateString()
                          : "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        // Get first image from media or fallback to photos array
                        let imageUrl = "";

                        if (property.media && property.media.length > 0) {
                          const featuredImage = property.media.find(
                            (item) => item.type === "image",
                          );
                          if (featuredImage) {
                            imageUrl = featuredImage.url;
                          } else {
                            const firstImage = property.media
                              .filter((item) => item.type === "image")
                              .sort((a, b) => a.order_index - b.order_index)[0];
                            if (firstImage) {
                              imageUrl = firstImage.url;
                            }
                          }
                        } else if (
                          property.photos &&
                          property.photos.length > 0
                        ) {
                          imageUrl = property.photos[0];
                        }

                        return imageUrl ? (
                          <img
                            className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                            src={imageUrl}
                            alt={property.title || property.id}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Home className="w-5 h-5 text-gray-400" />
                          </div>
                        );
                      })()}
                    </td>
                    {/* The row opens the view modal on click, so the checkbox
                        keeps its own click to itself. */}
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={!!property.is_landing_listing}
                        onChange={(e) =>
                          onToggleLanding(property, e.target.checked)
                        }
                        data-testid="admin-landing-toggle"
                        aria-label={`Feature "${
                          property.title || property.id
                        }" on the landing pages`}
                        className="w-4 h-4 cursor-pointer accent-gray-900"
                      />
                    </td>
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(
                              `/app/properties/${property.id}`,
                              "_blank",
                            );
                          }}
                          className="p-1.5 text-gray-600 cursor-pointer hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors duration-150"
                          title="Open public property page"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(property);
                          }}
                          className="p-1.5 text-gray-600 cursor-pointer hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors duration-150"
                          title="Edit property"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(property);
                          }}
                          className="p-1.5 text-gray-600 cursor-pointer hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors duration-150"
                          title="Delete property"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages || 1}
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              aria-label="Previous page"
              data-testid="admin-property-prev-page"
              className="p-1.5 rounded-md border border-gray-200 text-black cursor-pointer hover:bg-gray-50 disabled:opacity-40 disabled:cursor-default transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {pageButtons.map((entry, index) =>
              entry === "..." ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 py-1.5 text-sm text-gray-400 select-none"
                >
                  ...
                </span>
              ) : (
                <button
                  key={entry}
                  type="button"
                  onClick={() => onPageChange(entry)}
                  aria-current={entry === page ? "page" : undefined}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                    entry === page
                      ? "bg-gray-900 text-white"
                      : "text-black border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {entry}
                </button>
              ),
            )}

            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= (totalPages || 1)}
              aria-label="Next page"
              data-testid="admin-property-next-page"
              className="p-1.5 rounded-md border border-gray-200 text-black cursor-pointer hover:bg-gray-50 disabled:opacity-40 disabled:cursor-default transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPropertiesSection;
