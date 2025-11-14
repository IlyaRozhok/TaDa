import React, { useState } from "react";
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
    const isDesc = isActive && sort.direction === "desc";

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
                  : "text-slate-500 hover:text-slate-700"
              }`
            : `${
                isActive
                  ? "text-blue-600 hover:text-blue-700"
                  : "text-slate-600 hover:text-slate-900"
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
          <h3 className="text-2xl font-semibold text-slate-900">
            Users Management
          </h3>
          <p className="text-slate-600 mt-1">
            Manage user accounts and permissions
          </p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-slate-800 to-slate-900 hover:from-violet-500 hover:to-pink-600 text-white rounded-lg shadow-sm transition-all duration-200 font-medium hover:shadow-lg hover:shadow-slate-900/10 focus:outline-none focus:ring-2 focus:ring-slate-400/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add User</span>
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
                  placeholder="Search users..."
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
            {sort.field && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>Sorted by:</span>
                <span className="font-medium text-blue-600">
                  {sort.field === "full_name"
                    ? "Name"
                    : sort.field === "email"
                    ? "Email"
                    : sort.field === "role"
                    ? "Role"
                    : sort.field === "status"
                    ? "Status"
                    : sort.field === "created_at"
                    ? "Created"
                    : sort.field}
                </span>
                <button
                  onClick={() =>
                    setSort({
                      ...sort,
                      direction: sort.direction === "asc" ? "desc" : "asc",
                    })
                  }
                  className="ml-1 p-1 hover:bg-slate-100 rounded"
                  title={`Change to ${
                    sort.direction === "asc" ? "descending" : "ascending"
                  }`}
                >
                  {sort.direction === "asc" ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  <SortButton field="full_name" label="Name" />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  <SortButton field="email" label="Email" />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  <SortButton field="role" label="Role" />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  <SortButton field="status" label="Status" />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  <SortButton field="created_at" label="Created" />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="w-12 h-12 text-slate-300 mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">
                        No users found
                      </h3>
                      <p className="text-slate-600">
                        {searchTerm
                          ? "Try adjusting your search"
                          : "No users have been registered yet"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10">
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                            <Users className="w-5 h-5 text-slate-400" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">
                            {user.full_name || "No name"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : user.role === "operator"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status === "active"
                            ? "bg-green-100 text-green-800"
                            : user.status === "inactive"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900">
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onView(user)}
                          className="p-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-md transition-colors duration-150"
                          title="View user"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(user)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-150"
                          title="Edit user"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(user)}
                          className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors duration-150"
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

        <div className="px-6 py-4 border-t border-slate-200">
          {/* Pagination component would go here */}
        </div>
      </div>
    </div>
  );
};

export default AdminUsersSection;
