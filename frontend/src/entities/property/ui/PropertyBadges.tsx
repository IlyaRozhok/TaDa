import React from "react";
import { Property } from "@/app/types";

interface PropertyBadgesProps {
  property: Property;
}

export const PropertyBadges: React.FC<PropertyBadgesProps> = ({ property }) => {
  return (
    <>
      {/* BTR Badge */}
      {property.is_btr && (
        <div className="absolute top-3 left-3 bg-violet-600 text-white px-2 py-1 rounded-md text-xs font-medium">
          BTR
        </div>
      )}
    </>
  );
};
