import React, { useMemo, useState } from "react";
import {
  Home,
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronUp,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { Property } from "../types/property";
import CopyableId from "./CopyableId";

interface AdminPropertiesSectionProps {
  properties: Property[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchLoading: boolean;
  sort: { field: string; direction: "asc" | "desc" };
  setSort: (sort: { field: string; direction: "asc" | "desc" }) => void;
  onView: (property: Property) => void;
  onEdit: (property: Property) => void;
  onDelete: (property: Property) => void;
  onAdd: () => void;
  onCopyId?: (id: string, type: "property" | "building") => void;
  /** Flags/unflags the property for the landings' listings section. */
  onToggleLanding: (property: Property, next: boolean) => void;
}

const AdminPropertiesSection: React.FC<AdminPropertiesSectionProps> = ({
  properties,
  searchTerm,
  setSearchTerm,
  searchLoading,
  sort,
  setSort,
  onView,
  onEdit,
  onDelete,
  onAdd,
  onCopyId,
  onToggleLanding,
}) => {
  // Client-side: the admin list is already fully loaded, so narrowing it to the
  // flagged properties needs no round trip.
  const [landingOnly, setLandingOnly] = useState(false);
  const visibleProperties = useMemo(
    () =>
      landingOnly
        ? properties.filter((property) => property.is_landing_listing)
        : properties,
    [properties, landingOnly],
  );

  const SortButton = ({ field, label }: { field: string; label: string }) => {
    const isActive = sort.field === field;
    const isAsc = isActive && sort.direction === "asc";

    return (
      <button
        onClick={() =>
          setSort({
            field,
            direction: isActive && sort.direction === "asc" ? "desc" : "asc",
          })
        }
        className={`flex items-center gap-1 font-medium transition-colors duration-200 ${
          isActive
            ? "text-white/70 hover:text-white"
            : "text-white/70 hover:text-white"
        }`}
        title={
          isActive
            ? `Sorted by ${label} (${
                sort.direction === "asc" ? "ascending" : "descending"
              }). Click to reverse.`
            : `Sort by ${label}`
        }
      >
        {label}
        {isActive && (
          <span className="ml-1">
            {isAsc ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-black">
            Properties Management
          </h3>
          <p className="text-black">Manage apartment listings</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setLandingOnly((current) => !current)}
            aria-pressed={landingOnly}
            data-testid="admin-landing-filter"
            className={`px-4 py-2 cursor-pointer rounded-lg border transition-all duration-200 font-medium text-sm ${
              landingOnly
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-black border-gray-300 hover:bg-gray-50"
            }`}
            title="Show only properties featured on the landing pages"
          >
            Landing Listing
          </button>
          <button
            onClick={onAdd}
            data-testid="admin-add-property"
            className="px-6 py-2 bg-gray-900 cursor-pointer text-white hover:bg-gray-800 rounded-lg transition-all duration-200 font-medium flex items-center justify-center space-x-2"
          >
            <span>Add Property</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                  Property ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                  Building ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                  Price (PCM)
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                  Beds/Baths
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                  Available From
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                  Landing
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {visibleProperties.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Home className="w-12 h-12 text-black mb-4" />
                      <h3 className="text-lg font-medium text-black mb-2">
                        No properties found
                      </h3>
                      <p className="text-black">
                        {landingOnly
                          ? "No properties are featured on the landing pages yet"
                          : "No properties have been registered yet"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                visibleProperties.map((property) => (
                  <tr
                    key={property.id}
                    data-testid="admin-property-row"
                    onClick={() => onView(property)}
                    className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-black">
                        {property.title || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-black">
                        {property.price != null
                          ? `£${property.price.toLocaleString()}`
                          : "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-black border border-gray-200">
                        {property.property_type || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-black">
                        {property.bedrooms ?? "-"} 🛏️ /{" "}
                        {property.bathrooms ?? "-"} 🚿
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-black">
                        {property.available_from
                          ? new Date(
                              property.available_from,
                            ).toLocaleDateString()
                          : "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
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
                            className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                            src={imageUrl}
                            alt={property.title || property.id}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Home className="w-5 h-5 text-gray-400" />
                          </div>
                        );
                      })()}
                    </td>
                    {/* The row opens the view modal on click, so the checkbox
                        keeps its own click to itself. */}
                    <td
                      className="px-6 py-4"
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
                      className="px-6 py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/app/properties/${property.id}`, "_blank");
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
      </div>
    </div>
  );
};

export default AdminPropertiesSection;
