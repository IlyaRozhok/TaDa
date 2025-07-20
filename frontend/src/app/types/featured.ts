export interface ResidentialComplex {
  id: string;
  name: string;
  location: string;
  description: string;
  imageUrl: string;
  totalUnits: number;
  priceFrom: number;
  priceTo: number;
  amenities: string[];
  completionDate: string;
  developer: string;
  website?: string;
}

export interface HomeCard {
  id: string;
  type: "property" | "residential-complex" | "info";
  title: string;
  subtitle?: string;
  description: string;
  imageUrl: string;
  primaryAction: {
    text: string;
    url: string;
  };
  secondaryAction?: {
    text: string;
    url: string;
  };
  badge?: {
    text: string;
    variant: "new" | "featured" | "popular";
  };
  metadata?: {
    price?: string;
    location?: string;
    features?: string[];
  };
}
