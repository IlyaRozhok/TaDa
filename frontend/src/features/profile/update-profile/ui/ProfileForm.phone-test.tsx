"use client";

import React from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { ProfileForm } from "./ProfileForm";
import { User } from "../../../../entities/user/model/types";

// Mock Redux store for testing
const mockStore = configureStore({
  reducer: {
    auth: (state = {
      user: {
        id: 1,
        email: "test@example.com",
        role: "tenant",
        tenantProfile: {
          first_name: "John",
          last_name: "Doe",
          address: "123 Test St",
          phone: "+447123456789", // UK phone number
          date_of_birth: "1990-01-01",
          nationality: "British",
        },
      },
      isAuthenticated: true,
    }) => state,
  },
});

const mockUser: User = {
  id: 1,
  email: "test@example.com",
  role: "tenant",
  tenantProfile: {
    first_name: "John",
    last_name: "Doe",
    address: "123 Test St",
    phone: "+447123456789", // UK phone number to test parsing
    date_of_birth: "1990-01-01",
    nationality: "British",
  },
  operatorProfile: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

function MockReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={mockStore}>
      {children}
    </Provider>
  );
}

export function ProfileFormPhoneTest() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">ProfileForm Phone Input Test</h1>
        <p className="text-gray-600 mb-8">
          Testing ProfileForm phone input with fixed useEffect conflicts. Should parse UK phone number correctly.
        </p>
        
        <div className="bg-white rounded-lg shadow-sm">
          <MockReduxProvider>
            <ProfileForm user={mockUser} />
          </MockReduxProvider>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Expected Behavior:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ Phone field should show UK flag and +44 code</li>
            <li>✅ Phone number should display as: "7123 456789" (formatted)</li>
            <li>✅ Should be able to type and edit the phone number</li>
            <li>✅ No clearing when typing</li>
            <li>✅ Country change should work properly</li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <h3 className="font-medium text-green-900 mb-2">Fix Applied:</h3>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Removed conflicting useEffect hooks</li>
            <li>• Consolidated phone parsing into single parsePhoneNumber function</li>
            <li>• Phone parsing only happens when user data changes, not on every formData change</li>
            <li>• Eliminated circular update loops</li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-medium text-yellow-900 mb-2">Test Instructions:</h3>
          <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
            <li>Check if phone number is correctly parsed and displayed</li>
            <li>Try typing in the phone field - should not clear</li>
            <li>Try changing country - should clear and apply new mask</li>
            <li>Try typing a full phone number</li>
            <li>Check if Save Changes button works</li>
          </ol>
        </div>

        <div className="mt-4 p-4 bg-red-50 rounded-lg">
          <h3 className="font-medium text-red-900 mb-2">Previous Issue:</h3>
          <ul className="text-sm text-red-800 space-y-1">
            <li>❌ Two useEffect hooks were both parsing phone numbers</li>
            <li>❌ First useEffect: triggered on formData.phone changes</li>
            <li>❌ Second useEffect: triggered on user changes</li>
            <li>❌ This created circular updates and conflicts</li>
            <li>❌ Phone input would clear or behave unpredictably</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ProfileFormPhoneTest;
