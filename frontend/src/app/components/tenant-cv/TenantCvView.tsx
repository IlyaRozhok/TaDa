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
  Baby,
  Heart,
} from "lucide-react";
import { TenantCvResponse, RentHistoryEntry } from "../../types/tenantCv";
import { buildDisplayName, buildInitials } from "../../utils/displayName";
import {
  dateToDisplay,
  formatCurrencyRange,
  normalizeHobbies,
} from "./tenantCv.utils";

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

const StatusBadge = ({ label }: { label: string }) => (
  <span className="inline-flex font-semibold items-center gap-2 px-6 py-3 rounded-3xl border-[1.5] border-gray-300 bg-white text-sm text-gray-900">
    <span>{label}</span>
    <img 
      src="/warning-triangle.svg" 
      alt="warning" 
      className="w-4 h-4 flex-shrink-0" 
    />
  </span>
);

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
  const displayName = buildDisplayName({
    tenantProfile: {
      first_name: profile.first_name,
      last_name: profile.last_name,
      full_name: profile.full_name,
    },
    full_name: profile.full_name || undefined,
    email: profile.email || undefined,
  });
  const initials = buildInitials(displayName, profile.email || undefined);
  const avatarUrl =
    profile.avatar_url ||
    data.profile?.avatar_url ||
    (meta as any)?.avatar_url ||
    null;

  // Always show KYC and Referencing badges, even if status is null
  const badges = [
    { label: "KYC", value: meta.kyc_status || null },
    { label: "Referencing", value: meta.referencing_status || null },
  ];

  const smokeBadge =
    meta.smoker && meta.smoker !== "yes"
      ? "No smoke"
      : meta.smoker === "yes"
      ? "Smoker"
      : null;

  const petsBadge = meta.pets || null;

  // Lifestyle attributes
  const childrenCount = preferences?.children_count;
  const childrenLabel =
    childrenCount === "no"
      ? "No child"
      : childrenCount === "yes-1-child"
      ? "1 child"
      : childrenCount === "yes-2-children"
      ? "2 children"
      : childrenCount === "yes-3-plus-children"
      ? "3+ children"
      : null;

  const familyStatus = preferences?.family_status;
  const marriedLabel =
    familyStatus === "couple" || familyStatus === "couple-with-children"
      ? "Married"
      : null;

  const readyLabel =
    meta.headline ||
    (moveIn ? `Ready to move from ${moveIn}` : "Ready to move");

  // Building types for "Ready to move" section
  const buildingTypes = preferences?.building_types || [];
  const buildingTypesLabels = buildingTypes
    .map((type: string) => {
      if (type === "btr") return "BTR";
      if (type === "co-living") return "Co-living";
      return type;
    })
    .filter(Boolean);

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

  const hobbiesSource =
    (Array.isArray(data.hobbies) && data.hobbies.length > 0
      ? data.hobbies
      : null) || preferences?.hobbies;
  const hobbiesList = normalizeHobbies(hobbiesSource);
  const hasAbout = Boolean(aboutText);
  const hasHobbies = hobbiesList.length > 0;
  const hasRentHistory = data.rent_history && data.rent_history.length > 0;

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
                initials
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 mr-10">
                  {displayName}
                </h1>
                {badges.map((b) => (
                  <StatusBadge key={b.label} label={b.label} />
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-700">
                {profile.age_years ? (
                  <span>{profile.age_years} Years old</span>
                ) : null}
                {onPlatform ? (
                  <>
                    <span className="text-gray-900">•</span>
                    <span>On platform from {onPlatform}</span>
                  </>
                ) : null}
              </div>
              {/* Lifestyle attributes */}
              <div className="flex flex-wrap items-center gap-4 mt-3">
                {smokeBadge ? (
                  <span className="flex items-center gap-1.5 text-gray-800">
                    <Ban className="w-4 h-4" />
                    {smokeBadge}
                  </span>
                ) : null}
                {petsBadge ? (
                  <span className="flex items-center capitalize gap-1.5 text-gray-800">
                    <PawPrint className="w-4 h-4" />
                    {petsBadge}
                  </span>
                ) : null}
                {childrenLabel ? (
                  <span className="flex items-center gap-1.5 text-gray-800">
                    <Baby className="w-4 h-4" />
                    {childrenLabel}
                  </span>
                ) : null}
                {marriedLabel ? (
                  <span className="flex items-center gap-1.5 text-gray-800">
                    <Heart className="w-4 h-4" />
                    {marriedLabel}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            {onShareClick && (
              <button
                onClick={onShareClick}
                disabled={shareLoading}
                className="inline-flex cursor-pointer items-center gap-4 px-6 py-3 rounded-full bg-black text-white font-medium hover:bg-gray-800 transition-colors disabled:opacity-60"
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

        {/* Separator after lifestyle attributes */}
        <div className="mt-6 h-[15px] bg-gray-100/70 w-full rounded-3xl" />

        {/* Ready to move section */}
        {readyLabel && (
          <div className="mt-6 flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-green-500 bg-green-50/50">
              <CalendarDays className="w-4 h-4 text-green-700" />
              <span className="font-medium text-green-900">{readyLabel}</span>
              {buildingTypesLabels.length > 0 && (
                <>
                  <span className="text-green-700">→</span>
                  <span className="text-green-800">
                    {buildingTypesLabels.join(", ")}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Preferences overview */}
        {hasPreferences && (
          <div className="mt-10 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Preferences</h2>

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

        {/* Separator after amenities */}
        {hasAmenities && (
          <div className="mt-6 h-[1px] bg-gray-200/70 w-full" />
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
