import React from "react";
import { Property } from "../types";

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

      {/* Property Type Badge */}
      <div className="absolute bottom-3 left-3 bg-black/70 text-white px-2 py-1 rounded-md text-xs font-medium capitalize">
        {property.property_type}
      </div>
    </>
  );
};
