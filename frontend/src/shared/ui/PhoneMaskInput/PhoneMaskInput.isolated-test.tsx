"use client";

import React, { useState } from "react";
import PhoneMaskInput from "./PhoneMaskInput";

export function PhoneMaskInputIsolatedTest() {
  const [phoneCountryCode, setPhoneCountryCode] = useState("US");
  const [phoneNumberOnly, setPhoneNumberOnly] = useState("");
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLog(prev => [...prev.slice(-9), `${timestamp}: ${message}`]);
  };

  const handlePhoneChange = (value: string | undefined) => {
    addLog(`onChange called with: "${value}"`);
    addLog(`Current phoneNumberOnly state: "${phoneNumberOnly}"`);
    
    // Simple state update - no complex logic
    setPhoneNumberOnly(value || "");
    
    addLog(`Setting phoneNumberOnly to: "${value || ""}"`);
  };

  const handleCountryChange = (countryCode: string) => {
    addLog(`Country changed to: ${countryCode}`);
    setPhoneCountryCode(countryCode);
    setPhoneNumberOnly("");
    addLog(`Cleared phoneNumberOnly`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">PhoneMaskInput Isolated Test</h1>
        <p className="text-gray-600 mb-8">
          Testing phone input with minimal logic to isolate the clearing issue.
        </p>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="font-medium text-gray-900 mb-4">Isolated Phone Input</h3>
          
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
              <strong>phoneNumberOnly state:</strong> "{phoneNumberOnly}"
            </p>
            <p className="text-sm text-gray-600">
              <strong>phoneCountryCode state:</strong> {phoneCountryCode}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Value length:</strong> {phoneNumberOnly.length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="font-medium text-gray-900 mb-4">Debug Log</h3>
          <div className="bg-gray-50 rounded p-3 max-h-60 overflow-y-auto">
            {debugLog.length === 0 ? (
              <p className="text-sm text-gray-500">Start typing to see debug info...</p>
            ) : (
              debugLog.map((log, index) => (
                <p key={index} className="text-xs text-gray-700 font-mono">{log}</p>
              ))
            )}
          </div>
          <button 
            onClick={() => setDebugLog([])}
            className="mt-2 px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
          >
            Clear Log
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Test Instructions:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Try typing a single digit (e.g., "1")</li>
            <li>Check if it appears and stays in the input</li>
            <li>Try typing more digits</li>
            <li>Check the debug log for any unexpected behavior</li>
            <li>Try different countries to see if the issue is country-specific</li>
          </ol>
        </div>

        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-900 mb-2">Country Test Buttons:</h3>
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
      </div>
    </div>
  );
}

export default PhoneMaskInputIsolatedTest;
