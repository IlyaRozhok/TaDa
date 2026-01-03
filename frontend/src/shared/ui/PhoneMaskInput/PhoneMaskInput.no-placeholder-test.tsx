"use client";

import React, { useState } from "react";
import PhoneMaskInput from "./PhoneMaskInput";

export function PhoneMaskInputNoPlaceholderTest() {
  const [phoneCountryCode, setPhoneCountryCode] = useState("US");
  const [phoneNumberOnly, setPhoneNumberOnly] = useState("");

  const handlePhoneChange = (value: string | undefined) => {
    setPhoneNumberOnly(value || "");
  };

  const handleCountryChange = (countryCode: string) => {
    setPhoneCountryCode(countryCode);
    setPhoneNumberOnly("");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">PhoneMaskInput - No Placeholder Test</h1>
        <p className="text-gray-600 mb-8">
          Testing phone input with removed placeholder mask. The input should show no placeholder text.
        </p>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="font-medium text-gray-900 mb-4">Phone Input Without Placeholder</h3>
          
          <PhoneMaskInput
            countryCode={phoneCountryCode}
            label="Phone Number"
            value={phoneNumberOnly}
            onChange={handlePhoneChange}
            onCountryChange={handleCountryChange}
            required
          />
          
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">
              <strong>Current Value:</strong> "{phoneNumberOnly}"
            </p>
            <p className="text-sm text-gray-600">
              <strong>Country:</strong> {phoneCountryCode}
            </p>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-900 mb-2">Change Applied:</h3>
          <ul className="text-sm text-green-800 space-y-1">
            <li>✅ Removed mask placeholder from phone input</li>
            <li>✅ Input now shows empty placeholder instead of mask pattern</li>
            <li>✅ Floating label still works correctly</li>
            <li>✅ SlotChar "_" still provides visual guidance when typing</li>
          </ul>
        </div>

        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Expected Behavior:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Input should show no placeholder text when empty</li>
            <li>• When you start typing, slot characters "_" should appear for guidance</li>
            <li>• Floating label should work normally</li>
            <li>• Mask formatting should still work when typing</li>
          </ul>
        </div>

        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-900 mb-2">Test Different Countries:</h3>
          <div className="grid grid-cols-4 gap-2">
            {["US", "GB", "FR", "DE"].map(country => (
              <button
                key={country}
                onClick={() => handleCountryChange(country)}
                className={`px-3 py-2 text-sm rounded border ${
                  phoneCountryCode === country 
                    ? "bg-blue-100 border-blue-300 text-blue-700" 
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {country}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Technical Change:</h3>
          <div className="text-sm text-gray-700">
            <p><strong>Before:</strong></p>
            <code className="block bg-gray-200 p-2 rounded mt-1 text-xs">
              const displayPlaceholder = placeholder || mask; // Showed mask as placeholder
            </code>
            <p className="mt-2"><strong>After:</strong></p>
            <code className="block bg-green-100 p-2 rounded mt-1 text-xs">
              const displayPlaceholder = placeholder || ""; // Empty placeholder
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PhoneMaskInputNoPlaceholderTest;
