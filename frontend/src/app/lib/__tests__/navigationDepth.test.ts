import { describe, it, expect, beforeEach, vi } from "vitest";

import {
  INITIAL_NAVIGATION_DEPTH_STATE,
  getNavigationDepth,
  goBackOrFallback,
  recordNavigation,
  recordPop,
  reduceNavigation,
  reducePop,
  resetNavigationDepth,
  subscribeToNavigationDepth,
} from "../navigationDepth";

/**
 * Drives the reducer the way the provider does: a baseline reading first, then
 * one entry per navigation, each carrying `window.history.length` as the
 * browser would report it at that moment.
 */
function replay(historyLengths: number[], pops: number[] = []) {
  let state = INITIAL_NAVIGATION_DEPTH_STATE;
  historyLengths.forEach((length, index) => {
    if (pops.includes(index)) {
      state = reducePop(state);
    }
    state = reduceNavigation(state, length);
  });
  return state;
}

describe("reduceNavigation", () => {
  it("takes a baseline on the first navigation without counting it", () => {
    // A deep link lands on a tab that already has entries behind it from other
    // sites. None of them are ours, so the depth stays at zero.
    expect(replay([7]).depth).toBe(0);
  });

  it("counts a push", () => {
    expect(replay([7, 8]).depth).toBe(1);
    expect(replay([7, 8, 9]).depth).toBe(2);
  });

  it("leaves the depth alone on a replace", () => {
    // replaceState swaps the current entry in place; history.length is flat.
    expect(replay([7, 7]).depth).toBe(0);
    expect(replay([7, 8, 8]).depth).toBe(1);
  });

  it("decrements when a popstate preceded the navigation", () => {
    // push, push, then a browser back: 2 → 1.
    expect(replay([7, 8, 9, 9], [3]).depth).toBe(1);
  });

  it("never drops below zero, however many pops arrive", () => {
    expect(replay([7, 7, 7], [1, 2]).depth).toBe(0);
  });

  it("consumes the pop flag so the next push counts as a push", () => {
    // push, back, push again → back to a depth of one.
    const afterPop = replay([7, 8, 8], [2]);
    expect(afterPop.depth).toBe(0);
    expect(afterPop.wasPop).toBe(false);
    expect(reduceNavigation(afterPop, 9).depth).toBe(1);
  });

  it("treats a pop as a pop even when history.length grew", () => {
    // The flag wins over the length reading: a back that the browser reports
    // with a longer history must not be mistaken for a push.
    expect(replay([7, 8], [1]).depth).toBe(0);
  });
});

describe("navigation depth store", () => {
  beforeEach(() => {
    resetNavigationDepth();
  });

  it("starts at zero — a fresh document has pushed nothing", () => {
    expect(getNavigationDepth()).toBe(0);
  });

  it("tracks pushes and pops through the module store", () => {
    recordNavigation(7);
    expect(getNavigationDepth()).toBe(0);

    recordNavigation(8);
    expect(getNavigationDepth()).toBe(1);

    recordPop();
    recordNavigation(8);
    expect(getNavigationDepth()).toBe(0);
  });

  it("notifies subscribers only when the depth actually moves", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToNavigationDepth(listener);

    recordNavigation(7); // baseline, still zero
    expect(listener).not.toHaveBeenCalled();

    recordNavigation(8); // push
    expect(listener).toHaveBeenCalledTimes(1);

    recordNavigation(8); // replace
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    recordNavigation(9);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("goBackOrFallback", () => {
  function fakeRouter() {
    return { back: vi.fn(), replace: vi.fn() };
  }

  it("replaces with the fallback when there is no in-app history", () => {
    const router = fakeRouter();

    goBackOrFallback(router, 0, "/app/units");

    expect(router.replace).toHaveBeenCalledWith("/app/units");
    expect(router.back).not.toHaveBeenCalled();
  });

  it("goes back when this document pushed at least one entry", () => {
    const router = fakeRouter();

    goBackOrFallback(router, 1, "/app/units");

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("still goes back from deeper in the stack", () => {
    const router = fakeRouter();

    goBackOrFallback(router, 4, "/");

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("falls back after a pop has walked the depth back to zero", () => {
    // The end-to-end shape behind the guest sign-in flow: land on a property,
    // open /app/auth (push), press the browser's own back, then hit Close.
    resetNavigationDepth();
    recordNavigation(7);
    recordNavigation(8);
    recordPop();
    recordNavigation(8);

    const router = fakeRouter();
    goBackOrFallback(router, getNavigationDepth(), "/");

    expect(router.replace).toHaveBeenCalledWith("/");
  });
});
