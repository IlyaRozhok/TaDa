import { useState, useEffect } from "react";
import { buildingsAPI, usersAPI } from "../../../lib/api";
import { Building, User } from "../types";

export const usePropertyData = (operators: User[] = []) => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [availableOperators, setAvailableOperators] = useState<User[]>([]);
  const [operatorsLoading, setOperatorsLoading] = useState(false);
  const [operatorsLoaded, setOperatorsLoaded] = useState(false);

  // Load buildings
  useEffect(() => {
    const loadBuildings = async () => {
      try {
        const response = await buildingsAPI.getAll();
        setBuildings(response.data);
      } catch (error) {
        console.error("Failed to load buildings:", error);
      }
    };

    loadBuildings();
  }, []);

  // Load operators when building_type changes to private_landlord
  const loadOperators = async () => {
    if (operatorsLoaded) return;

    setOperatorsLoading(true);
    try {
      const response = await usersAPI.getAll({ role: 'operator' });
      setAvailableOperators(response.data);
      setOperatorsLoaded(true);
    } catch (error) {
      console.error("Failed to load operators:", error);
      setAvailableOperators([]);
    } finally {
      setOperatorsLoading(false);
    }
  };

  // Use operators from props or load them if not available
  useEffect(() => {
    if (operators && operators.length > 0) {
      setAvailableOperators(operators);
      setOperatorsLoaded(true);
    }
  }, [operators]);

  const findBuildingById = (buildingId: string): Building | null => {
    return buildings.find(b => b.id === buildingId) || null;
  };

  return {
    buildings,
    selectedBuilding,
    setSelectedBuilding,
    availableOperators,
    operatorsLoading,
    operatorsLoaded,
    loadOperators,
    findBuildingById,
  };
};