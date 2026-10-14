import { SetMetadata } from "@nestjs/common";

export const ALLOW_UNVERIFIED_PHONE_KEY = "allowUnverifiedPhone";

/**
 * Lets a signed-in user whose phone is not yet verified reach a route while
 * the verification gate is on (`PHONE_VERIFICATION_REQUIRED=true`). Only what
 * the verification screen needs carries it: the session itself (`/auth/*`)
 * and the phone endpoints.
 */
export const AllowUnverifiedPhone = () => SetMetadata(ALLOW_UNVERIFIED_PHONE_KEY, true);
