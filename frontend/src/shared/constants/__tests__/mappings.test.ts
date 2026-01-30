/**
 * Tests for mapping transformations between preferences UI and admin forms
 */

import {
  transformBuildingTypeUIToAPI,
  transformBuildingTypeAPIToUI,
  transformTenantTypeUIToAPI,
  transformTenantTypeAPIToUI,
  transformDurationUIToAPI,
  transformDurationAPIToUI,
  transformBillsUIToAPI,
  transformBillsAPIToUI,
  transformPreferencesAmenitiesToAdmin,
  transformAdminAmenitiesToPreferences,
  transformPropertyTypeUIToAPI,
  transformPropertyTypeAPIToUI,
  transformFurnishingUIToAPI,
  transformFurnishingAPIToUI,
  transformOutdoorSpaceUIToAPI,
  transformOutdoorSpaceAPIToUI,
  transformRoomsUIToAPI,
  transformRoomsAPIToUI,
  transformBathroomsUIToAPI,
  transformBathroomsAPIToUI,
} from "../mappings";

describe("Building Type Transformations", () => {
  test("should transform UI values to API values", () => {
    const uiValues = ["BTR", "Co-living", "Professional Management"];
    const expected = ["btr", "co_living", "professional_management"];
    expect(transformBuildingTypeUIToAPI(uiValues)).toEqual(expected);
  });

  test("should transform API values to UI values", () => {
    const apiValues = ["btr", "co_living", "professional_management"];
    const expected = ["BTR", "Co-living", "Professional Management"];
    expect(transformBuildingTypeAPIToUI(apiValues)).toEqual(expected);
  });

  test("should handle unknown values gracefully", () => {
    expect(transformBuildingTypeUIToAPI(["Unknown"])).toEqual([]);
    expect(transformBuildingTypeAPIToUI(["unknown"])).toEqual([]);
  });
});

describe("Tenant Type Transformations", () => {
  test("should transform UI values to API values", () => {
    const uiValues = ["Professional", "Student", "Family"];
    const expected = ["corporateLets", "student", "family"];
    expect(transformTenantTypeUIToAPI(uiValues)).toEqual(expected);
  });

  test("should transform API values to UI values (multi: Corporate tenant/Other)", () => {
    const apiValues = ["corporateLets", "student", "family"];
    const result = transformTenantTypeAPIToUI(apiValues);
    expect(result).toContain("Professional");
    expect(result).toContain("Corporate tenant");
    expect(result).toContain("Student");
    expect(result).toContain("Family");
    expect(result).toContain("Other");
  });

  test("should handle Corporate tenant mapping", () => {
    expect(transformTenantTypeUIToAPI(["Corporate tenant"])).toEqual([
      "corporateLets",
    ]);
  });

  test("should handle Sharers / Friends mapping", () => {
    expect(transformTenantTypeUIToAPI(["Sharers / Friends"])).toEqual([
      "sharers",
    ]);
    expect(transformTenantTypeAPIToUI(["sharers"])).toEqual([
      "Sharers / Friends",
    ]);
  });

  test("should expand corporateLets to Professional and Corporate tenant", () => {
    expect(transformTenantTypeAPIToUI(["corporateLets"])).toEqual([
      "Professional",
      "Corporate tenant",
    ]);
  });

  test("should expand family to Family and Other", () => {
    expect(transformTenantTypeAPIToUI(["family"])).toEqual(["Family", "Other"]);
  });
});

describe("Duration Transformations", () => {
  test("should transform UI values to API values", () => {
    expect(transformDurationUIToAPI("Short term (1–6 months)")).toBe(
      "short_term",
    );
    expect(transformDurationUIToAPI("Long term (12+ months)")).toBe(
      "long_term",
    );
    expect(transformDurationUIToAPI("Flexible")).toBe("flexible");
  });

  test("should transform API values to UI values", () => {
    expect(transformDurationAPIToUI("short_term")).toBe(
      "Short term (1–6 months)",
    );
    expect(transformDurationAPIToUI("long_term")).toBe(
      "Long term (12+ months)",
    );
    expect(transformDurationAPIToUI("flexible")).toBe("Flexible");
    expect(transformDurationAPIToUI("any")).toBe("Flexible");
  });

  test("should handle Medium term mapping to long_term", () => {
    expect(transformDurationUIToAPI("Medium term (6–12 months)")).toBe(
      "long_term",
    );
  });
});

describe("Bills Transformations", () => {
  test("should transform UI values to API values", () => {
    expect(transformBillsUIToAPI("Include")).toBe("included");
    expect(transformBillsUIToAPI("Exclude")).toBe("excluded");
  });

  test("should transform API values to UI values", () => {
    expect(transformBillsAPIToUI("included")).toBe("Include");
    expect(transformBillsAPIToUI("excluded")).toBe("Exclude");
  });
});

