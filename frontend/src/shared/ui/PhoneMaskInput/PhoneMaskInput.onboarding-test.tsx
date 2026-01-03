"use client";

import React, { useState, useCallback } from "react";
import PhoneMaskInput from "./PhoneMaskInput";
import { getCountryByCode, getDefaultCountry } from "../../lib/countries";

export function PhoneMaskInputOnboardingTest() {
  const [phoneCountryCode, setPhoneCountryCode] = useState("GB");
  const [phoneNumberOnly, setPhoneNumberOnly] = useState("");
  const [formData, setFormData] = useState({ phone: "" });
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLog(prev => [...prev.slice(-9), `${timestamp}: ${message}`]);
  };

  // Simulate the exact logic from onboarding
  const handleInputChange = useCallback(
    (field: string, value: string | number) => {
      addLog(`handleInputChange called: ${field} = "${value}"`);
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">PhoneMaskInput Onboarding Simulation</h1>
        <p className="text-gray-600 mb-8">
          Testing the exact same logic as used in the onboarding component.
        </p>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="font-medium text-gray-900 mb-4">Onboarding Phone Input Simulation</h3>
          
          <PhoneMaskInput
            countryCode={phoneCountryCode}
            label="Phone Number"
            value={phoneNumberOnly}
            onChange={(value) => {
              addLog(`PhoneMaskInput onChange: "${value}"`);
              setPhoneNumberOnly(value || "");
              
              // Exact logic from onboarding
              const country = getCountryByCode(phoneCountryCode) || getDefaultCountry();
              if (value) {
                const digitsOnly = value.replace(/\D/g, '');
                const fullPhoneNumber = `${country.dialCode}${digitsOnly}`;
                addLog(`Processed full phone: "${fullPhoneNumber}"`);
                handleInputChange("phone", fullPhoneNumber);
              } else {
                addLog(`Empty value, clearing phone`);
                handleInputChange("phone", "");
              }
            }}
            onCountryChange={(countryCode) => {
              addLog(`Country changed to: ${countryCode}`);
              setPhoneCountryCode(countryCode);
              setPhoneNumberOnly("");
              handleInputChange("phone", "");
            }}
            required
          />
          
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">
              <strong>phoneNumberOnly:</strong> "{phoneNumberOnly}"
            </p>
            <p className="text-sm text-gray-600">
              <strong>phoneCountryCode:</strong> {phoneCountryCode}
            </p>
            <p className="text-sm text-gray-600">
              <strong>formData.phone:</strong> "{formData.phone}"
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
            <li>Try typing "7123456789" (UK number)</li>
            <li>Watch if characters appear and stay</li>
            <li>Check debug log for any issues</li>
            <li>Try changing country and typing again</li>
          </ol>
        </div>

        <div className="mt-4">
          <h3 className="font-medium text-gray-900 mb-2">Quick Actions:</h3>
          <div className="space-x-2">
            <button
              onClick={() => {
                setPhoneNumberOnly("");
                setFormData({ phone: "" });
                addLog("Manual reset");
              }}
              className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Reset All
            </button>
            <button
              onClick={() => {
                setPhoneCountryCode("US");
                setPhoneNumberOnly("");
                handleInputChange("phone", "");
                addLog("Switched to US");
              }}
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Switch to US
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PhoneMaskInputOnboardingTest;
