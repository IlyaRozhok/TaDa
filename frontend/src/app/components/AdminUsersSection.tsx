import React from "react";
import {
  Users,
  Plus,
  Eye,
  Edit,
  Trash2,
  Search,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  status: string;
  created_at: string;
}

interface AdminUsersSectionProps {
  users: User[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchLoading: boolean;
  sort: { field: string; direction: "asc" | "desc" };
  setSort: (sort: { field: string; direction: "asc" | "desc" }) => void;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onAdd: () => void;
}

const AdminUsersSection: React.FC<AdminUsersSectionProps> = ({
  users,
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
                  ? "text-blue-600 hover:text-blue-700"
                  : "text-gray-500 hover:text-gray-700"
              }`
            : `${
                isActive
                  ? "text-blue-600 hover:text-blue-700"
                  : "text-gray-600 hover:text-gray-900"
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
            Users Management
          </h3>
          <p className="text-black mt-1">
            Manage user accounts and permissions
          </p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center cursor-pointer gap-2 px-6 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded-lg transition-all duration-200 font-medium"
        >
          <span>Create User</span>
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
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 text-black py-4 text-left text-xs font-semibold uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="w-12 h-12 text-black mb-4" />
                      <h3 className="text-lg font-medium text-black mb-2">
                        No users found
                      </h3>
                      <p className="text-black">
                        No users have been registered yet
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10">
                          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                            <Users className="w-5 h-5 text-black" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-black">
                            {user.full_name || "No name"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-black">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-gray-100 text-black border border-gray-200"
                            : user.role === "operator"
                            ? "bg-gray-100 text-black border border-gray-200"
                            : "bg-gray-100 text-black border border-gray-200"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status === "active"
                            ? "bg-gray-100 text-black border border-gray-200"
                            : user.status === "inactive"
                            ? "bg-gray-100 text-black border border-gray-200"
                            : "bg-gray-100 text-black border border-gray-200"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-black">
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onView(user)}
                          className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors duration-150"
                          title="View user"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(user)}
                          className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors duration-150"
                          title="Edit user"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(user)}
                          className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors duration-150"
                          title="Delete user"
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

export default AdminUsersSection;
