# Onboarding Flow Structure

## Overview

The onboarding flow is split into separate components for better maintainability and reusability.

## File Structure

```
onboarding/
├── [step]/
│   └── page.tsx              # Main onboarding page router
├── components/
│   ├── index.ts              # Component exports
│   ├── RoleSelection.tsx     # Step 1: Role selection
│   ├── OnboardingStep.tsx   # Steps 2-4: Information steps
│   └── FinalStep.tsx         # Step 5: Final step without inputs
├── hooks/
│   └── useOnboarding.ts      # Onboarding state management
└── README.md                 # This file
```

## Components

### RoleSelection

- **Purpose**: Step 1 - User selects their role (tenant/operator)
- **Props**: `selectedRole`, `onRoleSelect`, `onContinue`, `error`, `isLoading`
- **Features**: Role selection cards with images and descriptions

### OnboardingStep

- **Purpose**: Steps 2-4 - Information steps with progress bar
- **Props**: `stepData`, `currentStep`, `onBack`, `onNext`, `error`, `isLoading`
- **Features**: Image, title, description, progress bar, navigation

### FinalStep

- **Purpose**: Step 5 - Final step without input fields
- **Props**: `selectedRole`, `onComplete`, `onCompleteWithPreferences`, `error`, `isLoading`
- **Features**: Two action buttons (complete setup / skip for now)

## State Management

### useOnboarding Hook

- Manages all onboarding state
- Handles localStorage persistence
- Provides handlers for all actions
- Integrates with auth form data from localStorage

### Data Flow

1. User fills auth form → data saved to `localStorage.authFormData`
2. User goes through onboarding → role saved to `localStorage.selectedRole`
3. On final step → auth data retrieved and used for registration

## Key Features

### Data Persistence

- Auth form data persists across navigation
- Selected role persists across page refreshes
- Cleanup on successful registration

### Error Handling

- Validation errors displayed in each component
- Network errors handled gracefully
- User-friendly error messages

### Responsive Design

- Mobile-friendly layout
- Consistent styling across all steps
- Progress indication for multi-step flow

