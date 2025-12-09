"use client";

import React from "react";
import {
  CalendarDays,
  Shield,
  PawPrint,
  Ban,
  Home,
  Info,
  Share,
  BookOpen,
} from "lucide-react";
import { TenantCvResponse, RentHistoryEntry } from "../../types/tenantCv";

interface TenantCvViewProps {
  data: TenantCvResponse;
  shareUrl?: string | null;
  onShareClick?: () => void;
  shareLoading?: boolean;
}

const SectionTitle = ({ title }: { title: string }) => (
  <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4">{title}</h3>
);

const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-sm text-gray-800">
    {children}
  </span>
);

const formatCurrencyRange = (min?: number | null, max?: number | null) => {
  if (!min && !max) return "Not set";
  const fmt = (v: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(v);
  if (min && max) return `${fmt(min)}-${fmt(max)}`;
  return min ? `from ${fmt(min)}` : `up to ${fmt(max!)}`;
};

const dateToDisplay = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const RentHistoryCard = ({ entry }: { entry: RentHistoryEntry }) => (
  <div className="border border-gray-200 rounded-none p-4 sm:p-6 shadow-none bg-white">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
      <div>
        <div className="text-sm text-gray-600 mb-1">
          {entry.period_from
            ? `${dateToDisplay(entry.period_from)} – ${
                entry.period_to ? dateToDisplay(entry.period_to) : "present"
              }`
            : "Period not specified"}
        </div>
        <h4 className="text-xl font-semibold text-gray-900">
          {entry.property_name || "Previous property"}
        </h4>
        <p className="text-sm text-gray-600">
          {entry.address}
          {entry.city ? `, ${entry.city}` : ""}
        </p>
      </div>
      {typeof entry.price_per_month === "number" && (
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            £{entry.price_per_month.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">/ month</div>
        </div>
      )}
    </div>

    <div className="flex flex-wrap gap-2 mt-3 text-sm text-gray-700">
      {entry.bedrooms ? <Pill>{entry.bedrooms} Bed</Pill> : null}
      {entry.bathrooms ? <Pill>{entry.bathrooms} Bath</Pill> : null}
      {entry.size_sqft ? <Pill>{entry.size_sqft} sq ft</Pill> : null}
      {entry.property_type ? <Pill>{entry.property_type}</Pill> : null}
      {entry.furnishing ? <Pill>{entry.furnishing}</Pill> : null}
      {entry.match_score ? <Pill>{entry.match_score}% match</Pill> : null}
    </div>

    {entry.review && (
      <div className="mt-4 p-4 rounded-2xl bg-gray-50 text-gray-800 text-sm leading-relaxed">
        {entry.review}
      </div>
    )}
  </div>
);

export function TenantCvView({
  data,
  shareUrl,
  onShareClick,
  shareLoading,
}: TenantCvViewProps) {
  const { profile, meta, preferences } = data;
  const moveIn = dateToDisplay(meta.move_in_date);
  const onPlatform = dateToDisplay(meta.created_at);
  const displayName =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    null ||
    profile.full_name ||
    meta.headline ||
    profile.email ||
    meta.tenant_type_labels?.[0] ||
    "Tenant";
  const avatarUrl =
    profile.avatar_url ||
    data.profile?.avatar_url ||
    (meta as any)?.avatar_url ||
    null;

  const badges = [
    meta.kyc_status ? { label: "KYC", value: meta.kyc_status } : null,
    meta.referencing_status
      ? { label: "Referencing", value: meta.referencing_status }
      : null,
  ].filter(Boolean) as { label: string; value: string }[];

  const smokeBadge =
    meta.smoker && meta.smoker !== "yes"
      ? "No smoke"
      : meta.smoker === "yes"
      ? "Smoker"
      : null;

  const petsBadge = meta.pets || null;

  const readyLabel =
    meta.headline ||
    (moveIn ? `Ready to move from ${moveIn}` : "Ready to move");

  const priceRange = formatCurrencyRange(
    preferences?.min_price,
    preferences?.max_price
  );

  const preferredAreas = preferences?.preferred_areas?.join(", ");
  const preferredDistricts = preferences?.preferred_districts?.join(", ");
  const preferredMetro = preferences?.preferred_metro_stations?.join(", ");
  const preferredAddress = preferences?.preferred_address;

  const amenityTags = [
    ...(preferences?.amenities || []),
    preferences?.is_concierge ? "Has Concierge Service" : null,
    preferences?.smoking_area ? "Has smoking area" : null,
    preferences?.balcony ? "Balcony" : null,
    preferences?.terrace ? "Terrace" : null,
    preferences?.outdoor_space ? "Outdoor space" : null,
  ].filter(Boolean) as string[];

  const hasPreferences =
    preferences &&
    [
      preferences.min_price,
      preferences.max_price,
      preferences.preferred_address,
      preferences.preferred_areas?.length,
      preferences.preferred_districts?.length,
      preferences.preferred_metro_stations?.length,
      preferences.property_types?.length,
      preferences.building_types?.length,
      preferences.let_duration,
      preferences.bedrooms?.length,
      preferences.bathrooms?.length,
      preferences.furnishing?.length,
    ].some(Boolean);

  const hasAmenities = amenityTags.length > 0;
  const aboutText = data.about || preferences?.additional_info || "";

  const normalizeHobbies = (input: unknown): string[] => {
    if (!input) return [];
    if (Array.isArray(input)) {
      return input
        .map((h) => {
          if (typeof h === "string") return h.trim();
          if (h && typeof h === "object") {
            const obj = h as Record<string, unknown>;
            return (
              (typeof obj.label === "string" && obj.label) ||
              (typeof obj.name === "string" && obj.name) ||
              (typeof obj.value === "string" && obj.value) ||
              ""
            ).trim();
          }
          return "";
        })
        .filter(Boolean);
    }
    if (typeof input === "string") {
      return input
        .split(/[,;]+/)
        .map((h) => h.trim())
        .filter(Boolean);
    }
    return [];
  };

  const hobbiesSource =
    (Array.isArray(data.hobbies) && data.hobbies.length > 0
      ? data.hobbies
      : null) || preferences?.hobbies;
  const hobbiesList = normalizeHobbies(hobbiesSource);
  const hasAbout = Boolean(aboutText);
  const hasHobbies = hobbiesList.length > 0;
  const hasRentHistory = data.rent_history && data.rent_history.length > 0;

  console.log("here");
  console.log(profile);
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex flex-col items-start gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-xl font-semibold text-gray-700">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName || "Tenant avatar"}
                  className="w-full h-full object-cover"
                />
              ) : (
                displayName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {displayName}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-700">
                {profile.age_years ? (
                  <span>{profile.age_years} Years old</span>
                ) : null}
                {onPlatform ? (
                  <>
                    <span className="text-gray-400">•</span>
                    <span>On platform from {onPlatform}</span>
                  </>
                ) : null}
                {smokeBadge ? (
                  <span className="flex items-center gap-1 text-gray-800">
                    <Ban className="w-4 h-4" /> {smokeBadge}
                  </span>
                ) : null}
                {petsBadge ? (
                  <span className="flex items-center gap-1 text-gray-800">
                    <PawPrint className="w-4 h-4" /> {petsBadge}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {badges.map((b) => (
                  <Pill key={b.label}>
                    <Shield className="w-4 h-4" />
                    {b.label}: {b.value}
                  </Pill>
                ))}
                {readyLabel ? (
                  <Pill>
                    <CalendarDays className="w-4 h-4" />
                    {readyLabel}
                  </Pill>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            {onShareClick && (
              <button
                onClick={onShareClick}
                disabled={shareLoading}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-black text-white font-medium hover:bg-gray-800 transition-colors disabled:opacity-60"
              >
                {shareLoading ? (
                  <Info className="w-4 h-4 animate-pulse" />
                ) : (
                  <Share className="w-4 h-4" />
                )}
                {shareLoading ? "Generating link..." : "Share profile"}
              </button>
            )}
          </div>
        </div>

        {/* Divider bar under header */}
        <div className="mt-6 h-[1px] bg-gray-200/70 w-full" />

        {/* Preferences overview */}
        {hasPreferences && (
          <div className="mt-10 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-gray-900">Preferences</h2>
              {readyLabel ? (
                <Pill>
                  <CalendarDays className="w-4 h-4" />
                  {readyLabel}
                </Pill>
              ) : null}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Column 1 */}
              <div className="bg-white space-y-4">
                <div>
                  <div className="text-sm uppercase text-gray-500">
                    Price per month
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mt-1">
                    {priceRange}
                  </div>
                </div>

                <div className="space-y-3 text-gray-800">
                  {preferredAreas ? (
                    <div className="flex items-start gap-2">
                      <Home className="w-4 h-4 mt-1" />
                      <div>
                        <div className="text-sm text-gray-500">Area</div>
                        <div className="font-medium">{preferredAreas}</div>
                      </div>
                    </div>
                  ) : null}
                  {preferredDistricts ? (
                    <div className="flex items-start gap-2">
                      <Home className="w-4 h-4 mt-1" />
                      <div>
                        <div className="text-sm text-gray-500">District</div>
                        <div className="font-medium">{preferredDistricts}</div>
                      </div>
                    </div>
                  ) : null}
                  {preferredMetro ? (
                    <div className="flex items-start gap-2">
                      <Home className="w-4 h-4 mt-1" />
                      <div>
                        <div className="text-sm text-gray-500">
                          Metro Station
                        </div>
                        <div className="font-medium">{preferredMetro}</div>
                      </div>
                    </div>
                  ) : null}
                  {preferredAddress ? (
                    <div className="flex items-start gap-2">
                      <Home className="w-4 h-4 mt-1" />
                      <div>
                        <div className="text-sm text-gray-500">
                          Desired Address
                        </div>
                        <div className="font-medium">{preferredAddress}</div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Column 2 */}
              <div className="bg-white space-y-4 md:pt-6">
                <div className="space-y-2 text-gray-800">
                  <div className="text-sm text-gray-500">Property type</div>
                  <div className="font-medium">
                    {preferences?.property_types?.join(", ") || "Not set"}
                  </div>
                </div>
                <div className="space-y-2 text-gray-800">
                  <div className="text-sm text-gray-500">Rooms</div>
                  <div className="font-medium">
                    {preferences?.bedrooms?.join(", ") || "Not set"}
                  </div>
                </div>
                <div className="space-y-2 text-gray-800">
                  <div className="text-sm text-gray-500">Bathrooms</div>
                  <div className="font-medium">
                    {preferences?.bathrooms?.join(", ") || "Not set"}
                  </div>
                </div>
                <div className="space-y-2 text-gray-800">
                  <div className="text-sm text-gray-500">Furnishing</div>
                  <div className="font-medium">
                    {preferences?.furnishing?.join(", ") || "Not set"}
                  </div>
                </div>
              </div>
            </div>

            {/* Amenities */}
            {hasAmenities && (
              <div className="bg-white pt-1">
                <SectionTitle title="Amenities" />
                <div className="flex flex-wrap gap-2">
                  {amenityTags.map((a) => (
                    <Pill key={a}>{a}</Pill>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* About / Hobbies / Rent history */}
        <div className="mt-10 space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2 bg-white">
              <SectionTitle title="About me" />
              <p className="text-gray-800 leading-relaxed">
                {hasAbout ? aboutText : "Not provided"}
              </p>
            </div>
            <div className="bg-white">
              <SectionTitle title="Hobbies and Interests" />
              <div className="flex flex-wrap gap-2">
                {hasHobbies ? (
                  hobbiesList.map((hobby: string) => (
                    <Pill key={hobby}>{hobby}</Pill>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">Not provided</span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-gray-700" />
              <h2 className="text-2xl font-bold text-gray-900">Rent History</h2>
            </div>
            {hasRentHistory ? (
              <div className="space-y-4">
                {data.rent_history!.map((entry, idx) => (
                  <RentHistoryCard entry={entry} key={idx} />
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                No rent history for now on our platform.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
