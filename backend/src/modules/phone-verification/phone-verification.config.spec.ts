import {
  DEFAULT_ALLOWED_PHONE_COUNTRIES,
  allowedPhoneCountries,
  otpProviderName,
  phoneVerificationRequired,
  twilioCredentials,
} from "./phone-verification.config";

describe("allowedPhoneCountries", () => {
  it("defaults to the seeded list", () => {
    expect(allowedPhoneCountries({})).toEqual([
      "GB", "IE", "UA", "AT", "FR", "DE", "ES", "IT", "PL", "RO",
      "PT", "NL", "HK", "IN", "CN", "NG", "ZA", "CA", "US",
    ]);
    expect(allowedPhoneCountries({})).not.toBe(DEFAULT_ALLOWED_PHONE_COUNTRIES);
  });

  it("is overridden by ALLOWED_PHONE_COUNTRIES, normalised and de-duplicated", () => {
    expect(allowedPhoneCountries({ ALLOWED_PHONE_COUNTRIES: " gb, fr ,GB,xx-1,," })).toEqual(["GB", "FR"]);
  });

  it("ignores an override with no valid code", () => {
    expect(allowedPhoneCountries({ ALLOWED_PHONE_COUNTRIES: " , 123" })).toEqual([
      ...DEFAULT_ALLOWED_PHONE_COUNTRIES,
    ]);
  });
});

describe("phoneVerificationRequired", () => {
  it("is on only for the string true", () => {
    expect(phoneVerificationRequired({})).toBe(false);
    expect(phoneVerificationRequired({ PHONE_VERIFICATION_REQUIRED: "false" })).toBe(false);
    expect(phoneVerificationRequired({ PHONE_VERIFICATION_REQUIRED: "1" })).toBe(false);
    expect(phoneVerificationRequired({ PHONE_VERIFICATION_REQUIRED: " TRUE " })).toBe(true);
  });
});

describe("otpProviderName / twilioCredentials", () => {
  it("chooses twilio only by name", () => {
    expect(otpProviderName({})).toBe("stub");
    expect(otpProviderName({ OTP_PROVIDER: "Twilio" })).toBe("twilio");
    expect(otpProviderName({ OTP_PROVIDER: "aws" })).toBe("stub");
  });

  it("lists the missing credentials", () => {
    expect(twilioCredentials({})).toEqual({
      missing: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_VERIFY_SERVICE_SID"],
    });
    expect(
      twilioCredentials({
        TWILIO_ACCOUNT_SID: "AC",
        TWILIO_AUTH_TOKEN: "t",
        TWILIO_VERIFY_SERVICE_SID: "VA",
      }),
    ).toEqual({ accountSid: "AC", authToken: "t", serviceSid: "VA" });
  });
});
