import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

import { UpdateUserDto } from "@/modules/users/dto/update-user.dto";
import { AdminUpdateUserDto } from "@/modules/users/dto/admin-update-user.dto";
import { CreateBookingRequestDto } from "@/modules/booking-request/dto/create-booking-request.dto";
import { CallRequestPhoneDto } from "@/modules/call-request/dto/create-call-request.dto";

/** The properties that failed validation, for compact assertions. */
async function failing(cls: new () => object, body: object): Promise<string[]> {
  const errors = await validate(plainToInstance(cls, body));
  return errors.map((e) => e.property);
}

const VALID = [
  "+447123456789",
  "+44 7911 123456",
  "00447123456789",
  "+12015550123",
  "+4915123456789",
];
// Truncated, too short, national without a country, junk, landline and a UK
// personal (070) number — the last two are valid numbers but not mobiles.
const INVALID = [
  "+447041 23079",
  "+44123",
  "07911123456",
  "hello",
  "+",
  "1234567",
  "+442079460000",
  "+447041230790",
];

describe.each([
  ["UpdateUserDto", UpdateUserDto, "phone"],
  ["AdminUpdateUserDto", AdminUpdateUserDto, "phone"],
  ["CreateBookingRequestDto", CreateBookingRequestDto, "phone_number"],
] as const)("%s.%s", (_name, cls, field) => {
  // The booking DTO also requires property_id; give it one so only the
  // phone decides the outcome.
  const base = cls === CreateBookingRequestDto
    ? { property_id: "3d731185-a19d-4b57-8475-7cbc1732ee4c" }
    : {};

  it.each(VALID)("accepts %s", async (phone) => {
    expect(await failing(cls, { ...base, [field]: phone })).toEqual([]);
  });

  it.each(INVALID)("rejects %s", async (phone) => {
    expect(await failing(cls, { ...base, [field]: phone })).toEqual([field]);
  });

  it("lets an absent, null or empty phone through (\"\" clears it)", async () => {
    expect(await failing(cls, { ...base })).toEqual([]);
    expect(await failing(cls, { ...base, [field]: null })).toEqual([]);
    expect(await failing(cls, { ...base, [field]: "" })).toEqual([]);
  });

  it("rejects a non-string phone", async () => {
    expect(await failing(cls, { ...base, [field]: 447911123456 })).toEqual([field]);
  });

  it.each([
    ["+440740 088369", "Number is too short — please check it"],
    ["+4471234567890", "Number is too long — please check it"],
    ["+442079460000", "Please enter a mobile number"],
    ["hello", "Please enter a valid phone number"],
  ])("explains %s with the spec message", async (phone, message) => {
    const errors = await validate(
      plainToInstance(cls as new () => object, { ...base, [field]: phone }),
    );
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(messages).toContain(message);
  });
});

describe("CallRequestPhoneDto", () => {
  it("validates a national number in the chosen country", async () => {
    expect(await failing(CallRequestPhoneDto, { countryCode: "GB", number: "07911 123456" })).toEqual([]);
    expect(await failing(CallRequestPhoneDto, { countryCode: "DE", number: "01512 3456789" })).toEqual([]);
  });

  it("accepts an international number whatever the country", async () => {
    expect(await failing(CallRequestPhoneDto, { countryCode: "GB", number: "+33 6 12 34 56 78" })).toEqual([]);
  });

  it("rejects a landline", async () => {
    expect(await failing(CallRequestPhoneDto, { countryCode: "GB", number: "020 7946 0000" })).toEqual([
      "number",
    ]);
  });

  it("rejects a number that is not valid for the country", async () => {
    expect(await failing(CallRequestPhoneDto, { countryCode: "GB", number: "7041 23079" })).toEqual([
      "number",
    ]);
    expect(await failing(CallRequestPhoneDto, { countryCode: "US", number: "555" })).toEqual([
      "number",
    ]);
  });
});
