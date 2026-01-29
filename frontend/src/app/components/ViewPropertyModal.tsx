"use client";

import React, { useState } from "react";
import {
  X,
  MapPin,
  Bed,
  Bath,
  DoorClosed,
  Star,
  Users,
  Shield,
  Clock,
  Train,
  Car,
  ShoppingBag,
  Dog,
  Cigarette,
  Copy,
  Check,
} from "lucide-react";
import { Property } from "../types/property";

interface ViewPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
  onCopyId?: (id: string, type: "property" | "building") => void;
}

const ViewPropertyModal: React.FC<ViewPropertyModalProps> = ({
  isOpen,
  onClose,
  property,
  onCopyId,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen || !property) return null;

  const handleCopyId = async (id: string, type: "property" | "building") => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      if (onCopyId) {
        onCopyId(id, type);
      }
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const truncateId = (id: string, maxLength: number = 8) => {
    return id.length > maxLength ? `${id.substring(0, maxLength)}...` : id;
  };

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
                  <span className="text-white/70">Property ID</span>
                  <button
                    onClick={() =>
                      property.id && handleCopyId(property.id, "property")
                    }
                    className="flex items-center gap-1.5 font-mono text-sm text-white hover:text-white/80 transition-colors group"
                    title={`Click to copy: ${property.id}`}
                  >
                    <span>{truncateId(property.id || "", 8)}</span>
                    {copiedId === property.id ? (
                      <Check className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-white/50 group-hover:text-white/70" />
                    )}
                  </button>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white/70">Building ID</span>
                  <button
                    onClick={() => {
                      const buildingId =
                        property.building_id || property.building?.id;
                      if (buildingId) {
                        handleCopyId(buildingId, "building");
                      }
                    }}
                    className="flex items-center gap-1.5 font-mono text-sm text-white hover:text-white/80 transition-colors group"
                    title={`Click to copy: ${property.building_id || property.building?.id || ""}`}
                    disabled={!property.building_id && !property.building?.id}
                  >
                    <span>
                      {truncateId(
                        property.building_id || property.building?.id || "",
                        8,
                      ) || "N/A"}
                    </span>
                    {(property.building_id || property.building?.id) &&
                      (copiedId ===
                      (property.building_id || property.building?.id) ? (
                        <Check className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-white/50 group-hover:text-white/70" />
                      ))}
                  </button>
                </div>
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

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="bg-white/5 backdrop-blur-[5px] border border-white/10 p-4 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Amenities
              </h3>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((amenity, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-white/10 backdrop-blur-[5px] border border-white/20 text-white rounded-lg text-sm"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tenant Types */}
          {property.tenant_types && property.tenant_types.length > 0 && (
            <div className="bg-white/5 backdrop-blur-[5px] border border-white/10 p-4 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Tenant Types
              </h3>
              <div className="flex flex-wrap gap-2">
                {property.tenant_types.map((type, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-white/10 backdrop-blur-[5px] border border-white/20 text-white rounded-lg text-sm"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Concierge Information */}
          {property.is_concierge && (
            <div className="bg-white/5 backdrop-blur-[5px] border border-white/10 p-4 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Concierge Service
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-white/70">Available:</span>
                  <span className="font-medium text-white">Yes</span>
                </div>
                {property.concierge_hours && (
                  <div className="flex items-center gap-2">
                    <span className="text-white/70">Hours:</span>
                    <span className="font-medium text-white">
                      {property.concierge_hours.from != null &&
                      property.concierge_hours.to != null
                        ? `${property.concierge_hours.from}:00 - ${property.concierge_hours.to}:00`
                        : "N/A"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pet Policy */}
          {property.pet_policy !== undefined && (
            <div className="bg-white/5 backdrop-blur-[5px] border border-white/10 p-4 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Dog className="w-5 h-5" />
                Pet Policy
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-white/70">Pets Allowed:</span>
                  <span className="font-medium text-white">
                    {property.pet_policy ? "Yes" : "No"}
                  </span>
                </div>
                {property.pets && property.pets.length > 0 && (
                  <div className="mt-3">
                    <span className="text-white/70 block mb-2">
                      Allowed Pet Types:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {property.pets.map((pet, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-white/10 backdrop-blur-[5px] border border-white/20 text-white rounded-lg text-sm"
                        >
                          {pet.type === "other" && pet.customType
                            ? pet.customType
                            : pet.type.charAt(0).toUpperCase() +
                              pet.type.slice(1)}
                          {pet.size && ` (${pet.size})`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Smoking Area */}
          {property.smoking_area !== undefined && (
            <div className="bg-white/5 backdrop-blur-[5px] border border-white/10 p-4 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Cigarette className="w-5 h-5" />
                Smoking Area
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-white/70">Available:</span>
                <span className="font-medium text-white">
                  {property.smoking_area ? "Yes" : "No"}
                </span>
              </div>
            </div>
          )}

          {/* Metro Stations */}
          {property.metro_stations && property.metro_stations.length > 0 && (
            <div className="bg-white/5 backdrop-blur-[5px] border border-white/10 p-4 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Train className="w-5 h-5" />
                Metro Stations
              </h3>
              <div className="space-y-2">
                {property.metro_stations.map((station, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-2 border-b border-white/10 last:border-0"
                  >
                    <span className="text-white/90">{station.label}</span>
                    {station.destination != null && (
                      <span className="text-white/70 text-sm">
                        {station.destination} min
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Commute Times */}
          {property.commute_times && property.commute_times.length > 0 && (
            <div className="bg-white/5 backdrop-blur-[5px] border border-white/10 p-4 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Car className="w-5 h-5" />
                Commute Times
              </h3>
              <div className="space-y-2">
                {property.commute_times.map((commute, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-2 border-b border-white/10 last:border-0"
                  >
                    <span className="text-white/90">{commute.label}</span>
                    {commute.destination != null && (
                      <span className="text-white/70 text-sm">
                        {commute.destination} min
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Local Essentials */}
          {property.local_essentials &&
            property.local_essentials.length > 0 && (
              <div className="bg-white/5 backdrop-blur-[5px] border border-white/10 p-4 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Local Essentials
                </h3>
                <div className="space-y-2">
                  {property.local_essentials.map((essential, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-2 border-b border-white/10 last:border-0"
                    >
                      <span className="text-white/90">{essential.label}</span>
                      {essential.destination != null && (
                        <span className="text-white/70 text-sm">
                          {essential.destination} min
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Luxury Flag */}
          {property.luxury !== undefined && (
            <div className="bg-white/5 backdrop-blur-[5px] border border-white/10 p-4 rounded-xl">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                <span className="text-lg font-semibold text-white">
                  {property.luxury ? "Luxury Property" : "Standard Property"}
                </span>
              </div>
            </div>
          )}

          {/* Operator Info as JSON */}
          {property.operator && (
            <div className="bg-white/5 backdrop-blur-[5px] border border-white/10 p-4 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-3">
                Property Operator (JSON)
              </h3>
              <pre className="bg-black/30 backdrop-blur-[5px] border border-white/20 p-4 rounded-lg overflow-x-auto text-sm text-white/90 font-mono">
                {JSON.stringify(property.operator, null, 2)}
              </pre>
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
