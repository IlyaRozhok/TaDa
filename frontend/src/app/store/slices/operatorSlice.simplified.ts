import { createSlice } from "@reduxjs/toolkit";
import { 
  createGetThunk, 
  createPostThunk, 
  createPutThunk, 
  createDeleteThunk 
} from "@/shared/lib/redux/asyncThunkHelpers";
import { 
  addCrudCases, 
  StateWithLoading 
} from "@/shared/lib/redux/reducerHelpers";
import { 
  createSliceSelector,
  createLoadingSelector,
  createErrorSelector,
  createItemsSelector,
  createItemByIdSelector,
  createFilteredItemsSelector,
  createCountSelector
} from "@/shared/lib/redux/selectorHelpers";
import type { RootState } from "../store";

// Types
interface Building {
  id: string;
  name: string;
  address: string;
  operator_id: string;
  created_at: string;
  updated_at: string;
}

interface Property {
  id: string;
  title: string;
  building_id: string;
  operator_id: string;
  price: number;
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
}

interface OperatorState extends StateWithLoading {
  buildings: Building[];
  properties: Property[];
  tenants: User[];
  stats: {
    totalBuildings: number;
    totalProperties: number;
    totalTenants: number;
    occupancyRate: number;
  } | null;
}

// Initial state
const initialState: OperatorState = {
  loading: false,
  error: null,
  buildings: [],
  properties: [],
  tenants: [],
  stats: null,
};

// API endpoints
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

// Async thunks using helpers
export const fetchBuildings = createGetThunk<Building[]>(
  "operator/fetchBuildings",
  `${API_BASE}/operator/buildings`
);

export const createBuilding = createPostThunk<Building, Partial<Building>>(
  "operator/createBuilding",
  `${API_BASE}/operator/buildings`
);

export const updateBuilding = createPutThunk<Building, Building>(
  "operator/updateBuilding",
  (building) => `${API_BASE}/operator/buildings/${building.id}`
);

export const deleteBuilding = createDeleteThunk<void>(
  "operator/deleteBuilding",
  (id: string) => `${API_BASE}/operator/buildings/${id}`
);

export const fetchProperties = createGetThunk<Property[]>(
  "operator/fetchProperties",
  `${API_BASE}/operator/properties`
);

export const createProperty = createPostThunk<Property, Partial<Property>>(
  "operator/createProperty",
  `${API_BASE}/operator/properties`
);

export const updateProperty = createPutThunk<Property, Property>(
  "operator/updateProperty",
  (property) => `${API_BASE}/operator/properties/${property.id}`
);

export const deleteProperty = createDeleteThunk<void>(
  "operator/deleteProperty",
  (id: string) => `${API_BASE}/operator/properties/${id}`
);

export const fetchTenants = createGetThunk<User[]>(
  "operator/fetchTenants",
  `${API_BASE}/operator/tenants`
);

export const fetchStats = createGetThunk<OperatorState["stats"]>(
  "operator/fetchStats",
  `${API_BASE}/operator/stats`
);

// Slice
const operatorSlice = createSlice({
  name: "operator",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetOperatorState: () => initialState,
  },
  extraReducers: (builder) => {
    // Buildings CRUD
    addCrudCases(builder, {
      fetch: fetchBuildings,
      create: createBuilding,
      update: updateBuilding,
      delete: deleteBuilding,
    }, "buildings");

    // Properties CRUD
    addCrudCases(builder, {
      fetch: fetchProperties,
      create: createProperty,
      update: updateProperty,
      delete: deleteProperty,
    }, "properties");

    // Tenants
    addCrudCases(builder, {
      fetch: fetchTenants,
    }, "tenants");

    // Stats
    builder
      .addCase(fetchStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Actions
export const { clearError, resetOperatorState } = operatorSlice.actions;

// Base selectors
const selectOperatorState = createSliceSelector<OperatorState>("operator");

// Loading and error selectors
export const selectOperatorLoading = createLoadingSelector(selectOperatorState);
export const selectOperatorError = createErrorSelector(selectOperatorState);

// Data selectors
export const selectBuildings = createItemsSelector(selectOperatorState, "buildings");
export const selectProperties = createItemsSelector(selectOperatorState, "properties");
export const selectTenants = createItemsSelector(selectOperatorState, "tenants");

// Item by ID selectors
export const selectBuildingById = createItemByIdSelector(selectBuildings);
export const selectPropertyById = createItemByIdSelector(selectProperties);

// Filtered selectors
export const selectPropertiesByBuildingId = (buildingId: string) =>
  createFilteredItemsSelector(
    selectProperties,
    (property) => property.building_id === buildingId
  );

// Count selectors
export const selectBuildingsCount = createCountSelector(selectBuildings);
export const selectPropertiesCount = createCountSelector(selectProperties);
export const selectTenantsCount = createCountSelector(selectTenants);

// Stats selector
export const selectOperatorStats = (state: RootState) => state.operator.stats;

// Complex computed selectors
export const selectOccupancyRate = (state: RootState) => {
  const stats = selectOperatorStats(state);
  return stats?.occupancyRate || 0;
};

export const selectBuildingsWithPropertyCount = (state: RootState) => {
  const buildings = selectBuildings(state);
  const properties = selectProperties(state);
  
  return buildings.map(building => ({
    ...building,
    propertyCount: properties.filter(p => p.building_id === building.id).length,
  }));
};

export default operatorSlice.reducer;