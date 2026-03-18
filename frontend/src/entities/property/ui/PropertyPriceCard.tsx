"use client";

import React from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/shared/ui/Button/Button";
import { Property } from "@/app/types";
import { useTranslation } from "@/app/hooks/useTranslation";
import {
  listingPropertyKeys,
  propertyDetailsKeys,
} from "@/app/lib/translationsKeys/listingPropertyTranslationKeys";

interface PropertyPriceCardProps {
  property: Property;
}

export function PropertyPriceCard({ property }: PropertyPriceCardProps) {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-baseline gap-2 mb-4">
        <div className="text-4xl font-bold text-gray-900">
          £{property.price.toLocaleString()}
        </div>
        <div className="text-gray-500">{t(propertyDetailsKeys.pcm)}</div>
      </div>
      <Button className="w-full h-12 rounded-full text-base">
        Book this appartment
      </Button>

      <div className="mt-6 border-t pt-4">
        <div className="text-sm text-gray-600 mb-2">
          {t(listingPropertyKeys.availability.availableFrom)}
        </div>
        <div className="flex items-center text-gray-900 font-medium">
          <Calendar className="w-4 h-4 mr-2" />
          {property.available_from
            ? new Date(property.available_from).toLocaleDateString("en-GB")
            : "To be confirmed"}
        </div>
      </div>
    </div>
  );
}
