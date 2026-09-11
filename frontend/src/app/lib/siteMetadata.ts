import type { Metadata } from "next";

/**
 * The brand copy every share card and default <title>/description reads from.
 *
 * One place on purpose: the same two strings are the root layout's defaults,
 * the homepage's OpenGraph/Twitter card, and what any page without copy of
 * its own falls back to.
 */
export const SITE_NAME = "TA-DA!";

export const DEFAULT_TITLE = "TA-DA! London's renter-first rental platform";

export const DEFAULT_DESCRIPTION =
  "Homes come to you. Get matched with verified homes.";

/**
 * The OpenGraph fields that are true of every page on the site.
 *
 * No title, description or url here, deliberately: Next.js replaces a parent's
 * `openGraph` wholesale when a child segment sets its own, and inherits it
 * verbatim when the child does not. Brand copy or a url at the root would
 * therefore be stamped onto every page that has none of its own — /privacy
 * would share as the homepage. Pages with their own OpenGraph block spread
 * this in so they keep the site name and locale.
 */
export const SHARED_OPEN_GRAPH = {
  siteName: SITE_NAME,
  type: "website",
  locale: "en_GB",
} satisfies Metadata["openGraph"];
