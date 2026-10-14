import { applyDecorators } from "@nestjs/common";
import {
  IsString,
  MaxLength,
  ValidateIf,
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from "class-validator";

import { PHONE_ISSUE_MESSAGES, processPhone } from "@/common/phone/phone";

/**
 * An optional mobile number in international form (`+`/`00` and country
 * code, any spacing). `undefined`, `null` and `""` skip validation — "" is how
 * the profile form clears the field — so only a phone actually being written
 * is checked; nothing re-validates numbers already stored.
 *
 * Built on `processPhone` rather than class-validator's `@IsPhoneNumber`:
 * that decorator accepts landlines and knows neither the "00" prefix nor the
 * calling-code retry the spec requires, so the two would disagree with the
 * form.
 */
export function IsOptionalPhone(validationOptions?: ValidationOptions) {
  return applyDecorators(
    ValidateIf((_object, value) => value !== undefined && value !== null && value !== ""),
    IsString(),
    MaxLength(64),
    IsValidPhone(undefined, validationOptions),
  );
}

/**
 * A valid mobile number. With `countryProperty`, a national number is read
 * in the country named by that sibling property (`{ countryCode: "GB",
 * number: "07123 456789" }`); without it the number must be international.
 * The error is the spec's message for the specific problem.
 */
export function IsValidPhone(countryProperty?: string, validationOptions?: ValidationOptions) {
  const countryOf = (args: ValidationArguments): string | undefined => {
    if (!countryProperty) return undefined;
    const country = (args.object as Record<string, unknown>)[countryProperty];
    return typeof country === "string" ? country : undefined;
  };

  return (object: object, propertyName: string) => {
    registerDecorator({
      name: "isValidPhone",
      target: object.constructor,
      propertyName,
      options: {
        message: (args: ValidationArguments) => {
          const issue = processPhone(String(args.value ?? ""), countryOf(args)).issue;
          return issue && issue !== "EMPTY"
            ? PHONE_ISSUE_MESSAGES[issue]
            : PHONE_ISSUE_MESSAGES.INVALID;
        },
        ...validationOptions,
      },
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          return typeof value === "string" && processPhone(value, countryOf(args)).e164 !== null;
        },
      },
    });
  };
}
