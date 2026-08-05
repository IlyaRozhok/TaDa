import { useState } from "react";
import type { BuildingFormData } from "../types";

const initialBuildingFormData: BuildingFormData = {
  name: "",
  description: "",
  address: "",
  number_of_units: null,
  type_of_unit: [],
  logo: "",
  video: "",
  photos: [],
  documents: "",
  metro_stations: [],
  areas: [],
  districts: [],
  amenities: [],
  pet_policy: false,
  pets: null,
  tenant_type: [],
  family_status: [],
  occupation: [],
  children: [],
  operator_id: null,
};

export const useBuildingForm = () => {
  const [formData, setFormData] = useState<BuildingFormData>(
    initialBuildingFormData,
  );

  // Reproduces the post-submit reset exactly as it was: unlike the initial
  // state, number_of_units resets to 1, not null.
  const resetForm = () => {
    setFormData({
      ...initialBuildingFormData,
      number_of_units: 1,
    });
  };

  return { formData, setFormData, resetForm };
};
