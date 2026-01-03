/**
 * Test component for updated ProfileForm
 * Demonstrates the new features: no auto-save, Save button, styled date input, mask-only phone placeholder
 */

import React from "react";
import { ProfileForm } from "./ProfileForm";
import { User } from "../../../../entities/user/model/types";

// Mock user data for testing
const mockUser: User = {
  id: "1",
  email: "john.doe@example.com",
  role: "tenant",
  tenantProfile: {
    id: "1",
    user_id: "1",
    first_name: "John",
    last_name: "Doe",
    address: "123 Main Street, London",
    phone: "+447123456789", // UK phone number with country code
    date_of_birth: "1990-01-15",
    nationality: "British",
    occupation: "full-time-employed",
    avatar_url: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  operatorProfile: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

export function UpdatedProfileFormTest() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Updated Profile Form Test</h1>
        <p className="text-gray-600 mb-8">
          Testing the updated ProfileForm with new features and improvements.
        </p>
        
        <div className="bg-white rounded-lg shadow-sm">
          <ProfileForm user={mockUser} />
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">New Features:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ Phone input shows only mask pattern (no "Phone Number" placeholder)</li>
            <li>✅ Removed auto-save on input changes</li>
            <li>✅ Added "Save Changes" button (only enabled when changes detected)</li>
            <li>✅ Replaced date picker with styled date input matching design</li>
            <li>✅ Save button shows loading state during save operation</li>
            <li>✅ Form tracks changes to enable/disable save button</li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <h3 className="font-medium text-green-900 mb-2">Expected Behavior:</h3>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Phone field shows mask pattern like "(99) 999 99 99" for UK</li>
            <li>• Date input has floating label and rounded corners matching other fields</li>
            <li>• Save button is disabled until changes are made</li>
            <li>• Save button shows spinner and "Saving..." text when clicked</li>
            <li>• No automatic API calls when typing in fields</li>
            <li>• All fields maintain the same visual style</li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-medium text-yellow-900 mb-2">Implementation Notes:</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Phone parsing logic preserved for backward compatibility</li>
            <li>• StyledDateInput component created to match existing design</li>
            <li>• Form state management simplified (no useProfileUpdate hook)</li>
            <li>• Save logic is placeholder - needs actual API integration</li>
            <li>• Avatar upload creates preview but doesn't auto-save</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default UpdatedProfileFormTest;
