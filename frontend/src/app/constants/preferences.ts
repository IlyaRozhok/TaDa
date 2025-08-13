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
  { value: "no-preference", label: "No Preference" },
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
  { value: "no-preference", label: "No Preference" },
] as const;

// Commute location options (Business districts and areas)
export const COMMUTE_LOCATION_OPTIONS = [
  { value: "canary-wharf", label: "Canary Wharf" },
  { value: "city-of-london", label: "City of London" },
  { value: "westminster", label: "Westminster" },
  { value: "shoreditch", label: "Shoreditch" },
  { value: "kings-cross", label: "King's Cross" },
  { value: "paddington", label: "Paddington" },
  { value: "south-bank", label: "South Bank" },
  { value: "mayfair", label: "Mayfair" },
  { value: "holborn", label: "Holborn" },
  { value: "clerkenwell", label: "Clerkenwell" },
  { value: "bermondsey", label: "Bermondsey" },
  { value: "stratford", label: "Stratford" },
  { value: "hammersmith", label: "Hammersmith" },
  { value: "croydon", label: "Croydon" },
  { value: "central-london", label: "Central London" },
  { value: "no-preference", label: "No Preference" },
] as const;

// Bedroom options
export const BEDROOM_OPTIONS = [
  "Studio",
  "1 Bedroom",
  "2 Bedrooms",
  "3 Bedrooms",
  "4+ Bedrooms",
] as const;

// Work & Study options
export const WORK_STUDY_OPTIONS = [
  { value: "co-working", label: "Co-working Space" },
  { value: "high-speed-wifi", label: "High Speed Wi-Fi" },
  { value: "meeting-rooms", label: "Meeting Rooms" },
  { value: "business-center", label: "Business Center" },
] as const;

// Convenience options
export const CONVENIENCE_FEATURES_OPTIONS = [
  { value: "parking", label: "Parking Space" },
  { value: "laundry", label: "Laundry Facilities" },
  { value: "security", label: "24/7 Security" },
  { value: "storage", label: "Storage Space" },
  { value: "concierge", label: "Concierge Service" },
] as const;

// Pet-friendly options
export const PET_FRIENDLY_OPTIONS = [
  { value: "pet-park", label: "Pet Park" },
  { value: "pet-sitting", label: "Pet Sitting" },
  { value: "pet-washing", label: "Pet Washing" },
  { value: "pet-friendly", label: "Pet Friendly" },
] as const;

// Luxury & Premium options
export const LUXURY_PREMIUM_OPTIONS = [
  { value: "concierge", label: "Concierge" },
  { value: "spa", label: "Luxury Spa" },
  { value: "private-dining", label: "Private Dining" },
  { value: "valet", label: "Valet Service" },
  { value: "wine-cellar", label: "Wine Cellar" },
] as const;

// Ideal Living Environment options
export const IDEAL_LIVING_OPTIONS = [
  { value: "quiet-professional", label: "Quiet Professional" },
  { value: "social-friendly", label: "Social and Friendly" },
  { value: "family-oriented", label: "Family Oriented" },
  { value: "student-lifestyle", label: "Student Lifestyle" },
  { value: "creative-artistic", label: "Creative and Artistic" },
  { value: "no-preference", label: "No Preference" },
] as const;

// Smoking options
export const SMOKING_OPTIONS = [
  { value: "no", label: "No" },
  { value: "yes", label: "Yes" },
  { value: "no-but-okay", label: "I don't smoke but I'm okay with it" },
  {
    value: "no-prefer-non-smoking",
    label: "I don't smoke and prefer non-smoking environments",
  },
  { value: "no-preference", label: "No Preference" },
] as const;

// Hobby options with icons
export const HOBBY_ICON_OPTIONS = [
  { value: "reading", label: "Reading", icon: "📚" },
  { value: "cooking", label: "Cooking", icon: "🍳" },
  { value: "fitness", label: "Fitness", icon: "💪" },
  { value: "music", label: "Music", icon: "🎵" },
  { value: "travel", label: "Travel", icon: "🚗" },
  { value: "gaming", label: "Gaming", icon: "🎮" },
  { value: "art", label: "Art", icon: "🖼️" },
  { value: "sport", label: "Sport", icon: "🏀" },
  { value: "dancing", label: "Dancing", icon: "💃" },
  { value: "hiking", label: "Hiking", icon: "🥾" },
  { value: "yoga", label: "Yoga", icon: "🧘" },
  { value: "swimming", label: "Swimming", icon: "🏊" },
] as const;

export const TOTAL_STEPS = 12; // For PreferencesPage (old version)
export const TOTAL_STEPS_NEW = 16; // For NewPreferencesPage
