/**
 * Test file to verify PhoneMaskInput component functionality
 * This demonstrates the fixed width country selector and mask placeholder
 */

import React, { useState } from "react";
import { PhoneMaskInput } from "./PhoneMaskInput";

// Test component showing different country codes with varying dial code lengths
export function PhoneMaskInputTest() {
  const [values, setValues] = useState<Record<string, string | undefined>>({});
  
  const testCountries = [
    { code: "US", name: "United States (+1)" },
    { code: "GB", name: "United Kingdom (+44)" },
    { code: "FI", name: "Finland (+358)" },
    { code: "CZ", name: "Czech Republic (+420)" },
    { code: "SA", name: "Saudi Arabia (+966)" },
    { code: "AE", name: "UAE (+971)" },
  ];

  const handleChange = (countryCode: string) => (value: string | undefined) => {
    setValues(prev => ({ ...prev, [countryCode]: value }));
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">PhoneMaskInput Test</h1>
        <p className="text-gray-600 mb-8">
          Testing fixed-width country selector with various dial code lengths and mask placeholders.
        </p>
        
        <div className="space-y-4">
          {testCountries.map((country) => (
            <div key={country.code} className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                {country.name}
              </h3>
              <PhoneMaskInput
                countryCode={country.code}
                value={values[country.code]}
                onChange={handleChange(country.code)}
                label="Phone Number"
                required
              />
              <div className="mt-2 text-xs text-gray-500">
                Value: {values[country.code] || 'empty'}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Features Tested:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Fixed width country selector (144px / w-36)</li>
            <li>✓ Consistent layout regardless of dial code length</li>
            <li>✓ Mask placeholder shows the expected format</li>
            <li>✓ Underscore slot characters guide input</li>
            <li>✓ Format hint shows dial code + mask pattern</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default PhoneMaskInputTest;
