import { describe, expect, it } from "vitest";

import {
  donutSlices,
  linePoints,
  monthLabel,
  niceMax,
  percent,
} from "../chartGeometry";

const ring = { cx: 50, cy: 50, r: 50, inner: 30 };

describe("donutSlices", () => {
  it("returns nothing for an empty or all-zero series", () => {
    expect(donutSlices([], ring)).toEqual([]);
    expect(donutSlices([0, 0], ring)).toEqual([]);
  });

  it("skips zero values but keeps the original index", () => {
    const slices = donutSlices([3, 0, 1], ring);

    expect(slices.map((s) => s.index)).toEqual([0, 2]);
    expect(slices.map((s) => s.fraction)).toEqual([0.75, 0.25]);
  });

  it("starts at 12 o'clock and uses the large-arc flag past half", () => {
    const [first] = donutSlices([3, 1], ring);

    expect(first.path.startsWith("M50 0 ")).toBe(true);
    expect(first.path).toContain("A50 50 0 1 1");
  });

  it("draws a lone slice as two half-rings", () => {
    const [only] = donutSlices([5], ring);

    expect(only.fraction).toBe(1);
    expect(only.path.match(/Z/g)).toHaveLength(2);
  });
});

describe("niceMax", () => {
  it("rounds up to 1/2/5 × 10ⁿ", () => {
    expect(niceMax(0)).toBe(1);
    expect(niceMax(3)).toBe(5);
    expect(niceMax(7)).toBe(10);
    expect(niceMax(12)).toBe(20);
    expect(niceMax(50)).toBe(50);
    expect(niceMax(51)).toBe(100);
  });
});

describe("linePoints", () => {
  it("spreads points across the width and scales to the max", () => {
    expect(linePoints([0, 5, 10], { width: 100, height: 50, max: 10 })).toEqual([
      { x: 0, y: 50 },
      { x: 50, y: 25 },
      { x: 100, y: 0 },
    ]);
  });

  it("centres a single point", () => {
    expect(linePoints([2], { width: 100, height: 50, max: 4 })).toEqual([{ x: 50, y: 25 }]);
  });
});

describe("percent", () => {
  it("rounds to one decimal and guards an empty base", () => {
    expect(percent(1, 3)).toBe(33.3);
    expect(percent(1, 0)).toBe(0);
  });
});

describe("monthLabel", () => {
  it("formats a month bucket", () => {
    expect(monthLabel("2026-09")).toBe("Sep 26");
    expect(monthLabel("garbage")).toBe("garbage");
  });
});
