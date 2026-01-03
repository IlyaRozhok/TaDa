import {
  Car,
  Coffee,
  Crown,
  Dog,
  Dumbbell,
  Home,
  MapPin,
  PoundSterling,
  Wifi,
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

export const HOBBY_ICON_OPTIONS = HOBBY_OPTIONS.map((value) => ({
  value,
  label: value,
}));

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

// Property type options for step 3
export const PROPERTY_TYPE_OPTIONS = [
  "Flat",
  "House",
  "Studio",
  "Room in shared house",
] as const;

// Furnishing options
export const FURNISHING_OPTIONS = [
  { value: "furnished", label: "Furnished" },
  { value: "unfurnished", label: "Unfurnished" },
  { value: "part-furnished", label: "Part Furnished" },
] as const;

// Secondary location options (Metro stations)
export const SECONDARY_LOCATION_OPTIONS = [
  { value: "kings-cross-st-pancras", label: "King's Cross St Pancras" },
  { value: "oxford-circus", label: "Oxford Circus" },
  { value: "liverpool-street", label: "Liverpool Street" },
  { value: "paddington", label: "Paddington" },
  { value: "waterloo", label: "Waterloo" },
  { value: "victoria", label: "Victoria" },
  { value: "green-park", label: "Green Park" },
  { value: "bond-street", label: "Bond Street" },
  { value: "baker-street", label: "Baker Street" },
  { value: "canary-wharf", label: "Canary Wharf" },
  { value: "london-bridge", label: "London Bridge" },
  { value: "tottenham-court-road", label: "Tottenham Court Road" },
  { value: "leicester-square", label: "Leicester Square" },
  { value: "piccadilly-circus", label: "Piccadilly Circus" },
  { value: "euston", label: "Euston" },
] as const;

// Commute location options (Business districts and areas)
export const COMMUTE_LOCATION_OPTIONS = [
  { value: "city-of-london", label: "City of London" },
  { value: "canary-wharf", label: "Canary Wharf" },
  { value: "west-end", label: "West End" },
  { value: "kings-cross", label: "King's Cross" },
  { value: "stratford", label: "Stratford" },
  { value: "hammersmith", label: "Hammersmith" },
  { value: "shoreditch", label: "Shoreditch" },
  { value: "camden", label: "Camden" },
  { value: "paddington", label: "Paddington" },
  { value: "liverpool-street", label: "Liverpool Street" },
  { value: "waterloo", label: "Waterloo" },
  { value: "victoria", label: "Victoria" },
  { value: "green-park", label: "Green Park" },
] as const;

// Commute time options
export const COMMUTE_TIME_OPTIONS = [
  "10",
  "15",
  "20",
  "30",
  "45",
  "60",
  "90",
] as const;

// Move-in date options
export const MOVE_IN_OPTIONS = [
  "Immediately",
  "Within 1 month",
  "Within 3 months",
  "Within 6 months",
  "Flexible",
] as const;

// Budget ranges (example)
export const BUDGET_RANGES = [
  { label: "£500 - £1000", min: 500, max: 1000 },
  { label: "£1000 - £1500", min: 1000, max: 1500 },
  { label: "£1500 - £2000", min: 1500, max: 2000 },
  { label: "£2000 - £3000", min: 2000, max: 3000 },
  { label: "£3000 - £4000", min: 3000, max: 4000 },
] as const;

// Duration options
export const DURATION_OPTIONS = [
  "Short term",
  "6 months",
  "12 months",
  "18 months",
  "24 months",
  "Flexible",
] as const;

// Bill options
export const BILL_OPTIONS = [
  "All-inclusive",
  "Partially inclusive",
  "Not included",
] as const;

// Aggregated/alias option sets for specific steps
export const WORK_STUDY_OPTIONS = [...WORK_OPTIONS];
export const CONVENIENCE_FEATURES_OPTIONS = [...CONVENIENCE_OPTIONS];
export const PET_FRIENDLY_OPTIONS = [...PET_OPTIONS];
export const LUXURY_PREMIUM_OPTIONS = [...LUXURY_OPTIONS];

export const IDEAL_LIVING_OPTIONS = [
  { value: "quiet", label: "Quiet & peaceful" },
  { value: "social", label: "Vibrant & social" },
  { value: "green", label: "Close to parks/greenery" },
  { value: "family-friendly", label: "Family-friendly" },
] as const;

export const SMOKING_OPTIONS = [
  { value: "non-smoker", label: "Non-smoker" },
  { value: "smoker", label: "Smoker" },
] as const;

export const TOTAL_STEPS_NEW = 10;
