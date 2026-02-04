import { useState } from "react";
import { PropertyFormData } from "../types";

const initialFormData: PropertyFormData = {
  title: "",
  apartment_number: "",
  building_type: "private_landlord",
  building_id: "",
  operator_id: "",
  address: "",
  tenant_type: [],
  price: "",
  security_deposit: "",
  admin_fee: "",
  description: "",
  bedrooms: 1,
  bathrooms: 1,
  size_sqm: 0,
  floor: 0,
  balcony: false,
  terrace: false,
  amenities: [],
  is_concierge: false,
  concierge_hours: null,
  pet_policy: false,
  pets: [],
  smoking_area: false,
  metro_stations: [],
  commute_times: [],
  local_essentials: [],
  available_from: "",
  minimum_stay: 6,
  maximum_stay: 12,
  bills: "excluded",
  furnishing: "unfurnished",
  property_type: "apartment",
};

export const usePropertyForm = () => {
  const [formData, setFormData] = useState<PropertyFormData>(initialFormData);

  const updateFormData = (updates: Partial<PropertyFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
  };

  return {
    formData,
    setFormData,
    updateFormData,
    resetForm,
  };
};