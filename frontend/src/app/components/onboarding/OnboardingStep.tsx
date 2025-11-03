"use client";

import React from "react";
import Image from "next/image";
import { Button } from "../ui/Button";
import { ArrowRight, ArrowLeft } from "lucide-react";

interface OnboardingStepProps {
  title: string;
  subtitle: string;
  description: string;
  image: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  nextText?: string;
  backText?: string;
  skipText?: string;
  showBack?: boolean;
  showSkip?: boolean;
  loading?: boolean;
  disabled?: boolean;
}

export default function OnboardingStep({
  title,
  subtitle,
  description,
  image,
  icon,
  children,
  onNext,
  onBack,
  onSkip,
  nextText = "Continue",
  backText = "Back",
  skipText = "Skip",
  showBack = true,
  showSkip = false,
  loading = false,
  disabled = false,
}: OnboardingStepProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Left side - Content */}
      <div className="flex-1 flex flex-col justify-center px-6 lg:px-12 py-8">
        <div className="max-w-md mx-auto lg:mx-0">
          {/* Icon and Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              {icon}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
              <p className="text-lg text-blue-600 font-medium">{subtitle}</p>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-lg leading-relaxed mb-8">
            {description}
          </p>

          {/* Step Content */}
          {children && <div className="mb-8">{children}</div>}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {showBack && onBack && (
              <Button
                onClick={onBack}
                variant="outline"
                className="flex items-center justify-center gap-2"
                disabled={loading}
              >
                <ArrowLeft className="w-4 h-4" />
                {backText}
              </Button>
            )}

            {showSkip && onSkip && (
              <Button
                onClick={onSkip}
                variant="ghost"
                className="text-gray-600 hover:text-gray-800"
                disabled={loading}
              >
                {skipText}
              </Button>
            )}

            {onNext && (
              <Button
                onClick={onNext}
                className="flex items-center justify-center gap-2 flex-1"
                disabled={disabled || loading}
              >
                {nextText}
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="flex-1 bg-gray-50 flex items-center justify-center p-8">
        <div className="relative w-full max-w-md">
          <Image
            src={image}
            alt={title}
            width={400}
            height={400}
            className="w-full h-auto object-contain"
            priority
          />
        </div>
      </div>
    </div>
  );
}
