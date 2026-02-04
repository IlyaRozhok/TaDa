import React from "react";
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import CopyableId from "./CopyableId";

interface Building {
  id: string;
  name: string;
  address: string;
  number_of_units: number;
  type_of_unit: string[];
  logo?: string;
  video?: string;
  photos?: string[];
  documents?: string;
  operator_id: string | null;
}

interface AdminBuildingsSectionProps {
  buildings: Building[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchLoading: boolean;
  sort: { field: string; direction: "asc" | "desc" };
  setSort: (sort: { field: string; direction: "asc" | "desc" }) => void;
  onView: (building: Building) => void;
  onEdit: (building: Building) => void;
  onDelete: (building: Building) => void;
  onAdd: () => void;
  onRefresh?: () => void;
  onCopyId?: (id: string, type: "building") => void;
}

const AdminBuildingsSection: React.FC<AdminBuildingsSectionProps> = ({
  buildings,
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
}) => {
  const SortButton = ({
    field,
    label,
    compact = false,
  }: {
    field: string;
    label: string;
    compact?: boolean;
  }) => {
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
          compact
            ? `text-xs ${
                isActive
                  ? "text-white/70 hover:text-white"
                  : "text-white/60 hover:text-white/90"
              }`
            : `${
                isActive
                  ? "text-white/70 hover:text-white"
                  : "text-white/70 hover:text-white"
              }`
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
            Buildings Management
          </h3>
          <p className="text-black">Manage building listings and details</p>
        </div>
        <button
          onClick={onAdd}
          className="px-6 py-2 bg-gray-900 cursor-pointer text-white hover:bg-gray-800 rounded-lg transition-all duration-200 font-medium flex items-center justify-center space-x-2"
        >
          <span>Add Building</span>
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                  Building ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                  Units
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                  Unit Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                  Media
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {buildings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Building2 className="w-12 h-12 text-black mb-4" />
                      <h3 className="text-lg font-medium text-black mb-2">
                        No buildings found
                      </h3>
                      <p className="text-black">
                        {searchTerm
                          ? "Try adjusting your search"
                          : "No buildings have been registered yet"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                buildings.map((building) => (
                  <tr
                    key={building.id}
                    onClick={() => onView(building)}
                    className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10">
                          {building.photos && building.photos.length > 0 ? (
                            <img
                              className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                              src={building.photos[0]}
                              alt={building.name}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-black" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-black">
                            {building.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <CopyableId
                        id={building.id}
                        maxLength={8}
                        onCopy={(id) => {
                          if (onCopyId) {
                            onCopyId(id, "building");
                          }
                        }}
                        className="text-sm font-medium text-black"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-black max-w-xs truncate">
                        {building.address}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-black border border-gray-200">
                        {building.number_of_units || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(building.type_of_unit) &&
                        building.type_of_unit.length > 0 ? (
                          building.type_of_unit.map((unit) => (
                            <span
                              key={unit}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-black border border-gray-200"
                            >
                              {unit}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                            -
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1">
                        {building.logo && (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-black">Logo</span>
                            <div className="w-6 h-6 rounded border border-gray-200 overflow-hidden">
                              <img
                                src={building.logo}
                                alt="Logo"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        )}
                        {building.photos && building.photos.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-black">
                              Photos({building.photos.length})
                            </span>
                            <div className="w-6 h-6 rounded border border-gray-200 overflow-hidden">
                              <img
                                src={building.photos[0]}
                                alt="Photo"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        )}
                        {building.video && (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-black">Video</span>
                            <div className="w-6 h-6 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                              <div className="w-3 h-3 bg-gray-300 rounded-sm"></div>
                            </div>
                          </div>
                        )}
                        {building.documents && (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-black">PDF</span>
                            <div className="w-6 h-6 bg-red-100 rounded border border-red-200 flex items-center justify-center">
                              <span className="text-xs font-bold text-red-600">
                                PDF
                              </span>
                            </div>
                          </div>
                        )}
                        {!building.logo &&
                          (!building.photos || building.photos.length === 0) &&
                          !building.video &&
                          !building.documents && (
                            <span className="text-xs text-black">No media</span>
                          )}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(building);
                          }}
                          className="p-1.5 text-gray-600 cursor-pointer hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors duration-150"
                          title="Edit building"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log(
                              "🗑️ Delete button clicked for building:",
                              building.id,
                              building.name,
                            );
                            onDelete(building);
                          }}
                          className="p-1.5 text-gray-600 cursor-pointer hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors duration-150"
                          title="Delete building"
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

        <div className="px-6 py-4 border-t border-gray-200">
          {/* Pagination component would go here */}
        </div>
      </div>
    </div>
  );
};

export default AdminBuildingsSection;
