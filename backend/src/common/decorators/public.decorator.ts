import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

/**
 * Opts a route out of the global JwtAuthGuard.
 *
 * Authentication is on by default: a route with no decorator requires a valid
 * JWT. This is the only way to serve anonymous traffic, so the public surface
 * of the API is exactly `grep -r "@Public()"` — eleven routes at the time of
 * writing — instead of "every route somebody forgot to guard".
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
