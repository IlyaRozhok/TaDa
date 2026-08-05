import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { BuildingFormData, MetroStation, Pet } from "../types";

export const useDropdownHelpers = (
  setFormData: Dispatch<SetStateAction<BuildingFormData>>,
  mode: "create" | "edit",
) => {
  // Dropdown state
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest("[data-dropdown]")) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Toggle dropdown helper
  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  // A new row starts at 0 minutes in edit mode and empty in create mode —
  // the two monoliths disagreed and the difference is kept on purpose.
  const addMetroStation = () => {
    setFormData((prev) => ({
      ...prev,
      metro_stations: [
        ...prev.metro_stations,
        { label: "", destination: mode === "edit" ? 0 : undefined },
      ],
    }));
  };

  const removeMetroStation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      metro_stations: prev.metro_stations.filter((_, i) => i !== index),
    }));
  };

  const updateMetroStation = (
    index: number,
    field: keyof MetroStation,
    value: string | number | undefined,
  ) => {
    setFormData((prev) => ({
      ...prev,
      metro_stations: prev.metro_stations.map((station, i) =>
        i === index ? { ...station, [field]: value } : station,
      ),
    }));
  };

  const addPet = () => {
    setFormData((prev) => ({
      ...prev,
      pets: [...(prev.pets || []), { type: "dog" as const }],
    }));
  };

  const removePet = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      pets: prev.pets ? prev.pets.filter((_, i) => i !== index) : null,
    }));
  };

  const updatePet = (index: number, field: keyof Pet, value: any) => {
    setFormData((prev) => ({
      ...prev,
      pets: prev.pets
        ? prev.pets.map((pet, i) =>
            i === index ? { ...pet, [field]: value } : pet,
          )
        : null,
    }));
  };

  return {
    openDropdown,
    setOpenDropdown,
    toggleDropdown,
    addMetroStation,
    removeMetroStation,
    updateMetroStation,
    addPet,
    removePet,
    updatePet,
  };
};
