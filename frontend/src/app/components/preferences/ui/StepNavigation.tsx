import React from "react";
import { ChevronLeft, ChevronRight, CheckCircle, Loader2 } from "lucide-react";
import { StepNavigationProps } from "@/app/types/preferences";

export const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  canGoNext = true,
  canGoPrevious = true,
  isLastStep = false,
  isLoading = false,
}) => {
  console.log("🔍 StepNavigation rendered:", {
    currentStep,
    totalSteps,
    isLastStep,
    isLoading,
    canGoNext,
    canGoPrevious,
  });

  return (
    <div className="flex items-center justify-between">
      {/* Previous Button */}
      <div className="flex items-center justify-start w-40">
        {canGoPrevious && currentStep > 1 && (
          <button
            type="button"
            onClick={onPrevious}
            disabled={isLoading}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-6 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
        )}
      </div>

      {/* Step Info & Progress Bar */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-600 whitespace-nowrap">
            Step {currentStep} of {totalSteps}
          </span>
          <div className="w-64 bg-slate-200 rounded-full h-2">
            <div
              className="bg-slate-900 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
          <span className="text-sm text-slate-500 whitespace-nowrap">
            {((currentStep / totalSteps) * 100).toFixed(0)}% Complete
          </span>
        </div>
      </div>

      {/* Next/Submit Button */}
      <div className="flex items-center justify-end w-40">
        {isLastStep ? (
          <button
            type="submit"
            disabled={isLoading}
            onClick={() => {
              console.log("🔍 Save Preferences button clicked!", {
                isLoading,
                isLastStep,
                currentStep,
                totalSteps,
              });
              // Don't prevent default - let the form handle submission
            }}
            className="px-6 py-3 bg-gradient-to-br from-slate-800 to-slate-900 hover:from-violet-500 hover:to-pink-600 text-white rounded-lg shadow-sm transition-all duration-200 font-medium flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-slate-900/10 focus:outline-none focus:ring-2 focus:ring-slate-400/20 disabled:opacity-70 min-w-[160px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Save Preferences</span>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={!canGoNext || isLoading}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
