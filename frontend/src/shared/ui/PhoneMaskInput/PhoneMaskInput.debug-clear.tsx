"use client";

import React, { useState } from "react";
import PhoneMaskInput from "./PhoneMaskInput";

export function PhoneMaskInputDebugClear() {
  const [phoneCountryCode, setPhoneCountryCode] = useState("US");
  const [phoneNumberOnly, setPhoneNumberOnly] = useState("");
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (message: string) => {
    setDebugInfo(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">PhoneMaskInput Debug - Clear Issue</h1>
        <p className="text-gray-600 mb-8">
          Testing the issue where phone number input clears immediately when typing.
        </p>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="font-medium text-gray-900 mb-4">Current Implementation (Problematic)</h3>
          
          <PhoneMaskInput
            countryCode={phoneCountryCode}
            label="Phone Number"
            value={phoneNumberOnly}
            onChange={(value) => {
              addDebugInfo(`onChange called with: "${value}"`);
              setPhoneNumberOnly(value || "");
              
              // This is the problematic line - it strips formatting!
              const cleanValue = value ? value.replace(/\D/g, '') : "";
              addDebugInfo(`After cleaning: "${cleanValue}"`);
            }}
            onCountryChange={(countryCode) => {
              addDebugInfo(`Country changed to: ${countryCode}`);
              setPhoneCountryCode(countryCode);
              setPhoneNumberOnly(""); // This also clears the input
            }}
            required
          />
          
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">
              <strong>Current Value:</strong> "{phoneNumberOnly}"
            </p>
            <p className="text-sm text-gray-600">
              <strong>Country Code:</strong> {phoneCountryCode}
            </p>
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

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-medium text-red-900 mb-2">Issue Identified:</h3>
          <ul className="text-sm text-red-800 space-y-1">
            <li>• The onChange handler calls <code>value.replace(/\D/g, '')</code></li>
            <li>• This strips all formatting characters from the masked input</li>
            <li>• InputMask expects to maintain its internal formatting</li>
            <li>• The conflict causes the input to clear/reset</li>
            <li>• Solution: Don't strip formatting in onChange, let InputMask handle it</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default PhoneMaskInputDebugClear;