describe("Amenities Transformations", () => {
  test("should transform preferences amenities to admin amenities", () => {
    const preferencesAmenities = [
      "gym",
      "co-working",
      "parking",
      "pet-friendly",
    ];
    const result = transformPreferencesAmenitiesToAdmin(preferencesAmenities);

    expect(result).toContain("Gym");
    expect(result).toContain("Co-working");
    expect(result).toContain("Parking");
    expect(result).toContain("Pet areas");
  });

  test("should transform admin amenities to preferences amenities", () => {
    const adminAmenities = ["Gym", "Co-working", "Parking", "Pet areas"];
    const result = transformAdminAmenitiesToPreferences(adminAmenities);

    expect(result).toContain("gym");
    expect(result).toContain("co-working");
    expect(result).toContain("parking");
    expect(result).toContain("pet-friendly");
  });

  test("should handle amenities without direct mappings", () => {
    const preferencesAmenities = ["unknown-amenity"];
    const result = transformPreferencesAmenitiesToAdmin(preferencesAmenities);
    expect(result).toEqual([]);
  });

  test("should deduplicate mapped amenities", () => {
    const preferencesAmenities = ["communal-space", "games-room"]; // Both map to 'Lounge'
    const result = transformPreferencesAmenitiesToAdmin(preferencesAmenities);
    expect(result.filter((a) => a === "Lounge")).toHaveLength(1);
  });
});

describe("Round-trip Transformations", () => {
  test("building types should maintain consistency in round-trip", () => {
    const originalUI = ["BTR", "Co-living"];
    const toAPI = transformBuildingTypeUIToAPI(originalUI);
    const backToUI = transformBuildingTypeAPIToUI(toAPI);
    expect(backToUI).toEqual(originalUI);
  });

  test("tenant types should maintain consistency in round-trip", () => {
    const originalUI = ["Professional", "Student", "Family"];
    const toAPI = transformTenantTypeUIToAPI(originalUI);
    const backToUI = transformTenantTypeAPIToUI(toAPI);
    expect(toAPI).toEqual(["corporateLets", "student", "family"]);
    originalUI.forEach((v) => expect(backToUI).toContain(v));
  });

  test("duration should maintain consistency in round-trip", () => {
    const originalUI = "Short term (1–6 months)";
    const toAPI = transformDurationUIToAPI(originalUI);
    const backToUI = transformDurationAPIToUI(toAPI);
    expect(backToUI).toBe(originalUI);
  });

  test("bills should maintain consistency in round-trip", () => {
    const originalUI = "Include";
    const toAPI = transformBillsUIToAPI(originalUI);
    const backToUI = transformBillsAPIToUI(toAPI);
    expect(backToUI).toBe(originalUI);
  });
});

describe("Property Type Transformations", () => {
  test("should transform UI values to API values", () => {
    const uiValues = ["Apartment", "Flat", "Studio"];
    const expected = ["apartment", "flat", "studio"];
    expect(transformPropertyTypeUIToAPI(uiValues)).toEqual(expected);
  });

  test("should transform API values to UI values", () => {
    const apiValues = ["apartment", "flat", "studio"];
    const expected = ["Apartment", "Flat", "Studio"];
    expect(transformPropertyTypeAPIToUI(apiValues)).toEqual(expected);
  });

  test("should handle room mappings", () => {
    expect(transformPropertyTypeUIToAPI(["En-suite room", "Room"])).toEqual([
      "room",
      "room",
    ]);
    expect(transformPropertyTypeAPIToUI(["room"])).toEqual([
      "En-suite room",
      "Room",
    ]);
  });
});

describe("Furnishing Transformations", () => {
  test("should transform UI values to API values", () => {
    const uiValues = ["Furnished", "Unfurnished", "Part-furnished"];
    const expected = ["furnished", "unfurnished", "part_furnished"];
    expect(transformFurnishingUIToAPI(uiValues)).toEqual(expected);
  });

  test("should transform API values to UI values", () => {
    const apiValues = ["furnished", "unfurnished", "part_furnished"];
    const expected = ["Furnished", "Unfurnished", "Part-furnished"];
    expect(transformFurnishingAPIToUI(apiValues)).toEqual(expected);
  });
});

describe("Outdoor Space Transformations", () => {
  test("should transform UI values to API object", () => {
    const uiValues = ["Balcony", "Terrace"];
    const result = transformOutdoorSpaceUIToAPI(uiValues);
    expect(result).toEqual({ balcony: true, terrace: true });
  });

  test("should transform API values to UI array", () => {
    const result = transformOutdoorSpaceAPIToUI(true, true, false);
    expect(result).toEqual(["Outdoor Space", "Balcony"]);
  });

  test("should handle empty values", () => {
    expect(transformOutdoorSpaceUIToAPI([])).toEqual({});
    expect(transformOutdoorSpaceAPIToUI(false, false, false)).toEqual([]);
  });
});

describe("Rooms/Bedrooms Transformations", () => {
  test("should transform UI values to API numbers", () => {
    const uiValues = ["1", "2", "3", "5+"];
    const expected = [1, 2, 3, 5];
    expect(transformRoomsUIToAPI(uiValues)).toEqual(expected);
  });

  test("should transform API numbers to UI values", () => {
    const apiValues = [1, 2, 3, 5];
    const expected = ["1", "2", "3", "5+"];
    expect(transformRoomsAPIToUI(apiValues)).toEqual(expected);
  });
});

describe("Bathrooms Transformations", () => {
  test("should transform UI values to API numbers", () => {
    const uiValues = ["1", "2", "3", "4+"];
    const expected = [1, 2, 3, 4];
    expect(transformBathroomsUIToAPI(uiValues)).toEqual(expected);
  });

  test("should transform API numbers to UI values", () => {
    const apiValues = [1, 2, 3, 4];
    const expected = ["1", "2", "3", "4+"];
    expect(transformBathroomsAPIToUI(apiValues)).toEqual(expected);
  });
});
