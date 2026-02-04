import { useState, useEffect } from "react";
import { MetroStation, CommuteTime, LocalEssential, Pet, PropertyFormData } from "../types";

export const useDropdownHelpers = (
  formData: PropertyFormData,
  updateFormData: (updates: Partial<PropertyFormData>) => void
) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-dropdown]")) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Toggle dropdown helper
  const toggleDropdown = (dropdownName: string) => {
    setOpenDropdown(prev => prev === dropdownName ? null : dropdownName);
  };

  // Helper to check if fields are readonly (not private_landlord and has building selected)
  const isReadonly = (fieldName: string): boolean => {
    const inheritedFields = [
      "tenant_type", "amenities", "is_concierge", "concierge_hours",
      "pet_policy", "pets", "smoking_area", "metro_stations",
      "commute_times", "local_essentials"
    ];
    return formData.building_type !== "private_landlord" && 
           formData.building_id && 
           inheritedFields.includes(fieldName);
  };

  // Metro Stations helpers
  const addMetroStation = () => {
    updateFormData({
      metro_stations: [...formData.metro_stations, { label: "", destination: 0 }]
    });
  };

  const updateMetroStation = (index: number, updates: Partial<MetroStation>) => {
    const updated = formData.metro_stations.map((station, i) =>
      i === index ? { ...station, ...updates } : station
    );
    updateFormData({ metro_stations: updated });
  };

  const removeMetroStation = (index: number) => {
    updateFormData({
      metro_stations: formData.metro_stations.filter((_, i) => i !== index)
    });
  };

  // Commute Times helpers
  const addCommuteTime = () => {
    updateFormData({
      commute_times: [...formData.commute_times, { label: "", destination: 0 }]
    });
  };

  const updateCommuteTime = (index: number, updates: Partial<CommuteTime>) => {
    const updated = formData.commute_times.map((time, i) =>
      i === index ? { ...time, ...updates } : time
    );
    updateFormData({ commute_times: updated });
  };

  const removeCommuteTime = (index: number) => {
    updateFormData({
      commute_times: formData.commute_times.filter((_, i) => i !== index)
    });
  };

  // Local Essentials helpers
  const addLocalEssential = () => {
    updateFormData({
      local_essentials: [...formData.local_essentials, { label: "", destination: 0 }]
    });
  };

  const updateLocalEssential = (index: number, updates: Partial<LocalEssential>) => {
    const updated = formData.local_essentials.map((essential, i) =>
      i === index ? { ...essential, ...updates } : essential
    );
    updateFormData({ local_essentials: updated });
  };

  const removeLocalEssential = (index: number) => {
    updateFormData({
      local_essentials: formData.local_essentials.filter((_, i) => i !== index)
    });
  };

  // Pet helpers
  const addPet = () => {
    updateFormData({
      pets: [...formData.pets, { type: "dog", size: "medium" }]
    });
  };

  const updatePet = (index: number, updates: Partial<Pet>) => {
    const updated = formData.pets.map((pet, i) =>
      i === index ? { ...pet, ...updates } : pet
    );
    updateFormData({ pets: updated });
  };

  const removePet = (index: number) => {
    updateFormData({
      pets: formData.pets.filter((_, i) => i !== index)
    });
  };

  return {
    openDropdown,
    toggleDropdown,
    isReadonly,
    // Metro stations
    addMetroStation,
    updateMetroStation,
    removeMetroStation,
    // Commute times
    addCommuteTime,
    updateCommuteTime,
    removeCommuteTime,
    // Local essentials
    addLocalEssential,
    updateLocalEssential,
    removeLocalEssential,
    // Pets
    addPet,
    updatePet,
    removePet,
  };
};