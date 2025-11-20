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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {property.apartment_number}
            </h2>
            <p className="text-slate-600 flex items-center gap-1 mt-1">
              <MapPin className="w-4 h-4" />
              {property.building?.name} - {property.building?.address}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Key Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
              <div className="text-3xl font-bold text-blue-900">
                £
                {property.price != null
                  ? property.price.toLocaleString()
                  : "N/A"}
              </div>
              <div className="text-sm text-blue-700 mt-1">Per Month</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
              <div className="text-3xl font-bold text-green-900">
                £
                {property.deposit != null
                  ? property.deposit.toLocaleString()
                  : "N/A"}
              </div>
              <div className="text-sm text-green-700 mt-1">Deposit</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl flex items-center gap-3">
              <Bed className="w-8 h-8 text-purple-700" />
              <div>
                <div className="text-2xl font-bold text-purple-900">
                  {property.bedrooms != null ? property.bedrooms : "-"}
                </div>
                <div className="text-sm text-purple-700">Bedrooms</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-xl flex items-center gap-3">
              <Bath className="w-8 h-8 text-pink-700" />
              <div>
                <div className="text-2xl font-bold text-pink-900">
                  {property.bathrooms != null ? property.bathrooms : "-"}
                </div>
                <div className="text-sm text-pink-700">Bathrooms</div>
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Property Information
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-slate-600">Property Type</span>
                  <span className="font-medium text-slate-900">
                    {property.property_type
                      ? property.property_type.charAt(0).toUpperCase() +
                        property.property_type.slice(1)
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-slate-600">Building Type</span>
                  <span className="font-medium text-slate-900">
                    {property.building_type
                      ? property.building_type
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-slate-600">Furnishing</span>
                  <span className="font-medium text-slate-900">
                    {property.furnishing
                      ? property.furnishing
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-slate-600">Let Duration</span>
                  <span className="font-medium text-slate-900">
                    {property.let_duration
                      ? property.let_duration
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-slate-600">Bills</span>
                  <span className="font-medium text-slate-900">
                    {property.bills
                      ? property.bills.charAt(0).toUpperCase() +
                        property.bills.slice(1)
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Additional Details
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-slate-600">Floor</span>
                  <span className="font-medium text-slate-900">
                    {property.floor != null ? property.floor : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-slate-600">Square Meters</span>
                  <span className="font-medium text-slate-900">
                    {property.square_meters != null
                      ? `${property.square_meters} m²`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-slate-600">Available From</span>
                  <span className="font-medium text-slate-900">
                    {property.available_from
                      ? new Date(property.available_from).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-slate-600">Outdoor Space</span>
                  <span className="font-medium text-slate-900">
                    {property.outdoor_space ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-slate-600">Balcony</span>
                  <span className="font-medium text-slate-900">
                    {property.balcony ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-slate-600">Terrace</span>
                  <span className="font-medium text-slate-900">
                    {property.terrace ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {property.descriptions && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Description
              </h3>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                {property.descriptions}
              </p>
            </div>
          )}

          {/* Photos */}
          {property.photos && property.photos.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Photos
              </h3>
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
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Video Tour
              </h3>
              <video
                src={property.video}
                className="w-full rounded-lg"
                controls
              />
            </div>
          )}

          {/* Documents */}
          {property.documents && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Documents
              </h3>
              <a
                href={property.documents}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <DoorClosed className="w-4 h-4 mr-2" />
                View Documents (PDF)
              </a>
            </div>
          )}

          {/* Operator Info */}
          {property.operator && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Property Operator
              </h3>
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-300 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-slate-700">
                      {property.operator.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">
                      {property.operator.full_name || property.operator.email}
                    </div>
                    <div className="text-sm text-slate-600">
                      {property.operator.email}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewPropertyModal;
