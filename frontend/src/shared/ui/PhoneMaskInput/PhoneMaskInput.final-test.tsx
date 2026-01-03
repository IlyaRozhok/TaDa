"use client";

import React, { useState } from "react";
import PhoneMaskInput from "./PhoneMaskInput";

export function PhoneMaskInputFinalTest() {
  const [phoneCountryCode, setPhoneCountryCode] = useState("US");
  const [phoneNumberOnly, setPhoneNumberOnly] = useState("");
  const [changeCount, setChangeCount] = useState(0);

  const handlePhoneChange = (value: string | undefined) => {
    console.log("Phone change:", value);
    setPhoneNumberOnly(value || "");
    setChangeCount(prev => prev + 1);
  };

  const handleCountryChange = (countryCode: string) => {
    console.log("Country change:", countryCode);
    setPhoneCountryCode(countryCode);
    setPhoneNumberOnly("");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">PhoneMaskInput Final Test</h1>
        <p className="text-gray-600 mb-8">
          Testing the fixed phone input - should now work without clearing.
        </p>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
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
            <p className="text-sm text-gray-600">
              <strong>Change Count:</strong> {changeCount}
            </p>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-900 mb-2">Fix Applied:</h3>
          <ul className="text-sm text-green-800 space-y-1">
            <li>✅ Removed local phoneValue state to prevent circular updates</li>
            <li>✅ Made component fully controlled by parent value prop</li>
            <li>✅ Removed useEffect that was syncing value prop to local state</li>
            <li>✅ InputMask now directly uses the value prop</li>
          </ul>
        </div>

        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Test Instructions:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Type numbers - they should appear and stay visible</li>
            <li>Try typing "123456789" - should format according to US mask</li>
            <li>Change country and try typing again</li>
            <li>Check browser console for any errors</li>
          </ol>
        </div>

        <div className="mt-4">
          <h3 className="font-medium text-gray-900 mb-2">Quick Country Test:</h3>
          <div className="grid grid-cols-3 gap-2">
            {["US", "GB", "FR"].map(country => (
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
      </div>
    </div>
  );
}

export default PhoneMaskInputFinalTest;
