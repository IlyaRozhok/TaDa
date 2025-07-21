"use client";

import { getPrimaryRole, getRedirectPath } from "../../utils/simpleRedirect";

export default function RoleTestPage() {
  const testCases = [
    { role: "admin", expected: "/app/dashboard/admin" },
    { role: "operator", expected: "/app/dashboard/operator" },
    { role: "tenant", expected: "/app/dashboard/tenant" },
    { role: "tenant,admin", expected: "/app/dashboard/admin" },
    { role: "admin,tenant", expected: "/app/dashboard/admin" },
    { role: "operator,tenant", expected: "/app/dashboard/operator" },
    { role: "tenant,operator", expected: "/app/dashboard/operator" },
    { role: "admin,operator,tenant", expected: "/app/dashboard/admin" },
    { role: "unknown", expected: "/?needsRole=true" },
    { role: "", expected: "/?needsRole=true" },
    { role: null, expected: "/?needsRole=true" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Role Logic Tester
          </h1>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Role Priority Logic:</h2>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>
                1. <strong>Admin</strong> - highest priority (if role contains
                "admin") → <code>/app/dashboard/admin</code>
              </li>
              <li>
                2. <strong>Operator</strong> - medium priority (if role contains
                "operator") → <code>/app/dashboard/operator</code>
              </li>
              <li>
                3. <strong>Tenant</strong> - lowest priority (if role contains
                "tenant") → <code>/app/dashboard/tenant</code>
              </li>
              <li>
                4. <strong>Unknown/Empty</strong> - redirect to role selection →{" "}
                <code>/?needsRole=true</code>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test Results:</h3>

            {testCases.map((testCase, index) => {
              const mockUser = {
                email: "test@example.com",
                role: testCase.role,
              };

              const primaryRole = getPrimaryRole(mockUser);
              const redirectPath = getRedirectPath(mockUser);
              const isCorrect = redirectPath === testCase.expected;

              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    isCorrect
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <strong>Role:</strong>
                      <code className="ml-2 bg-gray-100 px-2 py-1 rounded">
                        {testCase.role || "null"}
                      </code>
                    </div>
                    <div>
                      <strong>Primary:</strong>
                      <span className="ml-2">{primaryRole}</span>
                    </div>
                    <div>
                      <strong>Redirect:</strong>
                      <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                        {redirectPath}
                      </code>
                    </div>
                    <div className="flex items-center">
                      {isCorrect ? (
                        <span className="text-green-600 flex items-center">
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Correct
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center">
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Failed (expected: {testCase.expected})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">
              Production Issue Fixed:
            </h4>
            <p className="text-sm text-blue-800">
              The original issue was that user with role{" "}
              <code>"tenant,admin"</code> was causing an infinite redirect loop
              because the switch statement couldn't handle multiple roles. Now{" "}
              <code>getPrimaryRole()</code> extracts "admin" as the primary role
              and redirects correctly to <code>/app/dashboard/admin</code>.
            </p>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => (window.location.href = "/debug")}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Back to Debug Dashboard
            </button>

            <button
              onClick={() => (window.location.href = "/")}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
