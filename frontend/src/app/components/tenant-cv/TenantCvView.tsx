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
  MapPin,
  Train,
  Building2,
  Sun,
  Ruler,
  Zap,
  Users,
  Bed,
  Bath,
  Sofa,
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
  const moveOut = dateToDisplay(meta.move_out_date);
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

  // Ready label without date
  const readyLabel = meta.headline || "Ready to move";
  
  // Date range for display on the right
  const readyMoveDateRange = moveIn 
    ? `Ready to move ${moveIn}${moveOut ? ` - to ${moveOut}` : ''}`
    : null;

  // Format duration for display
  const formatDuration = (duration?: string | null): string | null => {
    if (!duration) return null;
    const durationMap: Record<string, string> = {
      "long_term": "Long term 6+ m",
      "short_term": "Short term 1+ m",
      "flexible": "Flexible",
      "6_months": "6 months",
      "12_months": "12 months",
      "18_months": "18 months",
      "24_months": "24 months",
      "any": "Any",
    };
    return durationMap[duration] || duration;
  };

  const durationLabel = formatDuration(preferences?.let_duration);

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

  // Outdoor space preferences
  const outdoorSpaceItems = [];
  if (preferences?.balcony) outdoorSpaceItems.push("Balcony");
  if (preferences?.terrace) outdoorSpaceItems.push("Terrace");
  if (preferences?.outdoor_space && !preferences?.balcony && !preferences?.terrace) {
    outdoorSpaceItems.push("Outdoor space");
  }
  const outdoorSpaceLabel = outdoorSpaceItems.length > 0 ? outdoorSpaceItems.join(", ") : null;

  // Meters range
  const metersRange =
    preferences?.min_square_meters && preferences?.max_square_meters
      ? `${preferences.min_square_meters} msq - ${preferences.max_square_meters} msq`
      : preferences?.min_square_meters
      ? `${preferences.min_square_meters} msq+`
      : preferences?.max_square_meters
      ? `up to ${preferences.max_square_meters} msq`
      : null;

  // Bills label
  const billsLabel = preferences?.bills
    ? preferences.bills === "included"
      ? "Include"
      : preferences.bills === "excluded"
      ? "Exclude"
      : preferences.bills.charAt(0).toUpperCase() + preferences.bills.slice(1)
    : null;

  // Tenant types
  const tenantTypesLabel = preferences?.tenant_types?.join(", ") || null;

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
        {(readyLabel || buildingTypesLabels.length > 0 || readyMoveDateRange) && (
          <div className="mt-6 flex items-center gap-3 flex-wrap">
            {/* Ready to move badge with green border and duration */}
            {readyLabel && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-[1.5px] border-green-500 bg-white">
                <Home className="w-4 h-4 text-gray-900" />
                <span className="font-medium text-gray-900">
                  {readyLabel}
                </span>
                {durationLabel && (
                  <>
                    <span className="text-gray-900">-</span>
                    <span className="text-gray-900">{durationLabel}</span>
                  </>
                )}
              </div>
            )}

            {/* Building style preferences badge without green border */}
            {buildingTypesLabels.length > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-[1.5px] border-gray-300 bg-white">
                <Building2 className="w-4 h-4 text-gray-900" />
                <span className="font-medium text-gray-900">
                  {buildingTypesLabels.join(", ")}
                </span>
              </div>
            )}

            {/* Date range text on the right, aligned to container */}
            {readyMoveDateRange && (
              <span className="ml-auto font-medium text-gray-900">
                {readyMoveDateRange}
              </span>
            )}
          </div>
        )}

        {/* Preferences overview */}
        {hasPreferences && (
          <div className="mt-10 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Preferences</h2>

            {/* Price section */}
            <div className="bg-white">
              <div className="text-xs tracking-wide text-gray-500 mb-1">
                Price per month
              </div>
              <div className="text-3xl font-semibold tracking-wide text-gray-900">
                {priceRange}
              </div>
            </div>

            {/* Three columns */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Column 1 */}
              <div className="bg-white space-y-4">
                <div className="space-y-4">
                  {preferredAreas ? (
                    <div className="flex items-start gap-2">
                      <Home className="w-4 h-4 mt-0.5 text-gray-700 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm text-gray-500 mb-0.5">Area</div>
                        <div className="font-medium text-gray-900">{preferredAreas}</div>
                      </div>
                    </div>
                  ) : null}
                  {preferredDistricts ? (
                    <div className="flex items-start gap-2">
                      <Home className="w-4 h-4 mt-0.5 text-gray-700 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm text-gray-500 mb-0.5">District</div>
                        <div className="font-medium text-gray-900">{preferredDistricts}</div>
                      </div>
                    </div>
                  ) : null}
                  {preferredMetro ? (
                    <div className="flex items-start gap-2">
                      <Train className="w-4 h-4 mt-0.5 text-gray-700 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm text-gray-500 mb-0.5">
                          Metro Station
                        </div>
                        <div className="font-medium text-gray-900">{preferredMetro}</div>
                      </div>
                    </div>
                  ) : null}
                  {preferredAddress ? (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 text-gray-700 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm text-gray-500 mb-0.5">
                          Desired Address
                        </div>
                        <div className="font-medium text-gray-900">{preferredAddress}</div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Column 2 */}
              <div className="bg-white space-y-4">
                <div className="flex items-start gap-2">
                  <Home className="w-4 h-4 mt-0.5 text-gray-700 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="text-sm text-gray-500">Property type</div>
                    <div className="font-medium text-gray-900">
                      {preferences?.property_types?.join(", ") || "Not set"}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Bed className="w-4 h-4 mt-0.5 text-gray-700 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="text-sm text-gray-500">Rooms</div>
                    <div className="font-medium text-gray-900">
                      {preferences?.bedrooms?.join(", ") || "Not set"}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Bath className="w-4 h-4 mt-0.5 text-gray-700 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="text-sm text-gray-500">Bathrooms</div>
                    <div className="font-medium text-gray-900">
                      {preferences?.bathrooms?.join(", ") || "Not set"}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Sofa className="w-4 h-4 mt-0.5 text-gray-700 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="text-sm text-gray-500">Furnishing</div>
                    <div className="font-medium text-gray-900">
                      {preferences?.furnishing?.join(", ") || "Not set"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 3 */}
              <div className="bg-white space-y-4">
                {outdoorSpaceLabel && (
                  <div className="flex items-start gap-2">
                    <Sun className="w-4 h-4 mt-0.5 text-gray-700 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm text-gray-500 mb-0.5">Outdoor space</div>
                      <div className="font-medium text-gray-900">{outdoorSpaceLabel}</div>
                    </div>
                  </div>
                )}
                {metersRange && (
                  <div className="flex items-start gap-2">
                    <Ruler className="w-4 h-4 mt-0.5 text-gray-700 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm text-gray-500 mb-0.5">Meters</div>
                      <div className="font-medium text-gray-900">{metersRange}</div>
                    </div>
                  </div>
                )}
                {billsLabel && (
                  <div className="flex items-start gap-2">
                    <Zap className="w-4 h-4 mt-0.5 text-gray-700 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm text-gray-500 mb-0.5">Bills</div>
                      <div className="font-medium text-gray-900">{billsLabel}</div>
                    </div>
                  </div>
                )}
                {tenantTypesLabel && (
                  <div className="flex items-start gap-2">
                    <Users className="w-4 h-4 mt-0.5 text-gray-700 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm text-gray-500 mb-0.5">Tenant Type</div>
                      <div className="font-medium text-gray-900">{tenantTypesLabel}</div>
                    </div>
                  </div>
                )}
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
          <div className="mt-6 h-[15px] bg-gray-100/70 w-full rounded-3xl" />
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
