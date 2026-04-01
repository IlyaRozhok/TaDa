export interface PropertyAmenitiesGroup {
  titleKey: string;
  values: string[];
  labelKeys: string[];
}

export const PROPERTY_AMENITIES_GROUPS: PropertyAmenitiesGroup[] = [
  {
    titleKey: "listing.features.access.title",
    values: ["Floor level", "Secure entry system", "Bin storage area"],
    labelKeys: [
      "listing.features.access.floorLevel",
      "listing.features.access.secureEntry",
      "listing.features.access.binArea",
    ],
  },
  {
    titleKey: "listing.features.tech.title",
    values: ["Fibre broadband", "USB / USB-C charging points", "Smart thermostat"],
    labelKeys: [
      "listing.features.tech.fibre",
      "listing.features.tech.usb",
      "listing.features.tech.thermostat",
    ],
  },
  {
    titleKey: "listing.features.storage.title",
    values: ["Built-in storage", "Wardrobe space", "Utility storage"],
    labelKeys: [
      "listing.features.storage.builtIn",
      "listing.features.storage.wardrobe",
      "listing.features.storage.utility",
    ],
  },
  {
    titleKey: "listing.features.bathroom.title",
    values: [
      "Rainfall shower",
      "Bathtub",
      "Heated towel rail",
      "Ventilation (window / extractor fan)",
    ],
    labelKeys: [
      "listing.features.bathroom.rainfallShower",
      "listing.features.bathroom.bathtub",
      "listing.features.bathroom.towelRail",
      "listing.features.bathroom.ventilation",
    ],
  },
  {
    titleKey: "listing.features.kitchen.title",
    values: [
      "Water pressure",
      "Filtered drinking water tap",
      "Soft-close drawers and cabinets",
      "Extractor fan",
      "Bin storage / recycling setup",
      "Microwave",
      "Coffee machine",
      "Washing machine",
      "Dishwasher",
      "Electric hob",
      "Gas hob",
    ],
    labelKeys: [
      "listing.features.kitchen.waterPressure",
      "listing.features.kitchen.filteredTap",
      "listing.features.kitchen.softClose",
      "listing.features.kitchen.extractor",
      "listing.features.kitchen.binSetup",
      "listing.features.kitchen.microwave",
      "listing.features.kitchen.coffeeMachine",
      "listing.features.kitchen.washingMachine",
      "listing.features.kitchen.dishwasher",
      "listing.features.kitchen.electricHob",
      "listing.features.kitchen.gasHob",
    ],
  },
];

/** Flat list of all property amenity values (English strings stored in DB). */
export const PROPERTY_AMENITIES_VALUES: string[] = PROPERTY_AMENITIES_GROUPS.flatMap(
  (g) => g.values,
);
