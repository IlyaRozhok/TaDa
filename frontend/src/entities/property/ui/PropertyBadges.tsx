import React from "react";
import { Property } from "@/app/types";

interface PropertyBadgesProps {
  property: Property;
}

export const PropertyBadges: React.FC<PropertyBadgesProps> = () => {
  // The BTR badge died with the phantom is_btr field — the backend never
  // served it, so the badge had never rendered.
  return null;
};
