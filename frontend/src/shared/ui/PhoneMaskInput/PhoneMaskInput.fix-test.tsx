"use client";

import React, { useState } from "react";
import PhoneMaskInput from "./PhoneMaskInput";

export function PhoneMaskInputFixTest() {
  const [phoneCountryCode, setPhoneCountryCode] = useState("US");
  const [phoneNumberOnly, setPhoneNumberOnly] = useState("");
  const [fullPhoneNumber, setFullPhoneNumber] = useState("");
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (message: string) => {
    setDebugInfo(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handlePhoneChange = (value: string | undefined) => {
    addDebugInfo(`onChange called with: "${value}"`);
    setPhoneNumberOnly(value || "");
    
    // Fixed logic - don't interfere with InputMask formatting
    if (value) {
      // Only extract digits when we need to store the final value
      const digitsOnly = value.replace(/\D/g, '');
      const country = phoneCountryCode === "US" ? "+1" : 
                     phoneCountryCode === "GB" ? "+44" : 
                     phoneCountryCode === "FR" ? "+33" : "+1";
      const fullPhone = `${country}${digitsOnly}`;
      setFullPhoneNumber(fullPhone);
      addDebugInfo(`Full phone number: "${fullPhone}"`);
    } else {
      setFullPhoneNumber("");
    }
  };

  const handleCountryChange = (countryCode: string) => {
    addDebugInfo(`Country changed to: ${countryCode}`);
    setPhoneCountryCode(countryCode);
    // Clear the phone input when country changes
    setPhoneNumberOnly("");
    setFullPhoneNumber("");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">PhoneMaskInput Fix Test</h1>
        <p className="text-gray-600 mb-8">
          Testing the fixed phone input that should allow typing without clearing.
        </p>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="font-medium text-gray-900 mb-4">Fixed Implementation</h3>
          
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
              <strong>Display Value:</strong> "{phoneNumberOnly}"
            </p>
            <p className="text-sm text-gray-600">
              <strong>Full Phone Number:</strong> "{fullPhoneNumber}"
            </p>
            <p className="text-sm text-gray-600">
              <strong>Country Code:</strong> {phoneCountryCode}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="font-medium text-gray-900 mb-4">Test Different Countries</h3>
          <div className="grid grid-cols-3 gap-2">
            {["US", "GB", "FR", "DE", "CA", "AU"].map(country => (
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

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="font-medium text-gray-900 mb-4">Debug Log</h3>
          <div className="bg-gray-50 rounded p-3 max-h-40 overflow-y-auto">
            {debugInfo.length === 0 ? (
              <p className="text-sm text-gray-500">Start typing to see debug info...</p>
            ) : (
              debugInfo.map((info, index) => (
                <p key={index} className="text-xs text-gray-700 font-mono">{info}</p>
              ))
            )}
          </div>
          <button 
            onClick={() => setDebugInfo([])}
            className="mt-2 px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
          >
            Clear Log
          </button>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-900 mb-2">Fix Applied:</h3>
          <ul className="text-sm text-green-800 space-y-1">
            <li>✅ Removed .replace(/\D/g, '') from immediate onChange handling</li>
            <li>✅ Only extract digits when storing the final phone number</li>
            <li>✅ Let InputMask handle internal formatting</li>
            <li>✅ Fixed country change to pass undefined instead of empty string</li>
            <li>✅ Simplified onCountryChange to clear input properly</li>
          </ul>
        </div>

        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Testing Instructions:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>1. Try typing numbers - they should stay visible</li>
            <li>2. Test backspace/delete - should work normally</li>
            <li>3. Change countries - input should clear and accept new format</li>
            <li>4. Type partial numbers - should maintain formatting</li>
            <li>5. Full phone numbers should be properly formatted</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default PhoneMaskInputFixTest;
