/**
 * Test component for ProfileForm with new PhoneMaskInput
 * This demonstrates the integration and phone number handling
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

export function ProfileFormTest() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Profile Form Test</h1>
        <p className="text-gray-600 mb-8">
          Testing ProfileForm with new PhoneMaskInput component. All fields are now required.
        </p>
        
        <div className="bg-white rounded-lg shadow-sm">
          <ProfileForm user={mockUser} />
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Features Tested:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ PhoneMaskInput integration with country code parsing</li>
            <li>✓ All fields marked as required</li>
            <li>✓ Phone number parsing from full format (+447123456789)</li>
            <li>✓ Country code detection from existing phone number</li>
            <li>✓ Fixed-width country selector</li>
            <li>✓ Mask placeholder guidance</li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <h3 className="font-medium text-green-900 mb-2">Expected Behavior:</h3>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Phone field should show UK flag and +44 code</li>
            <li>• Phone number should display as: 7123 456789</li>
            <li>• All fields should show red asterisk (*) for required</li>
            <li>• Country selector should maintain fixed width</li>
            <li>• Changing country should update the mask pattern</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ProfileFormTest;
