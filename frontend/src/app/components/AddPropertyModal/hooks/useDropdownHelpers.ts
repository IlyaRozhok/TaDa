import { useState, useEffect } from "react";
import { MetroStation, Pet, PropertyFormData } from "../types";

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
      "tenant_types",
      "amenities",
      "family_status",
      "occupation",
      "children",
      "pet_policy",
      "pets",
      "smoking_area_prop",
      "metro_stations",
    ];
    return (
      formData.building_type !== "private_landlord" &&
      !!formData.building_id &&
      inheritedFields.includes(fieldName)
    );
  };

  // Metro Stations helpers
  const addMetroStation = () => {
    updateFormData({
      metro_stations: [
        ...formData.metro_stations,
        { label: "", destination: undefined },
      ],
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

  // Pet helpers
  const addPet = () => {
    updateFormData({
      pets: [...(formData.pets || []), { type: "dog" as const }],
    });
  };

  const updatePet = (index: number, updates: Partial<Pet>) => {
    const list = formData.pets || [];
    const updated = list.map((pet, i) =>
      i === index ? { ...pet, ...updates } : pet,
    );
    updateFormData({ pets: updated });
  };

  const removePet = (index: number) => {
    const list = formData.pets || [];
    updateFormData({
      pets: list.filter((_, i) => i !== index),
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
    // Pets
    addPet,
    updatePet,
    removePet,
  };
};