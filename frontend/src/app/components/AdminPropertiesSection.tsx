import React from "react";
import {
  Home,
  Plus,
  Eye,
  Edit,
  Trash2,
  Search,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Property } from "../types/property";

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
}) => {
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
            ? "text-blue-600 hover:text-blue-700"
            : "text-slate-600 hover:text-slate-900"
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
          <h3 className="text-2xl font-semibold text-slate-900">
            Properties Management
          </h3>
          <p className="text-slate-600">Manage apartment listings</p>
        </div>
        <button
          onClick={onAdd}
          className="px-6 py-3 bg-gradient-to-br from-slate-800 to-slate-900 hover:from-violet-500 hover:to-pink-600 text-white rounded-lg shadow-sm transition-all duration-200 font-medium flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-slate-900/10 focus:outline-none focus:ring-2 focus:ring-slate-400/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Property</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search properties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-black"
                />
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  <SortButton field="apartment_number" label="Apartment" />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Building
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  <SortButton field="price" label="Price (PCM)" />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Beds/Baths
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Available From
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {properties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Home className="w-12 h-12 text-slate-300 mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">
                        No properties found
                      </h3>
                      <p className="text-slate-600">
                        {searchTerm
                          ? "Try adjusting your search"
                          : "No properties have been registered yet"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                properties.map((property) => (
                  <tr
                    key={property.id}
                    className="hover:bg-slate-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10">
                          {property.photos && property.photos.length > 0 ? (
                            <img
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                              src={property.photos[0]}
                              alt={property.apartment_number}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center">
                              <Home className="w-5 h-5 text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">
                            {property.apartment_number}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900">
                        {property.building?.name || "N/A"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {property.building?.address}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-900">
                        {property.price != null
                          ? `£${property.price.toLocaleString()}`
                          : "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {property.property_type || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-900">
                        {property.bedrooms ?? "-"}🛏️ /{" "}
                        {property.bathrooms ?? "-"}🚿
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {property.available_from
                          ? new Date(
                              property.available_from
                            ).toLocaleDateString()
                          : "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onView(property)}
                          className="p-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-md transition-colors duration-150"
                          title="View property"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(property)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-150"
                          title="Edit property"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(property)}
                          className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors duration-150"
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
