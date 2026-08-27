import { GeocodingService } from "./geocoding.service";

describe("GeocodingService", () => {
  let service: GeocodingService;

  beforeEach(() => {
    service = new GeocodingService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("extractPostcode", () => {
    it("normalizes case and spacing", () => {
      expect(service.extractPostcode("nw18xy")).toBe("NW1 8XY");
      expect(service.extractPostcode("ec1a 1bb")).toBe("EC1A 1BB");
      expect(service.extractPostcode("SW1A2AA")).toBe("SW1A 2AA");
    });

    it("pulls the postcode out of a free-text address", () => {
      expect(
        service.extractPostcode("Flat 3, 12 Parkway, Camden, London NW1 7AA"),
      ).toBe("NW1 7AA");
    });

    it("returns null for text without a FULL postcode", () => {
      // An outward code alone cannot be geocoded to a building.
      expect(service.extractPostcode("Camden, London NW1")).toBeNull();
      expect(service.extractPostcode("12 Main Street, London")).toBeNull();
      expect(service.extractPostcode(null)).toBeNull();
      expect(service.extractPostcode("")).toBeNull();
    });
  });

  describe("lookupPostcode", () => {
    const okResponse = (result: unknown) =>
      ({
        ok: true,
        status: 200,
        json: async () => ({ status: 200, result }),
      }) as Response;

    it("returns coordinates and the borough on success", async () => {
      jest.spyOn(global, "fetch").mockResolvedValue(
        okResponse({
          postcode: "NW1 7AA",
          latitude: 51.539,
          longitude: -0.142,
          admin_district: "Camden",
        }),
      );

      await expect(service.lookupPostcode("nw17aa")).resolves.toEqual({
        postcode: "NW1 7AA",
        latitude: 51.539,
        longitude: -0.142,
        borough: "Camden",
      });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/postcodes/NW1%207AA"),
        expect.anything(),
      );
    });

    it("returns null on an unknown postcode (404)", async () => {
      jest
        .spyOn(global, "fetch")
        .mockResolvedValue({ ok: false, status: 404 } as Response);

      await expect(service.lookupPostcode("ZZ1 1ZZ")).resolves.toBeNull();
    });

    it("returns null instead of throwing on a network failure", async () => {
      jest
        .spyOn(global, "fetch")
        .mockRejectedValue(new Error("connect ETIMEDOUT"));

      // Geocoding runs inside property writes — an outage must never block
      // an operator saving a listing.
      await expect(service.lookupPostcode("NW1 7AA")).resolves.toBeNull();
    });

    it("returns null when the payload has no coordinates", async () => {
      jest
        .spyOn(global, "fetch")
        .mockResolvedValue(okResponse({ postcode: "NW1 7AA" }));

      await expect(service.lookupPostcode("NW1 7AA")).resolves.toBeNull();
    });

    it("skips the network entirely when no full postcode is present", async () => {
      const fetchSpy = jest.spyOn(global, "fetch");

      await expect(service.lookupPostcode("Camden")).resolves.toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe("geocode", () => {
    it("prefers the explicit postcode over the address", async () => {
      const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      await service.geocode("1 Street, London E1 6AN", "NW1 7AA");
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("NW1%207AA"),
        expect.anything(),
      );
    });

    it("falls back to the postcode inside the address", async () => {
      const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      await service.geocode("1 Street, London E1 6AN", null);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("E1%206AN"),
        expect.anything(),
      );
    });
  });
});
