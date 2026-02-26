import { useState, useCallback } from "react";
import { PropertyFormData } from "../types";

const initialFormData: PropertyFormData = {
  title: "",
  apartment_number: "",
  descriptions: "",
  price: null,
  deposit: null,
  available_from: null,
  bills: "",
  property_type: "",
  bedrooms: null,
  bathrooms: null,
  building_type: "",
  luxury: false,
  furnishing: "",
  let_duration: [],
  floor: null,
  outdoor_space: false,
  balcony: false,
  terrace: false,
  square_meters: null,
  photos: [],
  video: "",
  documents: "",
  building_id: "",
  address: "",
  tenant_types: [],
  amenities: [],
  pets: null,
  is_concierge: false,
  concierge_hours: null,
  pet_policy: false,
  smoking_area_prop: false,
  metro_stations: [],
  commute_times: [],
  local_essentials: [],
  operator_id: "",
};

export const usePropertyForm = () => {
  const [formData, setFormData] = useState<PropertyFormData>(initialFormData);

  const updateFormData = useCallback(
    (updates: Partial<PropertyFormData>) => {
      setFormData((prev) => ({ ...prev, ...updates }));
    },
    [],
  );

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
