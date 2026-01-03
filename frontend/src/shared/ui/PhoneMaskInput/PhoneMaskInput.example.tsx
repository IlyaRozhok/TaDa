/**
 * Example usage of PhoneMaskInput component
 * 
 * Note: To use PrimeReact components, you may need to import PrimeReact CSS in your layout:
 * import "primereact/resources/themes/lara-light-blue/theme.css";
 * import "primereact/resources/primereact.min.css";
 * import "primeicons/primeicons.css";
 */

import React, { useState } from "react";
import { PhoneMaskInput } from "./PhoneMaskInput";

export default function PhoneMaskInputExample() {
  const [value, setValue] = useState<string | undefined>();
  const [countryCode, setCountryCode] = useState("US");

  return (
    <div className="p-4 max-w-md">
      <PhoneMaskInput
        countryCode={countryCode}
        value={value}
        onChange={(e) => setValue(e)}
        label="Phone Number"
        required
        onCountryChange={(code) => setCountryCode(code)}
      />
      
      {/* Show current values for debugging */}
      <div className="mt-4 text-sm text-gray-600">
        <p>Country: {countryCode}</p>
        <p>Value: {value || 'empty'}</p>
      </div>
    </div>
  );
}

// Example with different country codes showing fixed width
export function PhoneMaskInputExamples() {
  const [usValue, setUsValue] = useState<string | undefined>();
  const [gbValue, setGbValue] = useState<string | undefined>();
  const [frValue, setFrValue] = useState<string | undefined>();
  const [saValue, setSaValue] = useState<string | undefined>(); // Saudi Arabia has long dial code

  return (
    <div className="flex flex-col gap-6 p-4 max-w-md">
      <div>
        <PhoneMaskInput
          countryCode="US"
          value={usValue}
          onChange={(e) => setUsValue(e)}
          label="US Phone Number"
        />
      </div>

      <div>
        <PhoneMaskInput
          countryCode="GB"
          value={gbValue}
          onChange={(e) => setGbValue(e)}
          label="UK Phone Number"
        />
      </div>

      <div>
        <PhoneMaskInput
          countryCode="FR"
          value={frValue}
          onChange={(e) => setFrValue(e)}
          label="France Phone Number"
        />
      </div>

      <div>
        <PhoneMaskInput
          countryCode="SA"
          value={saValue}
          onChange={(e) => setSaValue(e)}
          label="Saudi Arabia Phone Number"
        />
      </div>
    </div>
  );
}

// Example with error state
export function PhoneMaskInputWithError() {
  const [value, setValue] = useState<string | undefined>();

  return (
    <div className="p-4">
      <PhoneMaskInput
        countryCode="US"
        value={value}
        onChange={(e) => setValue(e)}
        label="Phone Number"
        required
        error="Please enter a valid phone number"
      />
    </div>
  );
}

