import {
  Home,
  MapPin,
  PoundSterling,
  Car,
  Coffee,
  Dumbbell,
  Wifi,
  Dog,
  Crown,
} from "lucide-react";

export const HOBBY_OPTIONS = [
  "Reading",
  "Cooking",
  "Fitness",
  "Music",
  "Travel",
  "Photography",
  "Gaming",
  "Art",
  "Sports",
  "Dancing",
  "Writing",
  "Gardening",
  "Yoga",
  "Cycling",
  "Running",
  "Swimming",
  "Hiking",
  "Movies",
  "Fashion",
  "Technology",
  "Languages",
  "Volunteering",
  "Shopping",
  "Socializing",
] as const;

export const LIFESTYLE_OPTIONS = [
  { value: "gym", label: "Fitness Center", icon: Dumbbell },
  { value: "pool", label: "Swimming Pool", icon: Home },
  { value: "garden", label: "Garden/Terrace", icon: Home },
  { value: "spa", label: "Spa/Wellness", icon: Home },
  { value: "cinema", label: "Cinema Room", icon: Home },
  { value: "library", label: "Library/Study", icon: Home },
] as const;

export const SOCIAL_OPTIONS = [
  { value: "communal-space", label: "Communal Areas", icon: Coffee },
  { value: "rooftop", label: "Rooftop Terrace", icon: Home },
  { value: "events", label: "Social Events", icon: Coffee },
  { value: "bbq", label: "BBQ Area", icon: Coffee },
  { value: "games-room", label: "Games Room", icon: Coffee },
] as const;

export const WORK_OPTIONS = [
  { value: "co-working", label: "Co-working Space", icon: Wifi },
  { value: "meeting-rooms", label: "Meeting Rooms", icon: Wifi },
  { value: "high-speed-wifi", label: "High-Speed WiFi", icon: Wifi },
  { value: "business-center", label: "Business Center", icon: Wifi },
] as const;

export const CONVENIENCE_OPTIONS = [
  { value: "parking", label: "Parking Space", icon: Car },
  { value: "storage", label: "Storage Space", icon: Home },
  { value: "laundry", label: "Laundry Facilities", icon: Home },
  { value: "concierge", label: "Concierge Service", icon: Home },
  { value: "security", label: "24/7 Security", icon: Home },
] as const;

export const PET_OPTIONS = [
  { value: "pet-park", label: "Pet Park", icon: Dog },
  { value: "pet-washing", label: "Pet Washing", icon: Dog },
  { value: "pet-sitting", label: "Pet Sitting", icon: Dog },
  { value: "pet-friendly", label: "Pet Friendly", icon: Dog },
] as const;

export const LUXURY_OPTIONS = [
  { value: "concierge", label: "Concierge", icon: Crown },
  { value: "valet", label: "Valet Service", icon: Crown },
  { value: "spa", label: "Luxury Spa", icon: Crown },
  { value: "wine-cellar", label: "Wine Cellar", icon: Crown },
  { value: "private-dining", label: "Private Dining", icon: Crown },
] as const;

export const BUILDING_STYLE_OPTIONS = [
  { value: "btr", label: "Build-to-Rent", icon: Home },
  { value: "co-living", label: "Co-Living", icon: Coffee },
  { value: "new-builds", label: "New Builds", icon: Home },
  { value: "period-homes", label: "Period Homes", icon: Home },
  { value: "luxury-apartments", label: "Luxury Apartments", icon: Crown },
  { value: "serviced-apartments", label: "Serviced Apartments", icon: Home },
] as const;

export const STEP_CONFIGURATIONS = [
  {
    id: 1,
    title: "Location & Commute",
    description: "Where you want to live and work",
    icon: MapPin,
    color: "blue",
  },
  {
    id: 2,
    title: "Budget & Property Details",
    description: "Your budget and property requirements",
    icon: PoundSterling,
    color: "green",
  },
  {
    id: 3,
    title: "Building Style Preferences",
    description: "Choose your preferred building types",
    icon: Home,
    color: "purple",
  },
  {
    id: 4,
    title: "Lifestyle & Wellness",
    description: "Select wellness and fitness amenities that matter to you",
    icon: Dumbbell,
    color: "pink",
  },
  {
    id: 5,
    title: "Social & Community",
    description: "Choose social spaces and community features you'd enjoy",
    icon: Coffee,
    color: "orange",
  },
  {
    id: 6,
    title: "Work & Study",
    description: "Select work and study facilities you need for productivity",
    icon: Wifi,
    color: "blue",
  },
  {
    id: 7,
    title: "Convenience",
    description: "Choose convenience features that make daily life easier",
    icon: Car,
    color: "green",
  },
  {
    id: 8,
    title: "Pet-Friendly",
    description:
      "Select pet-friendly amenities if you have or plan to get pets",
    icon: Dog,
    color: "purple",
  },
  {
    id: 9,
    title: "Luxury & Premium",
    description: "Choose luxury amenities and premium services you value",
    icon: Crown,
    color: "yellow",
  },
] as const;

export const TOTAL_STEPS = 11;
