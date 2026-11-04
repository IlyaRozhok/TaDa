import { describe, expect, it } from "vitest";

import { allowedBookingStatuses } from "../bookingStatus";

describe("allowedBookingStatuses", () => {
  it("offers every later stage and cancel from the start", () => {
    expect(allowedBookingStatuses("new")).toEqual([
      "new",
      "contacting",
      "kyc_referencing",
      "approved_viewing",
      "viewing",
      "contract",
      "deposit",
      "full_payment",
      "move_in",
      "rented",
      "cancel_booking",
    ]);
  });

  it("allows one step back and no more", () => {
    const allowed = allowedBookingStatuses("contract");
    expect(allowed[0]).toBe("viewing");
    expect(allowed).toContain("contract");
    expect(allowed).not.toContain("approved_viewing");
    expect(allowed).not.toContain("new");
  });

  it("keeps forward stages and cancel at the end of the pipeline", () => {
    expect(allowedBookingStatuses("move_in")).toEqual([
      "full_payment",
      "move_in",
      "rented",
      "cancel_booking",
    ]);
  });

  it("offers nothing else from a terminal status", () => {
    expect(allowedBookingStatuses("rented")).toEqual(["rented"]);
    expect(allowedBookingStatuses("cancel_booking")).toEqual(["cancel_booking"]);
  });
});
