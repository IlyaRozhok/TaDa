"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import {
  selectUser,
  selectIsAuthenticated,
} from "../../../store/slices/authSlice";
import {
  fetchUsers,
  createUser,
  clearCreateError,
  UserRow,
  CreateUserData,
} from "../../../store/slices/usersSlice";
import { useDebounce } from "../../../lib/utils";
import { Menu, Users as UsersIcon, UserCircle, Plus, X } from "lucide-react";
import { AppDispatch, RootState } from "../../../store/store";

interface UsersState {
  users: UserRow[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  creating: boolean;
  createError: string | null;
}

// Create User Modal Component
function CreateUserModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  error,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserData) => void;
  isLoading: boolean;
  error: string | null;
}) {
  const [formData, setFormData] = useState<CreateUserData>({
    full_name: "",
    email: "",
    password: "",
    roles: ["tenant"],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleRoleChange = (role: string, checked: boolean) => {
    if (checked) {
      setFormData((prev) => ({ ...prev, roles: [...prev.roles, role] }));
    } else {
      setFormData((prev) => ({
        ...prev,
        roles: prev.roles.filter((r) => r !== role),
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Create New User</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, full_name: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, password: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter password (min 6 characters)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Roles
            </label>
            <div className="space-y-2">
              {["admin", "operator", "tenant"].map((role) => (
                <label key={role} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.roles.includes(role)}
                    onChange={(e) => handleRoleChange(role, e.target.checked)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {role}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || formData.roles.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating...
                </>
              ) : (
                "Create User"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const usersState = useSelector(
    (state: RootState) => state.users
  ) as UsersState;
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  // State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("users");
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Debounced search with 400ms delay
  const debouncedSearch = useDebounce(search, 400);

  // Wait for SessionManager to initialize
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const checkInitialization = () => {
      // Check if SessionManager has been initialized
      if (typeof window !== "undefined" && window.__sessionManagerInitialized) {
        console.log("Admin page: SessionManager initialized");
        setIsInitialized(true);

        // Test API connection
        const testAPI = async () => {
          const token = localStorage.getItem("accessToken");
          const API_BASE_URL =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

          console.log("Admin page: Testing API connection", {
            API_BASE_URL,
            hasToken: !!token,
            tokenPreview: token ? token.substring(0, 20) + "..." : "none",
          });

          if (token) {
            try {
              const response = await fetch(
                `${API_BASE_URL}/users?page=1&limit=1`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                }
              );

              console.log("Admin page: API test response:", {
                status: response.status,
                ok: response.ok,
                statusText: response.statusText,
              });

              if (!response.ok) {
                const errorText = await response.text();
                console.error("Admin page: API test failed:", errorText);
              }
            } catch (error) {
              console.error("Admin page: API test network error:", error);
            }
          }
        };

        testAPI();
      } else {
        // Wait a bit more and check again
        timeoutId = setTimeout(checkInitialization, 100);
      }
    };

    checkInitialization();

    // Fallback: if not initialized after 5 seconds, force initialization
    const fallbackTimeout = setTimeout(() => {
      console.warn("Admin page: Forcing initialization after timeout");
      setIsInitialized(true);
    }, 5000);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      clearTimeout(fallbackTimeout);
    };
  }, []);

  // Simple access control
  useEffect(() => {
    if (!isInitialized) return;

    console.log("Admin page: Checking access", { isAuthenticated, user });

    if (isAuthenticated === false) {
      router.replace("/app/auth/login");
      return;
    }

    if (isAuthenticated && user && !user.roles?.includes("admin")) {
      if (user.roles?.includes("operator")) {
        router.replace("/app/dashboard/operator");
      } else {
        router.replace("/app/dashboard/tenant");
      }
      return;
    }
  }, [isAuthenticated, user, router, isInitialized]);

  // Fetch users when component mounts or search changes
  useEffect(() => {
    if (!isInitialized) return;

    console.log("Admin page: useEffect triggered", {
      isInitialized,
      isAuthenticated,
      user: user ? { id: user.id, roles: user.roles } : null,
      debouncedSearch,
      usersLoading: usersState.loading,
      usersError: usersState.error,
    });

    // Log the Redux auth state to debug
    const authState = JSON.parse(localStorage.getItem("persist:auth") || "{}");
    console.log("Admin page: Auth state from localStorage:", authState);

    if (isAuthenticated === true && user && user.roles?.includes("admin")) {
      console.log(
        "Admin page: Dispatching fetchUsers with search:",
        debouncedSearch
      );

      // Log the current Redux state before dispatching
      console.log("Admin page: Current Redux state:", {
        auth: {
          isAuthenticated,
          user: user ? { id: user.id, roles: user.roles } : null,
          hasToken: !!localStorage.getItem("accessToken"),
        },
        users: {
          loading: usersState.loading,
          error: usersState.error,
          usersCount: usersState.users.length,
        },
      });

      dispatch(
        fetchUsers({
          page: 1,
          limit: 50,
          search: debouncedSearch || undefined,
        })
      );
    } else {
      console.log("Admin page: Not fetching users because:", {
        isAuthenticated,
        hasUser: !!user,
        isAdmin: user?.roles?.includes("admin"),
        userRoles: user?.roles || [],
      });
    }
  }, [isAuthenticated, user, debouncedSearch, dispatch, isInitialized]);

  // Diagnostic effect to monitor loading state changes
  useEffect(() => {
    console.log("Admin page: Loading state changed:", {
      loading: usersState.loading,
      error: usersState.error,
      usersCount: usersState.users.length,
      timestamp: new Date().toISOString(),
    });
  }, [usersState.loading, usersState.error, usersState.users.length]);

  // Handle create user
  const handleCreateUser = (userData: CreateUserData) => {
    dispatch(createUser(userData)).then((result) => {
      if (result.meta.requestStatus === "fulfilled") {
        setShowCreateModal(false);
        // Refresh users list
        dispatch(
          fetchUsers({
            page: 1,
            limit: 50,
            search: debouncedSearch || undefined,
          })
        );
      }
    });
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowCreateModal(false);
    dispatch(clearCreateError());
  };

  // Test API connection manually
  const testAPIConnection = async () => {
    const token = localStorage.getItem("accessToken");
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

    console.log("Manual API test:", {
      API_BASE_URL,
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 20) + "..." : "none",
    });

    if (!token) {
      alert("No token found in localStorage");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users?page=1&limit=5`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Manual API test response:", {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Manual API test data:", data);
        alert(`API test successful! Got ${data.total || 0} users`);
      } else {
        const errorText = await response.text();
        console.error("Manual API test failed:", errorText);
        alert(`API test failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error("Manual API test network error:", error);
      alert(`Network error: ${error}`);
    }
  };

  // Show loading while checking access or initializing
  if (!isInitialized) {
    console.log("Admin page: Showing loading screen - not initialized");

    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading admin panel...</p>
          <p className="text-sm text-slate-400 mt-2">Initializing session...</p>
          <p className="text-xs text-slate-300 mt-2">
            Debug: init={String(isInitialized)}, auth={String(isAuthenticated)},
            user={user ? "present" : "null"}, admin=
            {user && user.roles?.includes("admin") ? "yes" : "no"}
          </p>
        </div>
      </div>
    );
  }

  // After initialization, check authentication and permissions
  if (isAuthenticated === false) {
    console.log("Admin page: Not authenticated, redirecting to login");
    router.replace("/app/auth/login");
    return null;
  }

  if (isAuthenticated === true && user && !user.roles?.includes("admin")) {
    console.log("Admin page: User is not admin, showing access denied");

    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">
            You don&apos;t have permission to access the admin panel.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold mb-2">Your current roles:</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {user.roles?.map((role, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => {
                if (user.roles?.includes("operator")) {
                  router.replace("/app/dashboard/operator");
                } else {
                  router.replace("/app/dashboard/tenant");
                }
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to My Dashboard
            </button>

            <button
              onClick={() => router.replace("/app/auth/login")}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Logout
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            Contact administrator if you need admin access
          </p>
        </div>
      </div>
    );
  }

  // Still loading user data
  if (isAuthenticated === true && !user) {
    console.log("Admin page: Authenticated but no user data yet");

    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading admin panel...</p>
          <p className="text-sm text-slate-400 mt-2">Loading user data...</p>
          <p className="text-xs text-slate-300 mt-2">
            Debug: init={String(isInitialized)}, auth={String(isAuthenticated)},
            user={user ? "present" : "null"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white text-black">
      {/* Sidebar */}
      <aside
        className={`transition-all duration-200 h-screen sticky top-0 z-40 flex flex-col justify-between ${
          sidebarOpen ? "w-[240px]" : "w-16"
        }`}
        style={{
          background: "#f8fafc",
          borderRight: "1px solid #e5e7eb",
          boxShadow: sidebarOpen ? "2px 0 8px 0 #e5e7eb33" : "none",
        }}
      >
        <div>
          {/* Logo and toggle */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 rounded-lg w-8 h-8 flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              {sidebarOpen && (
                <span className="font-bold text-xl tracking-wide ml-1">
                  TADA
                </span>
              )}
            </div>
            <button
              className="p-2 rounded hover:bg-blue-100 transition-colors"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
          </div>
          {/* Nav */}
          <nav className="mt-4 flex flex-col gap-1">
            <button
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all font-medium text-base w-full
                ${
                  activeTab === "users"
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "hover:bg-gray-100 text-gray-700"
                }
              `}
              onClick={() => setActiveTab("users")}
            >
              <UsersIcon
                className={`w-5 h-5 ${
                  activeTab === "users" ? "text-blue-600" : "text-gray-400"
                }`}
              />
              {sidebarOpen && <span>Users</span>}
            </button>
          </nav>
        </div>
        {/* User avatar bottom */}
        <div className="flex flex-col items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mb-2 border border-gray-300">
            <UserCircle className="w-7 h-7 text-gray-500" />
          </div>
          {sidebarOpen && user && (
            <div className="text-xs text-gray-500 text-center max-w-[90%] truncate">
              {user.full_name}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 bg-white text-black">
        <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>

        {activeTab === "users" && (
          <div>
            {/* Controls Row: Search and Create Button */}
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="font-semibold text-lg">Users</div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search by name or email"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-64 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {usersState.loading && (
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
                )}
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create User
                </button>
                <button
                  onClick={testAPIConnection}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Test API
                </button>
              </div>
            </div>

            {/* Error message */}
            {usersState.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                Error: {usersState.error}
              </div>
            )}

            {/* Table with fixed height */}
            <div className="overflow-x-auto bg-white rounded-xl shadow border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Roles
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {usersState.users && usersState.users.length > 0 ? (
                    usersState.users.map((u: UserRow) => (
                      <tr
                        key={u.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {u.full_name}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{u.email}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {u.roles?.join(", ")}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(u.created_at).toLocaleString()}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-16">
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <UsersIcon className="w-8 h-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {usersState.loading
                              ? "Loading users..."
                              : "No users found"}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {usersState.loading
                              ? "Please wait while we fetch the user data"
                              : search
                              ? "Try adjusting your search criteria"
                              : "No users are available in the system"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Results info */}
            {usersState.users && usersState.users.length > 0 && (
              <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <div>
                  Showing {usersState.users.length} of {usersState.total} users
                </div>
                {search && (
                  <div>
                    Search results for:{" "}
                    <span className="font-medium">&quot;{search}&quot;</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Create User Modal */}
        <CreateUserModal
          isOpen={showCreateModal}
          onClose={handleCloseModal}
          onSubmit={handleCreateUser}
          isLoading={usersState.creating}
          error={usersState.createError}
        />
      </main>
    </div>
  );
}
