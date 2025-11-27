"use client";

import React from "react";
import { X, MapPin, Bed, Bath, DoorClosed } from "lucide-react";
import { Property } from "../types/property";

interface ViewPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
}

const ViewPropertyModal: React.FC<ViewPropertyModalProps> = ({
  isOpen,
  onClose,
  property,
}) => {
  if (!isOpen || !property) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[8px] flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-black/50 backdrop-blur-[19px] border border-white/10 rounded-3xl shadow-2xl w-full max-w-4xl my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {property.apartment_number}
            </h2>
            <p className="text-white/80 flex items-center gap-1 mt-1">
              <MapPin className="w-4 h-4" />
              {property.building?.name} - {property.building?.address}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 cursor-pointer hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Key Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-[5px] border border-white/20 p-4 rounded-xl">
              <div className="text-3xl font-bold text-white">
                £
                {property.price != null
                  ? property.price.toLocaleString()
                  : "N/A"}
              </div>
              <div className="text-sm text-white/70 mt-1">Per Month</div>
            </div>
            <div className="bg-white/10 backdrop-blur-[5px] border border-white/20 p-4 rounded-xl">
              <div className="text-3xl font-bold text-white">
                £
                {property.deposit != null
                  ? property.deposit.toLocaleString()
                  : "N/A"}
              </div>
              <div className="text-sm text-white/70 mt-1">Deposit</div>
            </div>
            <div className="bg-white/10 backdrop-blur-[5px] border border-white/20 p-4 rounded-xl flex items-center gap-3">
              <Bed className="w-8 h-8 text-white/80" />
              <div>
                <div className="text-2xl font-bold text-white">
                  {property.bedrooms != null ? property.bedrooms : "-"}
                </div>
                <div className="text-sm text-white/70">Bedrooms</div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-[5px] border border-white/20 p-4 rounded-xl flex items-center gap-3">
              <Bath className="w-8 h-8 text-white/80" />
              <div>
                <div className="text-2xl font-bold text-white">
                  {property.bathrooms != null ? property.bathrooms : "-"}
                </div>
                <div className="text-sm text-white/70">Bathrooms</div>
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 backdrop-blur-[5px] border border-white/10 p-4 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-3">
                Property Information
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white/70">Property Type</span>
                  <span className="font-medium text-white">
                    {property.property_type
                      ? property.property_type.charAt(0).toUpperCase() +
                        property.property_type.slice(1)
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white/70">Building Type</span>
                  <span className="font-medium text-white">
                    {property.building_type
                      ? property.building_type
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white/70">Furnishing</span>
                  <span className="font-medium text-white">
                    {property.furnishing
                      ? property.furnishing
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white/70">Let Duration</span>
                  <span className="font-medium text-white">
                    {property.let_duration
                      ? property.let_duration
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-white/70">Bills</span>
                  <span className="font-medium text-white">
                    {property.bills
                      ? property.bills.charAt(0).toUpperCase() +
                        property.bills.slice(1)
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-[5px] border border-white/10 p-4 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-3">
                Additional Details
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white/70">Floor</span>
                  <span className="font-medium text-white">
                    {property.floor != null ? property.floor : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white/70">Square Meters</span>
                  <span className="font-medium text-white">
                    {property.square_meters != null
                      ? `${property.square_meters} m²`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white/70">Available From</span>
                  <span className="font-medium text-white">
                    {property.available_from
                      ? new Date(property.available_from).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white/70">Outdoor Space</span>
                  <span className="font-medium text-white">
                    {property.outdoor_space ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white/70">Balcony</span>
                  <span className="font-medium text-white">
                    {property.balcony ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-white/70">Terrace</span>
                  <span className="font-medium text-white">
                    {property.terrace ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {property.descriptions && (
            <div className="bg-white/5 backdrop-blur-[5px] border border-white/10 p-4 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-3">
                Description
              </h3>
              <p className="text-white/90 leading-relaxed whitespace-pre-wrap">
                {property.descriptions}
              </p>
            </div>
          )}

          {/* Photos */}
          {property.photos && property.photos.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Photos</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {property.photos.map((photo, index) => (
                  <a
                    key={index}
                    href={photo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative overflow-hidden rounded-lg"
                  >
                    <img
                      src={photo}
                      alt={`Property photo ${index + 1}`}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Video */}
          {property.video && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Video Tour
              </h3>
              <video
                src={property.video}
                className="w-full rounded-lg border border-white/20"
                controls
              />
            </div>
          )}

          {/* Documents */}
          {property.documents && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Documents
              </h3>
              <a
                href={property.documents}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                <DoorClosed className="w-4 h-4 mr-2" />
                View Documents (PDF)
              </a>
            </div>
          )}

          {/* Operator Info */}
          {property.operator && (
            <div className="bg-white/5 backdrop-blur-[5px] border border-white/10 p-4 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-3">
                Property Operator
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-white">
                    {property.operator.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-white">
                    {property.operator.full_name || property.operator.email}
                  </div>
                  <div className="text-sm text-white/70">
                    {property.operator.email}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-white/10 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white cursor-pointer text-black hover:bg-white/90 rounded-lg transition-all duration-200 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewPropertyModal;
