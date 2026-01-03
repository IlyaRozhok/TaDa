# Onboarding Profile Phone Input Update

## Changes Made

### 1. Added PhoneMaskInput to OnboardingProfileStep
- **File**: `frontend/src/app/components/onboarding/OnboardingProfileStep.tsx`
- **Replaced**: Basic `InputField` with `type="tel"` with `PhoneMaskInput` component
- **Features**: Country code selector, phone mask patterns, auto-save integration

### 2. Fixed PhoneMaskInput Bug
- **Issue**: Users couldn't type more than 1 number in the phone input
- **Root Cause**: Value handling issues in InputMask onChange and country change events
- **File**: `frontend/src/shared/ui/PhoneMaskInput/PhoneMaskInput.tsx`

### 3. Bug Fixes Applied

#### Value Handling Fix
```typescript
// Before (problematic)
const handleChange = (e: InputMaskChangeEvent) => {
  const newValue = e.value;
  setPhoneValue(newValue);
  onChange(newValue);
};

// After (fixed)
const handleChange = (e: InputMaskChangeEvent) => {
  const newValue = e.value || "";
  setPhoneValue(newValue);
  onChange(newValue || undefined);
};
```

#### Country Change Fix
```typescript
// Before (problematic)
const handleCountryChange = (country: Country) => {
  setSelectedCountry(country);
  setIsDropdownOpen(false);
  setPhoneValue(undefined);  // ❌ undefined caused issues
  onChange(undefined);       // ❌ undefined caused issues
  onCountryChange?.(country.code);
};

// After (fixed)
const handleCountryChange = (country: Country) => {
  setSelectedCountry(country);
  setIsDropdownOpen(false);
  setPhoneValue("");         // ✅ empty string works better
  onChange("");              // ✅ empty string works better
  onCountryChange?.(country.code);
};
```

#### InputMask Configuration Fix
```typescript
// Added these props to InputMask:
<InputMask
  value={phoneValue || ""}  // ✅ Ensure never undefined
  unmask={false}            // ✅ Keep formatting characters
  // ... other props
/>
```

### 4. Phone Mask Pattern Fix
- **Issue**: UK/GB phone mask was incorrect (`"99-9999-9999"`)
- **Fixed**: Updated to proper UK format (`"9999 999999"`)
- **Added**: GB entry to phoneMasks for consistency

### 5. Integration with Onboarding Flow
- **Phone Parsing**: Added logic to parse existing phone numbers and extract country code
- **Auto-save**: Preserved existing auto-save functionality with 500ms debounce
- **State Management**: Added `phoneCountryCode` and `phoneNumberOnly` state variables
- **Full Phone Number**: Combines country code + phone number for API storage

## Testing Components Created

### 1. OnboardingProfileStep.test.tsx
- Tests the integration of PhoneMaskInput in onboarding flow
- Verifies phone number parsing from existing data
- Tests auto-save functionality

### 2. PhoneMaskInput.debug.tsx
- Specific debug component for testing the typing bug fix
- Real-time debug information showing value changes
- Test controls for clearing and setting values

## Key Features

### Phone Input in Onboarding
- ✅ Fixed-width country selector (144px)
- ✅ Country code detection from existing phone numbers
- ✅ Phone mask patterns for all countries
- ✅ Auto-save integration with existing onboarding flow
- ✅ Proper phone number parsing and storage

### Bug Fixes
- ✅ Can now type multiple digits (fixed the 1-number limitation)
- ✅ Proper value handling in controlled component
- ✅ Country changes work correctly
- ✅ No undefined value issues
- ✅ InputMask formatting preserved

### User Experience
- ✅ Mask placeholder guides input (e.g., `9999 999999` for UK)
- ✅ Underscore slot characters show where to type
- ✅ Format hint shows expected pattern
- ✅ Smooth country switching
- ✅ Auto-save after 500ms of inactivity

## Expected Behavior

1. **Phone Field Display**: Shows UK flag and +44 for GB users
2. **Input Capability**: Can type multiple digits (e.g., 1234567890)
3. **Mask Formatting**: Formats as "1234 567890" for UK numbers
4. **Country Switching**: Updates mask pattern when country changes
5. **Auto-save**: Saves to API after 500ms debounce
6. **Parsing**: Correctly parses existing phone numbers like "+447123456789"

## Implementation Notes

- Phone number storage format unchanged (still `+447123456789`)
- Backward compatibility maintained with existing data
- Auto-save functionality preserved from original onboarding
- Component can be reused in other forms
- Debug tools available for testing

## Files Modified

1. `frontend/src/app/components/onboarding/OnboardingProfileStep.tsx` - Main integration
2. `frontend/src/shared/ui/PhoneMaskInput/PhoneMaskInput.tsx` - Bug fixes
3. `frontend/src/shared/lib/phoneMasks.ts` - UK mask pattern fix
4. Created test components for verification
