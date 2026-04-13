import { useEffect, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import {
  fetchDashboardCounts,
  fetchTenants,
  fetchOperatorProperties,
} from "@/store/slices/operatorSlice";
import {
  selectIsAuthenticated,
  selectUser,
} from "@/store/slices/authSlice";

export function useOperatorDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const operatorState = useSelector((state: RootState) => state.operator);

  // Флаг для предотвращения повторных запросов
  const hasInitialized = useRef(false);
  const loadingRef = useRef(false);

  const loadDashboardData = useCallback(async () => {
    console.log("🔍 useOperatorDashboard.loadDashboardData called", {
      isAuthenticated,
      user_id: user?.id,
      user_role: user?.role,
      hasInitialized: hasInitialized.current,
      isLoading: loadingRef.current,
    });

    if (!isAuthenticated || !user) {
      console.log("⚠️ Not authenticated or no user, skipping data load");
      return;
    }

    if (loadingRef.current) {
      console.log("⚠️ Already loading, skipping");
      return;
    }

    if (hasInitialized.current) {
      console.log("⚠️ Already initialized, skipping");
      return;
    }

    // Проверяем роль пользователя
    if (user.role !== "operator") {
      console.log("⚠️ User is not an operator, skipping dashboard load");
      return;
    }

    loadingRef.current = true;

    try {
      console.log("🚀 Loading dashboard data");
      const results = await Promise.allSettled([
        dispatch(fetchDashboardCounts()),
        dispatch(fetchTenants()),
        dispatch(fetchOperatorProperties()),
      ]);

      // Проверяем результаты
      results.forEach((result, index) => {
        const names = ["Dashboard Counts", "Tenants", "Properties"];
        if (result.status === "fulfilled") {
          console.log(`${names[index]} loaded successfully`);
        } else {
          console.error(`❌ ${names[index]} failed:`, result.reason);
        }
      });

      hasInitialized.current = true;
      console.log("✅ Dashboard data loading completed");
    } catch (error) {
      console.error("❌ Error loading dashboard data:", error);
      // Не помечаем как инициализированное при ошибке
    } finally {
      loadingRef.current = false;
    }
  }, [dispatch, isAuthenticated, user?.id, user?.role]);

  // Загружаем данные только один раз при монтировании
  useEffect(() => {
    if (!hasInitialized.current && isAuthenticated && user) {
      console.log("🔄 useOperatorDashboard useEffect triggered - first load");
      loadDashboardData();
    }
  }, [isAuthenticated, user?.id]); // Убираем loadDashboardData из зависимостей

  // Сброс при изменении пользователя
  useEffect(() => {
    if (!user) {
      hasInitialized.current = false;
      loadingRef.current = false;
    }
  }, [user?.id]);

  return {
    ...operatorState,
    refreshData: loadDashboardData,
  };
}
