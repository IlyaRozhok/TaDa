import { Property, PropertyStatus } from "@/entities/property.entity";
import { toPublicProperty } from "./property.response";

const prop = (overrides: Partial<Property> = {}): Property =>
  ({
    id: "prop-1",
    title: "Flat 2B",
    status: PropertyStatus.Listed,
    created_at: new Date("2026-01-01"),
    ...overrides,
  }) as Property;

describe("toPublicProperty — Tenant Fees Act deposit cap", () => {
  it("is null when price or deposit is missing", () => {
    expect(toPublicProperty(prop()).deposit_exceeds_cap).toBeNull();
    expect(toPublicProperty(prop({ price: 2000 })).deposit_exceeds_cap).toBeNull();
    expect(toPublicProperty(prop({ deposit: 2000 })).deposit_exceeds_cap).toBeNull();
  });

  it("flags a deposit above five weeks' rent under GBP 50k annual", () => {
    // £2,000 pcm -> £24,000 a year -> weekly £461.54 -> cap £2,307.69.
    expect(
      toPublicProperty(prop({ price: 2000, deposit: 2400 })).deposit_exceeds_cap,
    ).toBe(true);
    expect(
      toPublicProperty(prop({ price: 2000, deposit: 2307.69 })).deposit_exceeds_cap,
    ).toBe(false);
  });

  it("allows six weeks at or above GBP 50k annual rent", () => {
    // £4,500 pcm -> £54,000 a year -> weekly £1,038.46 -> 6-week cap £6,230.77.
    expect(
      toPublicProperty(prop({ price: 4500, deposit: 6000 })).deposit_exceeds_cap,
    ).toBe(false);
    expect(
      toPublicProperty(prop({ price: 4500, deposit: 6500 })).deposit_exceeds_cap,
    ).toBe(true);
  });

  it("passes the EPC band through, null when absent", () => {
    expect(toPublicProperty(prop({ epc_rating: "C" })).epc_rating).toBe("C");
    expect(toPublicProperty(prop()).epc_rating).toBeNull();
  });
});
