import { useState, useEffect } from "react";
import { useDebounce } from "@/app/hooks/useDebounce";
import { 
  bookingRequestsAPI, 
  buildingsAPI, 
  propertiesAPI 
} from "@/app/lib/api";

// Types (TODO: Move to shared types)
interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  status: string;
  created_at: string;
}

interface Building {
  id: string;
  name: string;
  address: string;
  number_of_units: number;
  type_of_unit: string[];
  logo?: string;
  video?: string;
  photos?: string[];
  documents?: string;
  operator_id: string | null;
}

interface Property {
  id: string;
  title: string;
  description?: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area?: number;
  address: string;
  created_at: string;
}

interface BookingRequest {
  id: string;
  property_id: string;
  tenant_id: string;
  status: string;
  created_at: string;
}

export type AdminSection = "users" | "buildings" | "properties" | "requests";

interface SortState {
  field: string;
  direction: "asc" | "desc";
}

export function useAdminData() {
  const [activeSection, setActiveSection] = useState<AdminSection>("users");
  const [users, setUsers] = useState<User[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState<SortState>({
    field: "created_at",
    direction: "desc",
  });
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 150);

  // Load requests
  const loadRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const response = await bookingRequestsAPI.getAll();
      setRequests(response.data);
    } catch (error) {
      console.error("Error loading requests:", error);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  // Load buildings
  const loadBuildings = async () => {
    try {
      const response = await buildingsAPI.getAll();
      setBuildings(response.data);
    } catch (error) {
      console.error("Error loading buildings:", error);
    }
  };

  // Load properties
  const loadProperties = async () => {
    try {
      const response = await propertiesAPI.getAll();
      setProperties(response.data);
    } catch (error) {
      console.error("Error loading properties:", error);
    }
  };

  // Load data when section changes
  useEffect(() => {
    switch (activeSection) {
      case "requests":
        loadRequests();
        break;
      case "buildings":
        loadBuildings();
        break;
      case "properties":
        loadProperties();
        break;
      default:
        break;
    }
  }, [activeSection]);

  return {
    // State
    activeSection,
    users,
    buildings,
    properties,
    requests,
    searchTerm,
    sort,
    isLoadingRequests,
    debouncedSearchTerm,
    
    // Actions
    setActiveSection,
    setUsers,
    setBuildings,
    setProperties,
    setRequests,
    setSearchTerm,
    setSort,
    
    // Loaders
    loadRequests,
    loadBuildings,
    loadProperties,
  };
}