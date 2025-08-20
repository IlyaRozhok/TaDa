"use client";

import React from "react";
import { User } from "../types";
import { Building2, MapPin } from "lucide-react";

interface OperatorCardProps {
  operator: User;
  propertiesCount: number;
  onClick?: () => void;
}

const OperatorCard: React.FC<OperatorCardProps> = ({
  operator,
  propertiesCount,
  onClick,
}) => {
  return (
    <div
      className="bg-white rounded-2xl border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-red-500 rounded-full flex flex-col items-center justify-center text-white font-bold text-xs">
            <div className="text-center leading-tight">
              <div>AUTHOR</div>
              <div>KING&apos;S</div>
              <div>CROSS</div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-black text-lg">
              {operator.full_name}
            </h3>
            <p className="text-gray-600 text-sm">Property operator</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <Building2 className="w-4 h-4" />
            <span>{propertiesCount} properties</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>London, UK</span>
          </div>
        </div>

        <div className="text-gray-600 text-sm">
          Professional property management services in London area.
        </div>
      </div>
    </div>
  );
};

export default OperatorCard;
