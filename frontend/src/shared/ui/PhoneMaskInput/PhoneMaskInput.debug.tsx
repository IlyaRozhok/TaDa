/**
 * Debug component to test PhoneMaskInput bug fixes
 * Specifically tests the issue where users couldn't type more than 1 number
 */

import React, { useState } from "react";
import { PhoneMaskInput } from "./PhoneMaskInput";

export function PhoneMaskInputDebug() {
  const [value, setValue] = useState<string | undefined>("");
  const [countryCode, setCountryCode] = useState("GB");
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  const handleChange = (newValue: string | undefined) => {
    setValue(newValue);
    addDebugInfo(`Value changed: "${newValue}" (length: ${newValue?.length || 0})`);
  };

  const handleCountryChange = (newCountryCode: string) => {
    setCountryCode(newCountryCode);
    addDebugInfo(`Country changed: ${newCountryCode}`);
  };

  const clearValue = () => {
    setValue("");
    addDebugInfo("Value cleared manually");
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-4">PhoneMaskInput Debug Test</h2>
      <p className="text-gray-600 mb-6">
        Test the bug fix for typing multiple numbers. Try typing several digits to verify the fix works.
      </p>

      <div className="space-y-6">
        {/* Phone Input */}
        <div>
          <PhoneMaskInput
            countryCode={countryCode}
            label="Phone Number"
            value={value}
            onChange={handleChange}
            onCountryChange={handleCountryChange}
            required
          />
        </div>

        {/* Debug Controls */}
        <div className="flex gap-2">
          <button
            onClick={clearValue}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear Value
          </button>
          <button
            onClick={() => setValue("1234567890")}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Set Test Value
          </button>
        </div>

        {/* Debug Information */}
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-medium mb-2">Debug Information:</h3>
          <div className="space-y-1 text-sm font-mono">
            <p><strong>Current Value:</strong> "{value}" (length: {value?.length || 0})</p>
            <p><strong>Country Code:</strong> {countryCode}</p>
            <p><strong>Value Type:</strong> {typeof value}</p>
          </div>
        </div>

        {/* Debug Log */}
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-medium mb-2">Change Log:</h3>
          <div className="space-y-1 text-sm font-mono text-gray-700 max-h-32 overflow-y-auto">
            {debugInfo.length === 0 ? (
              <p className="text-gray-500">No changes yet. Start typing in the phone field.</p>
            ) : (
              debugInfo.map((info, index) => (
                <p key={index}>{info}</p>
              ))
            )}
          </div>
        </div>

        {/* Test Instructions */}
        <div className="bg-yellow-50 p-4 rounded">
          <h3 className="font-medium text-yellow-900 mb-2">Test Instructions:</h3>
          <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
            <li>Try typing multiple digits in the phone field</li>
            <li>Verify you can type more than 1 number</li>
            <li>Test changing countries and typing again</li>
            <li>Check that the mask pattern updates correctly</li>
            <li>Verify the debug log shows all changes</li>
          </ol>
        </div>

        {/* Expected Results */}
        <div className="bg-green-50 p-4 rounded">
          <h3 className="font-medium text-green-900 mb-2">Expected Results:</h3>
          <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
            <li>Should be able to type multiple digits (e.g., 1234567890)</li>
            <li>Mask should format the input (e.g., "12 3456 789012" for GB)</li>
            <li>Value should update in real-time in debug info</li>
            <li>Country changes should reset the value and update mask</li>
            <li>No console errors should appear</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default PhoneMaskInputDebug;
