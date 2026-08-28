/**
 * The single switch for "is this the indexable production site".
 *
 * NEXT_PUBLIC_SITE_ENV is set explicitly by us (Vercel project settings:
 * "production" on the Production environment, nothing elsewhere). The
 * NEXT_PUBLIC_VERCEL_ENV fallback keeps existing deploys behaving until the
 * variable is set — but that twin only exists when the Vercel project has
 * "Automatically expose System Environment Variables" enabled, which is
 * exactly why an explicit variable is safer: with neither set, the site is
 * NOT indexable, and only an explicit opt-in flips it.
 *
 * Inlined at build time (NEXT_PUBLIC_*), so robots.txt and the robots meta
 * are frozen per build — the e2e robots spec asserts the non-production
 * behaviour on every CI run.
 */
export const isIndexableSite: boolean =
  (process.env.NEXT_PUBLIC_SITE_ENV ?? process.env.NEXT_PUBLIC_VERCEL_ENV) ===
  "production";
