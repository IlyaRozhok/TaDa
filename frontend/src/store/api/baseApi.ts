import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

import { logout } from "@/store/slices/authSlice";
import { refreshSession } from "@/app/lib/sessionRefresh";

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
  "getLandingListings",
]);

/**
 * A 401 means the access token expired, not that the session ended: the refresh
 * token behind it is good for a month. So the 401 is spent on renewing the pair
 * and replaying the request, and only a refresh that itself fails clears the
 * store.
 *
 * The refresh runs through the shared coordinator, so a screen that fires five
 * queries at once — and the axios instance alongside it — produce one
 * `POST /auth/refresh` between them rather than five that invalidate each other.
 * The refresh call is not an endpoint of this API, so it cannot re-enter here.
 */
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status !== 401 || PUBLIC_ENDPOINTS.has(api.endpoint)) {
    return result;
  }

  if (!(await refreshSession())) {
    api.dispatch(logout());
    return result;
  }

  // Exactly one retry. If a token minted seconds ago is refused too, the problem
  // is not the token, and trying again would loop.
  const retried = await rawBaseQuery(args, api, extraOptions);

  if (retried.error?.status === 401) {
    api.dispatch(logout());
  }

  return retried;
};

/**
 * The single RTK Query instance. Domains attach their endpoints with
 * `injectEndpoints` from `store/api/<domain>.api.ts`, so no file has to grow to
 * hold all of them — see step 5.1 of the refactoring plan.
 */
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "User",
    "Property",
    "Building",
    "Preferences",
    "Shortlist",
    "TenantCv",
    "BookingRequests",
    "CallRequests",
  ],
  // Left off deliberately: switching these on globally would refetch every
  // domain on every focus. Endpoints opt in individually where it earns its way.
  refetchOnMountOrArgChange: false,
  refetchOnFocus: false,
  refetchOnReconnect: false,
  keepUnusedDataFor: 300,
  endpoints: () => ({}),
});
