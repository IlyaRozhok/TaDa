"use client";

import { useState, useEffect } from "react";
import {
  X,
  Home,
  Users,
  Search,
  Star,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

const slides = [
  {
    id: 1,
    icon: Home,
    title: "Welcome to TaDa!",
    subtitle: "Your Property Platform",
    description:
      "Discover your perfect home with our intelligent matching system. We help you find properties that match your lifestyle and preferences.",
    color: "from-blue-500 to-purple-600",
  },
  {
    id: 2,
    icon: Search,
    title: "Smart Property Search",
    subtitle: "Find Your Perfect Match",
    description:
      "Our advanced algorithm analyzes your preferences and matches you with properties that fit your lifestyle, budget, and requirements.",
    color: "from-green-500 to-teal-600",
  },
  {
    id: 3,
    icon: Star,
    title: "Personalized Experience",
    subtitle: "Tailored Just for You",
    description:
      "Save your favorite properties, track your search history, and get personalized recommendations based on your activity.",
    color: "from-orange-500 to-red-600",
  },
];

export default function WelcomeModal({
  isOpen,
  onClose,
  userName,
}: WelcomeModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setCurrentSlide(0);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isOpen) return null;

  const currentSlideData = slides[currentSlide];
  const IconComponent = currentSlideData.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-2xl mx-4 transition-all duration-300 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute -top-4 -right-4 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        {/* Modal content */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with gradient */}
          <div
            className={`bg-gradient-to-r ${currentSlideData.color} p-8 text-white relative overflow-hidden`}
          >
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {currentSlideData.title}
                    </h2>
                    <p className="text-white/80">{currentSlideData.subtitle}</p>
                  </div>
                </div>
              </div>

              {userName && currentSlide === 0 && (
                <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                  <p className="text-lg font-medium">Hello, {userName}! 👋</p>
                  <p className="text-white/90 text-sm mt-1">
                    We're excited to have you here
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              {currentSlideData.description}
            </p>

            {/* Progress dots */}
            <div className="flex justify-center gap-2 mb-6">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentSlide
                      ? "bg-blue-500 w-6"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={prevSlide}
                disabled={currentSlide === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  currentSlide === 0
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </button>

              {currentSlide === slides.length - 1 ? (
                <button
                  onClick={handleClose}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={nextSlide}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
