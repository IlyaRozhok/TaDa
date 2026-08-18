import { useState, useEffect, useCallback, useMemo } from "react";
import { useLazyGetUsersQuery } from "@/store/api/users.api";
import {
  useGetBuildingsQuery,
  type Building as ApiBuilding,
} from "@/store/api/buildings.api";
import { Building, User } from "../types";

export const usePropertyData = (operators: User[] = []) => {
  // Lazy rather than a plain query: the fallback below only runs when the
  // role-filtered call comes back empty, so the second request must stay
  // imperative.
  const [fetchUsers] = useLazyGetUsersQuery();
  const { data: buildingsData } = useGetBuildingsQuery();
  const buildings: ApiBuilding[] = useMemo(
    () => buildingsData ?? [],
    [buildingsData],
  );
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [availableOperators, setAvailableOperators] = useState<User[]>([]);
  const [operatorsLoading, setOperatorsLoading] = useState(false);
  const [operatorsLoaded, setOperatorsLoaded] = useState(false);

  // Load operators (aligned with EditPropertyModal logic, but simplified for create flow)
  const loadOperators = async () => {
    if (operatorsLoaded) return;

    setOperatorsLoading(true);
    try {
      // First try: API with role filter (preferred)
      try {
        const list = (await fetchUsers({ role: "operator" }).unwrap()).users;

        if (list.length > 0) {
          setAvailableOperators(list);
          setOperatorsLoaded(true);
          return;
        }
      } catch {
        // ignore and fallback below
      }

      // Fallback: load all users, then filter by role on client
      const allUsers = (await fetchUsers().unwrap()).users;
      const onlyOperators = allUsers.filter(
        (user) => user.role === "operator" || user.role === "Operator",
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