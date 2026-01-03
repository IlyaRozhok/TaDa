"use client";

import React, { useState } from "react";
import { InputMask, InputMaskChangeEvent } from "primereact/inputmask";

export function PhoneMaskInputDebugSimple() {
  const [value1, setValue1] = useState<string>("");
  const [value2, setValue2] = useState<string>("");
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLog(prev => [...prev.slice(-9), `${timestamp}: ${message}`]);
  };

  const handleChange1 = (e: InputMaskChangeEvent) => {
    const newValue = e.value || "";
    addLog(`Direct InputMask - onChange: "${newValue}"`);
    setValue1(newValue);
  };

  const handleChange2 = (e: InputMaskChangeEvent) => {
    const newValue = e.value || "";
    addLog(`Through function - onChange: "${newValue}"`);
    
    // Simulate what our component does
    const processedValue = newValue || undefined;
    setValue2(processedValue || "");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">PhoneMaskInput Debug - Simple Test</h1>
        <p className="text-gray-600 mb-8">
          Testing InputMask directly to isolate the clearing issue.
        </p>
        
        <div className="space-y-6">
          {/* Test 1: Direct InputMask */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-medium text-gray-900 mb-4">Test 1: Direct InputMask (US Phone)</h3>
            <InputMask
              value={value1}
              onChange={handleChange1}
              mask="(999) 999-9999"
              placeholder="(999) 999-9999"
              slotChar="_"
              unmask={false}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <p className="text-sm text-gray-600 mt-2">
              <strong>Value:</strong> "{value1}" (Length: {value1.length})
            </p>
          </div>

          {/* Test 2: Through function */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-medium text-gray-900 mb-4">Test 2: Through Function Processing</h3>
            <InputMask
              value={value2}
              onChange={handleChange2}
              mask="(999) 999-9999"
              placeholder="(999) 999-9999"
              slotChar="_"
              unmask={false}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <p className="text-sm text-gray-600 mt-2">
              <strong>Value:</strong> "{value2}" (Length: {value2.length})
            </p>
          </div>

          {/* Debug Log */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-medium text-gray-900 mb-4">Debug Log</h3>
            <div className="bg-gray-50 rounded p-3 max-h-40 overflow-y-auto">
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

          {/* Reset buttons */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-medium text-gray-900 mb-4">Reset Tests</h3>
            <div className="space-x-2">
              <button 
                onClick={() => setValue1("")}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Reset Test 1
              </button>
              <button 
                onClick={() => setValue2("")}
                className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Reset Test 2
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-900 mb-2">Test Instructions:</h3>
          <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
            <li>Try typing in both inputs</li>
            <li>See if one works better than the other</li>
            <li>Check if the issue is with InputMask itself or our processing</li>
            <li>Watch the debug log for any differences</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default PhoneMaskInputDebugSimple;
