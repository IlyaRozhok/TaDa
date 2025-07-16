"use client";

import { useSelector } from "react-redux";
import { selectUser, selectIsAuthenticated } from "../store/slices/authSlice";
import { getUserRole, getDashboardPath } from "../components/DashboardRouter";

export default function DebugPage() {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const userRole = user ? getUserRole(user) : "unknown";
  const dashboardPath = getDashboardPath(userRole as any);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug User Data</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          <p>
            <strong>Is Authenticated:</strong> {isAuthenticated ? "Yes" : "No"}
          </p>
          <p>
            <strong>User Role:</strong> {userRole}
          </p>
          <p>
            <strong>Dashboard Path:</strong> {dashboardPath}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">User Object</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">User Role Analysis</h2>
          {user && (
            <div className="space-y-2">
              <p>
                <strong>user.role:</strong> {user.role || "undefined"}
              </p>
              <p>
                <strong>user.roles:</strong> {JSON.stringify(user.roles)}
              </p>
              <p>
                <strong>user.tenantProfile:</strong>{" "}
                {user.tenantProfile ? "exists" : "null"}
              </p>
              <p>
                <strong>user.operatorProfile:</strong>{" "}
                {user.operatorProfile ? "exists" : "null"}
              </p>
              <p>
                <strong>getUserRole() result:</strong> {userRole}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
