import { AuthController } from "./auth.controller";

/**
 * `/auth/me` carries the gate's verdict for the signed-in user, so the
 * frontend routes to the verification screen on it rather than on a public
 * flag of its own.
 */
describe("AuthController GET /auth/me — phone_verification_pending", () => {
  const me = async (user: Record<string, unknown> | null) => {
    const authService = { findUserWithProfile: jest.fn().mockResolvedValue(user) };
    const controller = new AuthController(authService as any);
    return controller.getProfile({ id: "u1" } as any);
  };

  afterEach(() => {
    delete process.env.PHONE_VERIFICATION_REQUIRED;
  });

  it("is false while the gate is off, verified or not", async () => {
    expect((await me({ id: "u1", phone_verified_at: null })).user).toMatchObject({
      id: "u1",
      phone_verification_pending: false,
    });
  });

  it("is true with the gate on and the phone unverified", async () => {
    process.env.PHONE_VERIFICATION_REQUIRED = "true";
    expect((await me({ id: "u1", phone_verified_at: null })).user).toMatchObject({
      phone_verification_pending: true,
    });
  });

  it("is false with the gate on once the phone is verified", async () => {
    process.env.PHONE_VERIFICATION_REQUIRED = "true";
    const verifiedAt = new Date("2026-10-12T10:00:00Z");
    expect((await me({ id: "u1", phone_verified_at: verifiedAt })).user).toMatchObject({
      phone_verified_at: verifiedAt,
      phone_verification_pending: false,
    });
  });

  it("passes a missing user through untouched", async () => {
    expect(await me(null)).toEqual({ user: null });
  });
});
