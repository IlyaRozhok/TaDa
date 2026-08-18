"use client";

import { useMemo } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import {
  useGetMatchScoresQuery,
  type MatchCategory,
} from "@/store/api/matching.api";

export interface PropertyMatchData {
  matchScore: number;
  matchCategories?: MatchCategory[];
}

export type MatchByPropertyId = Record<string, PropertyMatchData>;

interface UsePropertyMatchesOptions {
  /** When false, no requests are made. Default: true when ids length > 0 and user is tenant or admin. */
  enabled?: boolean;
}

/**
 * Fetches match score and categories for a grid of property IDs.
 * Enabled for tenant and admin (so match shows on Favourites and other grids for both).
 * Returns a map propertyId -> { matchScore, matchCategories } for use in card grids.
 *
 * One request per grid, not one per card: the ids go to `POST /matching/scores`
 * together. Two grids asking for the same ids share the cache entry, and a user
 * with no preferences gets an empty map rather than a failure per card.
 */
export function usePropertyMatches(
  propertyIds: string[],
  options: UsePropertyMatchesOptions = {}
): { matchByPropertyId: MatchByPropertyId; loading: boolean } {
  const user = useSelector(selectUser);

  const canShowMatch = user?.role === "tenant" || user?.role === "admin";
  const enabled =
    options.enabled !== false && canShowMatch && propertyIds.length > 0;

  const { data, isFetching } = useGetMatchScoresQuery(propertyIds, {
    skip: !enabled,
  });

  const matchByPropertyId = useMemo<MatchByPropertyId>(() => {
    if (!enabled || !data) return {};

    return Object.fromEntries(
      Object.entries(data.scores).map(([id, score]) => [
        id,
        {
          matchScore: score.matchScore,
          matchCategories: score.categories?.length ? score.categories : undefined,
        },
      ]),
    );
  }, [enabled, data]);

  return {
    matchByPropertyId,
    loading: enabled ? isFetching : false,
  };
}
