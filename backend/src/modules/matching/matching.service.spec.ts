import { averageMatchPercentage } from "./matching.service";

/**
 * The aggregate reported beside `total` on the matched-properties envelope.
 * It describes the whole matched set, so the cases that matter are the ones
 * where "no data" and "a score of zero" could be confused.
 */
describe("averageMatchPercentage", () => {
  it("averages the whole set and keeps one decimal", () => {
    expect(
      averageMatchPercentage([
        { matchPercentage: 80 },
        { matchPercentage: 71 },
        { matchPercentage: 62 },
      ]),
    ).toBe(71);

    expect(
      averageMatchPercentage([
        { matchPercentage: 80 },
        { matchPercentage: 75 },
        { matchPercentage: 71 },
      ]),
    ).toBe(75.3);
  });

  it("rounds half up, as the frontend did before the server owned this", () => {
    expect(
      averageMatchPercentage([
        { matchPercentage: 10.05 },
        { matchPercentage: 10.05 },
      ]),
    ).toBe(10.1);
  });

  it("returns null for an empty set rather than a mean of zero", () => {
    expect(averageMatchPercentage([])).toBeNull();
  });

  it("reports a genuine zero as zero", () => {
    expect(
      averageMatchPercentage([{ matchPercentage: 0 }, { matchPercentage: 0 }]),
    ).toBe(0);
  });
});
