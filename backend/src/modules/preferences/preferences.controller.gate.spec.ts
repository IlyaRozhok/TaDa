import { Reflector } from "@nestjs/core";

import { ALLOW_UNVERIFIED_PHONE_KEY } from "@/common/decorators/allow-unverified-phone.decorator";
import { PreferencesController } from "./preferences.controller";

/**
 * With the verification gate on, a new user is still unverified while they
 * fill in the onboarding form. Reading their own preferences is how the app
 * tells them from an existing user, so that one read is allowed; every write
 * still needs a verified phone.
 */
describe("PreferencesController under the phone verification gate", () => {
  const reflector = new Reflector();
  const allowed = (method: keyof PreferencesController) =>
    reflector.get<boolean>(ALLOW_UNVERIFIED_PHONE_KEY, PreferencesController.prototype[method] as never) === true;

  it("lets an unverified user read their own preferences", () => {
    expect(allowed("findMy")).toBe(true);
  });

  it("keeps every other route behind the gate", () => {
    const methods = Object.getOwnPropertyNames(PreferencesController.prototype).filter(
      (name) => name !== "constructor" && name !== "findMy",
    ) as Array<keyof PreferencesController>;
    expect(methods.length).toBeGreaterThan(0);
    for (const method of methods) expect(allowed(method)).toBe(false);
    expect(reflector.get(ALLOW_UNVERIFIED_PHONE_KEY, PreferencesController)).toBeUndefined();
  });
});
