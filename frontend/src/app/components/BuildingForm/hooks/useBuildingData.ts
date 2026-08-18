import { useMemo } from "react";
import { useGetUsersQuery } from "@/store/api/users.api";
import type { Operator } from "../types";

export const useBuildingData = (isOpen: boolean) => {
  // Operators: the list is fetched only while the modal is open, with a high
  // limit so every operator fits on one page.
  const { data: operatorsPage, isFetching: operatorsLoading } = useGetUsersQuery(
    { role: "operator", limit: 1000, page: 1 },
    { skip: !isOpen },
  );

  // Second pass on the role, kept from the previous implementation.
  const operators: Operator[] = useMemo(
    () =>
      (operatorsPage?.users ?? []).filter(
        (user) => user.role === "operator" || user.role === "Operator",
      ),
    [operatorsPage],
  );

  return { operators, operatorsLoading };
};
