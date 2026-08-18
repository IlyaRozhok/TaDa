import { baseApi } from "@/store/api/baseApi";
import { Property } from "@/app/types/property";
import { normalizeProperty } from "@/store/api/properties.api";

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

/** One property's score as the card grids consume it. */
export interface PropertyMatchScore {
  matchScore: number;
  categories: MatchCategory[];
}

/** Envelope of `POST /matching/scores`, keyed by property id. */
export interface MatchScoresResponse {
  scores: Record<string, PropertyMatchScore>;
}

/**
 * Read endpoints of the matching domain. All of them require a session — none
 * goes into the base query's public endpoints. The backend's full-table scoring
 * pass and its presigning loop stay with the next sub-PR of Phase 6.2.
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
      // The matching route serves raw entities, so the same decimal-string
      // normalisation the properties endpoints do applies to each item.
      transformResponse: (page: MatchedPropertiesPage) => ({
        ...page,
        data: page.data.map((item) => ({
          ...item,
          property: normalizeProperty(item.property),
        })),
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

    /**
     * Scores for a whole grid in one request. A POST because a grid's worth of
     * UUIDs does not belong in a URL, but a query rather than a mutation: it
     * reads, so it must stay cached and deduplicated like any other read.
     *
     * The ids are sorted into the cache key, so two grids showing the same
     * properties in a different order share one cache entry and one request.
     */
    getMatchScores: builder.query<MatchScoresResponse, string[]>({
      query: (propertyIds) => ({
        url: "/matching/scores",
        method: "POST",
        body: { propertyIds },
      }),
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}(${[...queryArgs].sort().join(",")})`,
      providesTags: (result) =>
        result
          ? [
              ...Object.keys(result.scores).map((id) => ({
                type: "Property" as const,
                id,
              })),
              { type: "Property" as const, id: "MATCH_SCORES" },
            ]
          : [{ type: "Property" as const, id: "MATCH_SCORES" }],
    }),
  }),
});

export const {
  useGetMatchedPropertiesQuery,
  useGetPropertyMatchQuery,
  useGetMatchScoresQuery,
} = matchingApi;
