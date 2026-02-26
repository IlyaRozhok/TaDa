import { useState, useEffect, useCallback } from "react";
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
        const data = response?.data;
        setBuildings(Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []);
      } catch (error) {
        console.error("Failed to load buildings:", error);
      }
    };

    loadBuildings();
  }, []);

  // Load operators (aligned with EditPropertyModal logic, but simplified for create flow)
  const loadOperators = async () => {
    if (operatorsLoaded) return;

    setOperatorsLoading(true);
    try {
      // First try: API with role filter (preferred)
      try {
        const operatorsResponse = await usersAPI.getAll({ role: "operator" });
        const raw =
          operatorsResponse.data?.users ||
          operatorsResponse.data?.data ||
          operatorsResponse.data ||
          [];

        const list = Array.isArray(raw) ? raw : [];

        if (list.length > 0) {
          setAvailableOperators(list as User[]);
          setOperatorsLoaded(true);
          return;
        }
      } catch {
        // ignore and fallback below
      }

      // Fallback: load all users, then filter by role on client
      const allUsersResponse = await usersAPI.getAll();
      const rawUsers =
        allUsersResponse.data?.users ||
        allUsersResponse.data?.data ||
        allUsersResponse.data ||
        [];

      const allUsers: User[] = Array.isArray(rawUsers) ? rawUsers : [];
      const onlyOperators = allUsers.filter(
        (user) =>
          (user as any).role === "operator" || (user as any).role === "Operator",
      );

      setAvailableOperators(onlyOperators);
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
    const list = Array.isArray(operators) ? operators : [];
    if (list.length > 0) {
      setAvailableOperators(list);
      setOperatorsLoaded(true);
    }
  }, [operators]);

  const findBuildingById = useCallback(
    (buildingId: string): Building | null => {
      return buildings.find((b) => b.id === buildingId) || null;
    },
    [buildings],
  );

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