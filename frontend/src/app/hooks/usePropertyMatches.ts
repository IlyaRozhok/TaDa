"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "../store/slices/authSlice";
import { apiSlice } from "../store/slices/apiSlice";
import type { AppDispatch } from "../store/store";

export interface PropertyMatchData {
  matchScore: number;
  matchCategories?: Array<{
    category: string;
    match: boolean;
    score: number;
    maxScore: number;
    reason: string;
    details?: string;
    hasPreference: boolean;
  }>;
}

export type MatchByPropertyId = Record<string, PropertyMatchData>;

interface UsePropertyMatchesOptions {
  /** When false, no requests are made. Default: true when ids length > 0 and user is tenant or admin. */
  enabled?: boolean;
}

/**
 * Fetches match score and categories for each property ID.
 * Enabled for tenant and admin (so match shows on Favourites and other grids for both).
 * Returns a map propertyId -> { matchScore, matchCategories } for use in card grids.
 */
export function usePropertyMatches(
  propertyIds: string[],
  options: UsePropertyMatchesOptions = {}
): { matchByPropertyId: MatchByPropertyId; loading: boolean } {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  const [matchByPropertyId, setMatchByPropertyId] = useState<MatchByPropertyId>({});
  const [loading, setLoading] = useState(false);

  const canShowMatch = user?.role === "tenant" || user?.role === "admin";
  const enabled = options.enabled !== false && canShowMatch && propertyIds.length > 0;
  const idsKey = propertyIds.slice().sort().join(",");

  useEffect(() => {
    if (!enabled) {
      setMatchByPropertyId({});
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const fetchAll = async () => {
      const results: MatchByPropertyId = {};
      await Promise.all(
        propertyIds.map(async (id) => {
          if (cancelled) return;
          try {
            const data = await dispatch(
              apiSlice.endpoints.getPropertyMatch.initiate(id, {
                subscribe: false,
              }),
            ).unwrap();
            const score = data.matchPercentage ?? data.matchScore ?? 0;
            const categories = data.categories && Array.isArray(data.categories) ? data.categories : undefined;
            if (!cancelled) {
              results[id] = { matchScore: score, matchCategories: categories };
            }
          } catch {
            // Silently skip failed property match
          }
        })
      );
      if (!cancelled) {
        setMatchByPropertyId(results);
      }
      if (!cancelled) {
        setLoading(false);
      }
    };

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [dispatch, enabled, idsKey, propertyIds]);

  return {
    matchByPropertyId: enabled ? matchByPropertyId : {},
    loading: enabled ? loading : false,
  };
}
