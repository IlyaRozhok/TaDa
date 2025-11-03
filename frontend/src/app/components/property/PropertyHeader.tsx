"use client";

import React from "react";
import Link from "next/link";
import { Button } from "../ui/Button";
import Logo from "../Logo";
import { MapPin, Calendar } from "lucide-react";
import { Property } from "../../types";

interface PropertyHeaderProps {
  property: Property;
  publishDate: Date;
  onSignUpClick: () => void;
}

export default function PropertyHeader({
  property,
  publishDate,
  onSignUpClick,
}: PropertyHeaderProps) {
  return (
    <>
      {/* Top header with logo and sign up */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <Logo size="sm" />
              </Link>
            </div>
            <nav className="flex items-center space-x-6">
              <Button
                size="sm"
                onClick={onSignUpClick}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                Sign Up
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Title + location + publish date */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {property.title}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{property.address}</span>
          </div>
          <span className="text-gray-300">•</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Publish date</span>
            <span className="font-medium text-gray-800">
              {publishDate.toLocaleDateString("en-GB")}
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
