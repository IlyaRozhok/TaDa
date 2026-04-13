import {
  Wifi,
  Car,
  Dumbbell,
  Waves,
  Users,
  Shield,
  TreePine,
  Coffee,
  Utensils,
  Tv,
  Wind,
  Sparkles,
  Building2,
  Building,
} from "lucide-react";

export interface LifestyleFeature {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  category?: "amenity" | "outdoor" | "appliance" | "security" | "comfort";
}

export const LIFESTYLE_FEATURES: LifestyleFeature[] = [
  // Amenities
  { id: "wifi", label: "Wi-Fi", icon: Wifi, category: "amenity" },
  { id: "gym", label: "Gym", icon: Dumbbell, category: "amenity" },
  { id: "pool", label: "Pool", icon: Waves, category: "amenity" },
  { id: "parking", label: "Parking", icon: Car, category: "amenity" },
  { id: "concierge", label: "Concierge", icon: Users, category: "amenity" },
  { id: "elevator", label: "Elevator", icon: Building2, category: "amenity" },

  // Security
  { id: "security", label: "Security", icon: Shield, category: "security" },

  // Outdoor
  { id: "garden", label: "Garden", icon: TreePine, category: "outdoor" },
  { id: "terrace", label: "Terrace", icon: Building2, category: "outdoor" },
  { id: "balcony", label: "Balcony", icon: Building, category: "outdoor" },

  // Appliances
  {
    id: "dishwasher",
    label: "Dishwasher",
    icon: Utensils,
    category: "appliance",
  },
  { id: "laundry", label: "Laundry", icon: Sparkles, category: "appliance" },
  {
    id: "coffee_machine",
    label: "Coffee Machine",
    icon: Coffee,
    category: "appliance",
  },

  // Comfort
  {
    id: "air_conditioning",
    label: "Air Conditioning",
    icon: Wind,
    category: "comfort",
  },
  { id: "heating", label: "Heating", icon: Sparkles, category: "comfort" },
  { id: "storage", label: "Storage", icon: Building, category: "comfort" },
  {
    id: "entertainment",
    label: "Entertainment",
    icon: Tv,
    category: "comfort",
  },
];

export const getLifestyleFeaturesByCategory = () => {
  return LIFESTYLE_FEATURES.reduce((acc, feature) => {
    const category = feature.category || "other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(feature);
    return acc;
  }, {} as Record<string, LifestyleFeature[]>);
};

export const getLifestyleFeatureById = (
  id: string
): LifestyleFeature | undefined => {
  return LIFESTYLE_FEATURES.find((feature) => feature.id === id);
};

export const getLifestyleFeatureLabels = (ids: string[]): string[] => {
  return ids
    .map((id) => getLifestyleFeatureById(id))
    .filter(Boolean)
    .map((feature) => feature!.label);
};
