"use client";

import React from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import OnboardingProfileStep from "./OnboardingProfileStep";

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
          phone: "+441234567890",
          date_of_birth: "1990-01-01",
          nationality: "British",
        },
      },
      isAuthenticated: true,
    }) => state,
  },
});

function MockReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={mockStore}>
      {children}
    </Provider>
  );
}

export function OnboardingProfileStepUpdatedTest() {
  const handleComplete = () => {
    console.log("Onboarding profile step completed - user can now proceed!");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Updated Onboarding Profile Step Test</h1>
        <p className="text-gray-600 mb-8">
          Testing updated OnboardingProfileStep with Save button, form validation, and no auto-save.
        </p>
        
        <div className="bg-white rounded-lg shadow-sm">
          <MockReduxProvider>
            <OnboardingProfileStep
              onComplete={handleComplete}
              currentStep={1}
              totalSteps={3}
            />
          </MockReduxProvider>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">New Features Implemented:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ Save & Continue button (only enabled when all fields are filled)</li>
            <li>✅ Form validation prevents progression with empty required fields</li>
            <li>✅ No auto-save on input changes</li>
            <li>✅ StyledDateInput replaces DateField</li>
            <li>✅ All fields are required (first_name, last_name, address, phone, date_of_birth, nationality)</li>
            <li>✅ Error and success message display</li>
            <li>✅ Loading state during save operation</li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <h3 className="font-medium text-green-900 mb-2">User Experience Improvements:</h3>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Clear visual feedback when form is incomplete</li>
            <li>• Button disabled until all required fields are filled</li>
            <li>• Success message shown before proceeding to next step</li>
            <li>• Error handling with user-friendly messages</li>
            <li>• Consistent styling with StyledDateInput</li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-medium text-yellow-900 mb-2">Testing Instructions:</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>1. Try clicking "Save & Continue" with empty fields - should show error</li>
            <li>2. Fill in all required fields - button should become enabled</li>
            <li>3. Click "Save & Continue" - should show success message and proceed</li>
            <li>4. Test phone number input with different countries</li>
            <li>5. Test date input with StyledDateInput component</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default OnboardingProfileStepUpdatedTest;
