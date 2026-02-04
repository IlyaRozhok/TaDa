import { useState } from "react";
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

export function useAdminActions(
  onNotification: (type: "success" | "error" | "info", message: string) => void,
  onDataUpdate: {
    updateBuildings: (buildings: Building[]) => void;
    updateProperties: (properties: Property[]) => void;
    updateRequests: (requests: BookingRequest[]) => void;
  }
) {
  const [selectedItem, setSelectedItem] = useState<User | Building | Property | null>(null);
  const [showModal, setShowModal] = useState<"view" | "edit" | "add" | "delete" | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);

  // Generic handlers
  const handleView = (item: User | Building | Property) => {
    setSelectedItem(item);
    setShowModal("view");
  };

  const handleEdit = (item: User | Building | Property) => {
    setSelectedItem(item);
    setShowModal("edit");
  };

  const handleDelete = (item: User | Building | Property) => {
    setSelectedItem(item);
    setShowModal("delete");
  };

  const handleAdd = () => {
    setSelectedItem(null);
    setShowModal("add");
  };

  // Building actions
  const handleUpdateBuilding = async (buildingData: Partial<Building>) => {
    if (!selectedItem || !("name" in selectedItem)) return;

    setIsActionLoading(true);
    try {
      const response = await buildingsAPI.update(selectedItem.id, buildingData);
      onNotification("success", "Building updated successfully");
      
      // Refresh buildings data
      const buildingsResponse = await buildingsAPI.getAll();
      onDataUpdate.updateBuildings(buildingsResponse.data);
      
      setShowModal(null);
    } catch (error) {
      console.error("Error updating building:", error);
      onNotification("error", "Failed to update building");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCreateBuilding = async (buildingData: Partial<Building>) => {
    setIsActionLoading(true);
    try {
      await buildingsAPI.create(buildingData);
      onNotification("success", "Building created successfully");
      
      // Refresh buildings data
      const buildingsResponse = await buildingsAPI.getAll();
      onDataUpdate.updateBuildings(buildingsResponse.data);
      
      setShowModal(null);
    } catch (error) {
      console.error("Error creating building:", error);
      onNotification("error", "Failed to create building");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Property actions
  const handleUpdateProperty = async (propertyData: Partial<Property>) => {
    if (!selectedItem || !("title" in selectedItem)) return;

    setIsActionLoading(true);
    try {
      await propertiesAPI.update(selectedItem.id, propertyData);
      onNotification("success", "Property updated successfully");
      
      // Refresh properties data
      const propertiesResponse = await propertiesAPI.getAll();
      onDataUpdate.updateProperties(propertiesResponse.data);
      
      setShowModal(null);
    } catch (error) {
      console.error("Error updating property:", error);
      onNotification("error", "Failed to update property");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCreateProperty = async (propertyData: Partial<Property>) => {
    setIsActionLoading(true);
    try {
      await propertiesAPI.create(propertyData);
      onNotification("success", "Property created successfully");
      
      // Refresh properties data
      const propertiesResponse = await propertiesAPI.getAll();
      onDataUpdate.updateProperties(propertiesResponse.data);
      
      setShowModal(null);
    } catch (error) {
      console.error("Error creating property:", error);
      onNotification("error", "Failed to create property");
    } finally {
      setIsActionLoading(false);
    }
  };

  // User actions (placeholder - implement when needed)
  const handleUpdateUser = async (userData: Partial<User>) => {
    // TODO: Implement user update
    console.log("Update user:", userData);
  };

  const handleCreateUser = async (userData: Partial<User>) => {
    // TODO: Implement user creation
    console.log("Create user:", userData);
  };

  // Request actions
  const updateRequestStatus = async (requestId: string, status: string) => {
    setUpdatingRequestId(requestId);
    try {
      await bookingRequestsAPI.updateStatus(requestId, status);
      onNotification("success", `Request ${status} successfully`);
      
      // Refresh requests data
      const requestsResponse = await bookingRequestsAPI.getAll();
      onDataUpdate.updateRequests(requestsResponse.data);
    } catch (error) {
      console.error("Error updating request status:", error);
      onNotification("error", "Failed to update request status");
    } finally {
      setUpdatingRequestId(null);
    }
  };

  return {
    // State
    selectedItem,
    showModal,
    isActionLoading,
    updatingRequestId,
    
    // Actions
    setSelectedItem,
    setShowModal,
    handleView,
    handleEdit,
    handleDelete,
    handleAdd,
    handleUpdateBuilding,
    handleCreateBuilding,
    handleUpdateProperty,
    handleCreateProperty,
    handleUpdateUser,
    handleCreateUser,
    updateRequestStatus,
  };
}