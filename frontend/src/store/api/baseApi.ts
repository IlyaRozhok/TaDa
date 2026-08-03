import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

import { logout } from "@/store/slices/authSlice";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api",
  // Authentication is a JWT in an httpOnly cookie, so the cookie has to travel
  // with every request.
  credentials: "include",
});

/**
 * Endpoints that are reachable without a session. A 401 from these says nothing
 * about the visitor's own session — a signed-out reader opening a shared CV must
 * not be "logged out" as a side effect.
 */
const PUBLIC_ENDPOINTS = new Set([
  "getPublicTenantCv",
  "getPublicBuilding",
  "getPublicProperties",
  "getPublicPropertiesAll",
  "getPublicProperty",
]);

/**
 * Same 401 handling the axios instance has had all along: a rejected session
 * clears the store. Without this, the more traffic moves to RTK Query the more
 * often an expired session would leave the user on a broken page instead of
 * signed out.
 */
const baseQueryWithAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401 && !PUBLIC_ENDPOINTS.has(api.endpoint)) {
    api.dispatch(logout());
  }

  return result;
};

/**
 * The single RTK Query instance. Domains attach their endpoints with
 * `injectEndpoints` from `store/api/<domain>.api.ts`, so no file has to grow to
 * hold all of them — see step 5.1 of the refactoring plan.
 */
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithAuth,
  tagTypes: [
    "User",
    "Property",
    "Building",
    "Preferences",
    "Shortlist",
    "TenantCv",
    "BookingRequests",
  ],
  // Left off deliberately: switching these on globally would refetch every
  // domain on every focus. Endpoints opt in individually where it earns its way.
  refetchOnMountOrArgChange: false,
  refetchOnFocus: false,
  refetchOnReconnect: false,
  keepUnusedDataFor: 300,
  endpoints: () => ({}),
});
