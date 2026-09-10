import { baseApi } from "@/store/api/baseApi";
import { store } from "@/store/store";
import type { PreferencesFormData } from "@/entities/preferences/model/preferences";

/**
 * The preferences row as the API returns it. Moved here from the deleted
 * `preferencesSlice`, where it was already reconciled against the real
 * responses while `strict` was switched on — every field is nullable because
 * the wizard saves them one at a time.
 *
 * A type alias rather than an interface on purpose: the dashboard reads the row
 * through helpers that take `Record<string, unknown>`, and only an alias gets
 * the implicit index signature that makes that assignment legal without a cast.
 */
export type PreferencesRow = {
  id: string | null;
  user_id: string | null;
  user?: {
    id: string | null;
    full_name: string | null;
    email: string | null;
    roles: string[] | null;
  };
  preferred_address?: string | null;
  preferred_areas?: string[] | null;
  preferred_districts?: string[] | null;
  preferred_metro_stations?: string[] | null;
  move_in_date?: string | null;
  min_price?: number | null;
  max_price?: number | null;
  min_bedrooms?: number | null;
  max_bedrooms?: number | null;
  min_bathrooms?: number | null;
  max_bathrooms?: number | null;
  furnishing?: string | null;
  let_duration?: string | null;
  designer_furniture?: boolean | null;
  hobbies?: string[] | null;
  ideal_living_environment?: string | null;
  pets?: string | null;
  smoker?: boolean | null;
  additional_info?: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export const preferencesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * The signed-in user's own preferences. A user who has never saved
     * anything gets an empty body, which arrives here as `null` — that is the
     * "onboarding not started" signal the session bootstrap and the
     * post-login redirect both read.
     */
    getPreferences: builder.query<PreferencesRow | null, void>({
      query: () => "/preferences",
      providesTags: [{ type: "Preferences", id: "ME" }],
    }),

    /**
     * Both writes take the wizard transformer's output, which is declared
     * against the form shape even though it produces API data — the two
     * disagree on `furnishing` and a few neighbours. Typing the body as what
     * the only caller actually sends is the honest description of today's
     * contract; reconciling the two shapes is step 5.2.
     */
    createPreferences: builder.mutation<
      PreferencesRow,
      Partial<PreferencesFormData>
    >({
      query: (body) => ({ url: "/preferences", method: "POST", body }),
      // "Property" as a whole, not just Preferences: every match score, the
      // ranked feed and the per-property breakdowns are computed FROM the
      // preferences. Leaving them cached served a tenant who just changed
      // their budget the old percentages and ordering for up to five minutes.
      invalidatesTags: [{ type: "Preferences", id: "ME" }, "Property"],
    }),

    updatePreferences: builder.mutation<
      PreferencesRow,
      Partial<PreferencesFormData>
    >({
      query: (body) => ({ url: "/preferences", method: "PUT", body }),
      invalidatesTags: [{ type: "Preferences", id: "ME" }, "Property"],
    }),
  }),
});

/**
 * A one-shot read for callers that are not components — the post-login
 * redirect — and for the ones that keep their own copy: the onboarding wizard
 * and the tenant dashboard.
 *
 * It deliberately holds no subscription and forces the request. Without that,
 * the wizard's per-field autosave would invalidate the tag and immediately
 * refetch behind the user's back, which is traffic today's code does not
 * produce. The four screens that only display preferences use the generated
 * hook and do subscribe, so they still refresh once the wizard saves.
 */
export async function fetchPreferencesOnce(): Promise<PreferencesRow | null> {
  const request = store.dispatch(
    preferencesApi.endpoints.getPreferences.initiate(undefined, {
      forceRefetch: true,
    }),
  );

  try {
    return await request.unwrap();
  } finally {
    request.unsubscribe();
  }
}

export const {
  useGetPreferencesQuery,
  useCreatePreferencesMutation,
  useUpdatePreferencesMutation,
} = preferencesApi;
