"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import type { Country } from "@/shared/lib/countries";

const MOBILE_QUERY = "(max-width: 639px)";

/** Below Tailwind's `sm` breakpoint: where the country pickers open as a sheet. */
export function useIsMobileViewport(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(MOBILE_QUERY);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );
}

/** The part of the page the user can see: above the on-screen keyboard. */
function useVisibleViewport(): { top: number; height: number } | null {
  const [box, setBox] = useState<{ top: number; height: number } | null>(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    const update = () =>
      setBox(viewport ? { top: viewport.offsetTop, height: viewport.height } : { top: 0, height: window.innerHeight });
    update();
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return box;
}

/** A gap above the sheet: the dimmed page shows there, and tapping it closes. */
const TOP_GAP = 48;
/** The sheet floats this far from the sides and the bottom, so its bottom
 *  corners and border read the same as its top ones. */
const EDGE_GAP = 8;

/** The glass of the desktop dropdowns (PhoneMaskInput, CountryDropdown). */
const GLASS: React.CSSProperties = {
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%), rgba(0,0,0,0.5)",
  boxShadow: "0 1.5625rem 3.125rem rgba(0,0,0,0.4), 0 0.625rem 1.875rem rgba(0,0,0,0.2)",
};

interface CountrySheetProps {
  countries: Country[];
  selectedCode?: string | null;
  onSelect: (country: Country) => void;
  onClose: () => void;
  /** Shown at the top of the sheet. */
  title?: string;
  /** Show and search by the dialling code (the phone field). */
  showDialCode?: boolean;
}

/**
 * The mobile country picker: a bottom sheet portalled to <body>, above the
 * wizard footer and everything else, sized to the visual viewport so that
 * with the keyboard open the search stays at the top and the results scroll
 * in the space above the keyboard. Closes on a tap outside, the close
 * button, Escape or the browser's back.
 */
export default function CountrySheet({
  countries,
  selectedCode,
  onSelect,
  onClose,
  title,
  showDialCode = false,
}: CountrySheetProps) {
  const [query, setQuery] = useState("");
  const viewport = useVisibleViewport();
  // The listeners below are set up once; they call the latest onClose.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // The page behind does not scroll while the sheet is open.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onCloseRef.current();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Back closes the sheet rather than leaving the page: one history entry
  // (carrying the router's own state) for the sheet, dropped again when it
  // closes any other way. Deferred a tick so a mount-unmount-mount in
  // development never leaves a stray entry behind.
  useEffect(() => {
    let pushed = false;
    const onPop = () => onCloseRef.current();
    const timer = window.setTimeout(() => {
      window.history.pushState({ ...(window.history.state ?? {}), __countrySheet: true }, "");
      pushed = true;
      window.addEventListener("popstate", onPop);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("popstate", onPop);
      if (pushed && window.history.state?.__countrySheet) window.history.back();
    };
  }, []);

  const needle = query.trim().toLowerCase();
  const results = needle
    ? countries.filter(
        (country) =>
          country.name.toLowerCase().includes(needle) ||
          country.code.toLowerCase().includes(needle) ||
          (showDialCode && country.dialCode.includes(needle)),
      )
    : countries;

  if (!viewport) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* Glass, as the dropdowns: translucent dark over a blurred page, one
          rounded border all round. The blur is stronger than the dropdowns'
          3px: the sheet covers whole form fields, which at 3px still read
          through the list. Its box still follows the visual viewport, so
          the list stays above the keyboard. */}
      <div
        className="fixed flex flex-col rounded-3xl border border-white/15 overflow-hidden backdrop-blur-md"
        style={{
          ...GLASS,
          left: EDGE_GAP,
          right: EDGE_GAP,
          top: viewport.top + TOP_GAP,
          height: `calc(${Math.max(viewport.height - TOP_GAP - EDGE_GAP, 0)}px - env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-2 flex-shrink-0">
          <span className="text-base font-semibold text-white truncate">{title}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 -mr-2 rounded-full text-white/80 hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 pb-3 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white" />
            {/* text-base (16px): smaller makes iOS zoom the page on focus. */}
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search country..."
              autoComplete="off"
              enterKeyHint="search"
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-base text-white placeholder-white/50 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {results.length > 0 ? (
            results.map((country) => {
              const selected = country.code === selectedCode;
              return (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => onSelect(country)}
                  className={`w-full px-5 py-3 flex items-center gap-3 text-left cursor-pointer ${
                    selected ? "bg-white/20" : "active:bg-white/10"
                  }`}
                >
                  <span className="flex-1 min-w-0">
                    <span className="block text-base font-semibold text-white truncate">{country.name}</span>
                    {showDialCode && <span className="block text-sm text-white/70">{country.dialCode}</span>}
                  </span>
                  {selected && <span className="w-2 h-2 rounded-full bg-white flex-shrink-0" />}
                </button>
              );
            })
          ) : (
            <div className="px-5 py-6 text-sm text-white/70 text-center">No countries found</div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
