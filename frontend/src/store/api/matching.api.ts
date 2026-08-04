import { baseApi } from "@/store/api/baseApi";
import { Property } from "@/app/types";

/** One scored category of a match, as the backend calculates it. */
export interface MatchCategory {
  category: string;
  match: boolean;
  score: number;
  maxScore: number;
  reason: string;
  details?: string;
  hasPreference: boolean;
}

export interface MatchedPropertyItem {
  property: Property;
  matchScore: number;
  categories: MatchCategory[];
}

/** Envelope of `GET /matching/matched-properties`. */
export interface MatchedPropertiesPage {
  data: MatchedPropertyItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface GetMatchedPropertiesArgs {
  page?: number;
  limit?: number;
  search?: string;
}

/** `GET /matching/property/:id` — the backend's PropertyMatchResult. */
export interface PropertyMatchResult {
  property: Property;
  totalScore: number;
  maxPossibleScore: number;
  matchPercentage: number;
  isPerfectMatch: boolean;
  categories: MatchCategory[];
  summary: {
    matched: number;
    partial: number;
    notMatched: number;
    skipped: number;
  };
}

/**
 * Read endpoints of the matching domain. All of them require a session — none
 * goes into the base query's public endpoints. This PR is the data layer only;
 * the backend's N+1 and S3 presigning in the scoring loop stay with Phase 6.2.
 */
export const matchingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** The catalogue sorted by match score, paginated. */
    getMatchedProperties: builder.query<
      MatchedPropertiesPage,
      GetMatchedPropertiesArgs | void
    >({
      query: (args) => ({
        url: "/matching/matched-properties",
        params: {
          page: args?.page ?? 1,
          limit: args?.limit ?? 12,
          ...(args?.search ? { search: args.search } : {}),
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ property }) => ({
                type: "Property" as const,
                id: property.id,
              })),
              { type: "Property" as const, id: "MATCHED_LIST" },
            ]
          : [{ type: "Property" as const, id: "MATCHED_LIST" }],
    }),

    /** Match breakdown for one property; 404s when preferences are missing. */
    getPropertyMatch: builder.query<PropertyMatchResult, string>({
      query: (propertyId) => `/matching/property/${propertyId}`,
      providesTags: (_result, _error, propertyId) => [
        { type: "Property", id: propertyId },
      ],
    }),
  }),
});

export const { useGetMatchedPropertiesQuery, useGetPropertyMatchQuery } =
  matchingApi;
