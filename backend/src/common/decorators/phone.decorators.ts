import { applyDecorators } from "@nestjs/common";
import {
  IsPhoneNumber,
  IsString,
  MaxLength,
  ValidateIf,
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from "class-validator";

import { isValidPhone } from "@/common/phone/phone";

/**
 * An optional international phone number (`+` and country code, any
 * spacing). `undefined`, `null` and `""` skip validation — "" is how the
 * profile form clears the field — so only a phone actually being written is
 * checked; nothing re-validates numbers already stored.
 */
export function IsOptionalPhone(validationOptions?: ValidationOptions) {
  return applyDecorators(
    ValidateIf((_object, value) => value !== undefined && value !== null && value !== ""),
    IsString(),
    MaxLength(64),
    // class-validator's own check, backed by the same libphonenumber-js.
    IsPhoneNumber(undefined, {
      message: "phone must be a valid international phone number, e.g. +447911123456",
      ...validationOptions,
    }),
  );
}

/**
 * A valid phone number whose country is a sibling property
 * (`{ countryCode: "GB", number: "07911 123456" }`) — the case
 * `@IsPhoneNumber`, which takes a fixed region, cannot express.
 */
export function IsValidPhone(countryProperty?: string, validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: "isValidPhone",
      target: object.constructor,
      propertyName,
      options: {
        message: `${propertyName} must be a valid phone number`,
        ...validationOptions,
      },
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const country = countryProperty
            ? (args.object as Record<string, unknown>)[countryProperty]
            : undefined;
          return isValidPhone(value, typeof country === "string" ? country : undefined);
        },
      },
    });
  };
}
