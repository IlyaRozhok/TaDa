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
  <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
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
  <div className="rounded-3xl border border-gray-200 p-4 sm:p-6 shadow-sm bg-white">
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

  const locationAreas = [
    preferences?.preferred_address,
    preferences?.preferred_metro_stations?.join(", "),
  ]
    .filter(Boolean)
    .join(" • ");

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
      preferences.property_types?.length,
      preferences.building_types?.length,
      preferences.let_duration,
      preferences.bedrooms?.length,
      preferences.bathrooms?.length,
      preferences.furnishing?.length,
    ].some(Boolean);

  const hasAmenities = amenityTags.length > 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-xl font-semibold text-gray-700">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || "Tenant avatar"}
                  className="w-full h-full object-cover"
                />
              ) : (
                (profile.full_name || "User")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {profile.full_name || "Tenant"}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-700">
                {meta.age_years ? (
                  <span>{meta.age_years} Years old</span>
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

          {shareUrl && (
            <button
              onClick={onShareClick}
              disabled={shareLoading}
              className="self-start inline-flex items-center gap-2 px-5 py-3 rounded-full bg-black text-white font-medium hover:bg-gray-800 transition-colors disabled:opacity-60"
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

        {/* Preferences overview */}
        {hasPreferences && (
          <div className="mt-10 grid md:grid-cols-[2fr,1fr] gap-6">
            <div className="rounded-3xl border border-gray-200 p-6 bg-white shadow-sm">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {readyLabel ? (
                  <Pill className="border border-green-600 text-green-700">
                    <CalendarDays className="w-4 h-4" />
                    {readyLabel}
                  </Pill>
                ) : null}
                {(preferences?.building_types?.length ||
                  preferences?.property_types?.length) && (
                  <Pill>
                    <Home className="w-4 h-4" />
                    {preferences?.building_types?.join(", ") ||
                      preferences?.property_types?.join(", ")}
                  </Pill>
                )}
                {preferences?.let_duration ? (
                  <Pill>{preferences.let_duration}</Pill>
                ) : null}
                {moveIn ? <Pill>Move-in {moveIn}</Pill> : null}
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-800">
                <div>
                  <div className="text-gray-500">Price per month</div>
                  <div className="font-semibold text-gray-900">
                    {priceRange}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Area</div>
                  <div className="font-semibold text-gray-900">
                    {locationAreas || "Not specified"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Property type</div>
                  <div className="font-semibold text-gray-900">
                    {preferences?.property_types?.join(", ") || "Not set"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Rooms</div>
                  <div className="font-semibold text-gray-900">
                    {preferences?.bedrooms?.join(", ") || "Not set"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Bathrooms</div>
                  <div className="font-semibold text-gray-900">
                    {preferences?.bathrooms?.join(", ") || "Not set"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Meters</div>
                  <div className="font-semibold text-gray-900">
                    {preferences?.min_square_meters ||
                    preferences?.max_square_meters
                      ? `${preferences?.min_square_meters || "?"} msq - ${
                          preferences?.max_square_meters || "?"
                        } msq`
                      : "Not set"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Outdoor space</div>
                  <div className="font-semibold text-gray-900">
                    {preferences?.balcony ||
                    preferences?.terrace ||
                    preferences?.outdoor_space
                      ? ["Balcony", "Terrace", "Outdoor space"]
                          .filter(
                            (label, idx) =>
                              [
                                preferences?.balcony,
                                preferences?.terrace,
                                preferences?.outdoor_space,
                              ][idx]
                          )
                          .join(", ")
                      : "No preference"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Bills</div>
                  <div className="font-semibold text-gray-900">
                    {preferences?.bills || "Not set"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Tenant Type</div>
                  <div className="font-semibold text-gray-900">
                    {meta.tenant_type_labels?.join(", ") ||
                      preferences?.tenant_types?.join(", ") ||
                      "Not set"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Furnishing</div>
                  <div className="font-semibold text-gray-900">
                    {preferences?.furnishing?.join(", ") || "Not set"}
                  </div>
                </div>
              </div>
            </div>

            {hasAmenities && (
              <div className="rounded-3xl border border-gray-200 p-6 bg-white shadow-sm flex flex-col gap-3">
                <SectionTitle title="Amenities" />
                <div className="flex flex-wrap gap-2">
                  {amenityTags.map((item) => (
                    <Pill key={item}>{item}</Pill>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* About */}
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 rounded-3xl border border-gray-200 p-6 bg-white shadow-sm">
            <SectionTitle title="About me" />
            <p className="text-gray-800 leading-relaxed">
              {data.about || "Not provided"}
            </p>
          </div>
          <div className="rounded-3xl border border-gray-200 p-6 bg-white shadow-sm">
            <SectionTitle title="Hobbies and Interests" />
            <div className="flex flex-wrap gap-2">
              {data.hobbies?.length ? (
                data.hobbies.map((hobby) => (
                  <Pill key={hobby}>
                    <BookOpen className="w-4 h-4" /> {hobby}
                  </Pill>
                ))
              ) : (
                <span className="text-sm text-gray-500">Not provided</span>
              )}
            </div>
          </div>
        </div>

        {/* Rent history */}
        <div className="mt-10">
          <SectionTitle title="Rent History" />
          <div className="space-y-4">
            {data.rent_history?.length ? (
              data.rent_history.map((entry, idx) => (
                <RentHistoryCard entry={entry} key={idx} />
              ))
            ) : (
              <div className="text-sm text-gray-500">No rent history yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
