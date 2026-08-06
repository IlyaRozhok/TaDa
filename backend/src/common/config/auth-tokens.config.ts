/**
 * Lifetimes of the two session tokens, in one place.
 *
 * They used to be three independent constants: `expiresIn: "15m"` and
 * `expiresIn: "7d"` hardcoded at the sign call, plus a `maxAge` on the refresh
 * cookie that repeated the second one in milliseconds. `JWT_ACCESS_EXPIRES_IN`
 * was read by the JwtModule but always lost to the per-call option, and
 * `JWT_REFRESH_EXPIRES_IN` was read nowhere at all.
 *
 * The defaults live here rather than in the hosts' `.env` on purpose: a deploy
 * has to pick up the 30-day refresh window without anyone editing environment
 * files on the servers first.
 */

export const ACCESS_TOKEN_TTL_DEFAULT = "15m";
export const REFRESH_TOKEN_TTL_DEFAULT = "30d";

const TTL_PATTERN = /^(\d+)\s*(ms|s|m|h|d|w)?$/i;

const UNIT_IN_MS = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
} as const;

/**
 * Converts a `jsonwebtoken` lifetime string to milliseconds, so the same value
 * can drive both `expiresIn` and a cookie `maxAge`. A bare number means seconds,
 * which is what jsonwebtoken does with it too.
 *
 * @throws if the value is not a lifetime this app accepts.
 */
export function ttlToMs(ttl: string): number {
  const match = TTL_PATTERN.exec(ttl.trim());
  if (!match) {
    throw new Error(`Unsupported token lifetime: "${ttl}"`);
  }

  const unit = (match[2]?.toLowerCase() ?? "s") as keyof typeof UNIT_IN_MS;
  return Number(match[1]) * UNIT_IN_MS[unit];
}

export interface TokenTtl {
  /** The `expiresIn` option handed to jsonwebtoken. */
  readonly value: string;
  /** The same lifetime in milliseconds, for the cookie `maxAge`. */
  readonly ms: number;
}

/**
 * Takes the environment value when it is a lifetime we can parse, and the
 * built-in default otherwise. A typo in an environment file must not be able to
 * bring authentication down, and it must not be able to silently produce a
 * cookie whose `maxAge` disagrees with the token's own expiry.
 */
export function resolveTokenTtl(raw: string | undefined, fallback: string): TokenTtl {
  const candidate = raw?.trim();

  if (candidate) {
    try {
      return { value: candidate, ms: ttlToMs(candidate) };
    } catch {
      // Fall through to the default below.
    }
  }

  return { value: fallback, ms: ttlToMs(fallback) };
}

export const accessTokenTtl = (): TokenTtl =>
  resolveTokenTtl(process.env.JWT_ACCESS_EXPIRES_IN, ACCESS_TOKEN_TTL_DEFAULT);

export const refreshTokenTtl = (): TokenTtl =>
  resolveTokenTtl(process.env.JWT_REFRESH_EXPIRES_IN, REFRESH_TOKEN_TTL_DEFAULT);
