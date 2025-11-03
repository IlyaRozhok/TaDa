import React from "react";
import { StepWrapper } from "../step-components/StepWrapper";
import { StepContainer } from "../step-components/StepContainer";
import { StepHeader } from "../step-components/StepHeader";
import { CustomDropdown } from "../ui/CustomDropdown";
import { LocationDropdown } from "../ui/LocationDropdown";
import { MetroDropdown } from "../ui/MetroDropdown";
import { DateRangePicker } from "../ui/DateRangePicker";
import {
  COMMUTE_LOCATION_OPTIONS,
  SECONDARY_LOCATION_OPTIONS,
} from "@/app/constants/preferences";

interface LocationStepProps {
  formData: any;
  onUpdate: (field: string, value: any) => void;
}

const POSTCODE_OPTIONS = [
  {
    value: "NW1 6XE",
    label: "NW1 6XE",
    postcode: "NW1 6XE",
    address: "221B Baker Street, Marylebone",
  },
  {
    value: "SW1A 2AA",
    label: "SW1A 2AA",
    postcode: "SW1A 2AA",
    address: "10 Downing Street, Westminster",
  },
  {
    value: "NW1 0JH",
    label: "NW1 0JH",
    postcode: "NW1 0JH",
    address: "30 Camden High Street, Camden Town",
  },
  {
    value: "E1 6RF",
    label: "E1 6RF",
    postcode: "E1 6RF",
    address: "12 Brick Lane, Shoreditch",
  },
  {
    value: "W11 3JZ",
    label: "W11 3JZ",
    postcode: "W11 3JZ",
    address: "89 Notting Hill Gate, Notting Hill",
  },
  {
    value: "E2 8AA",
    label: "E2 8AA",
    postcode: "E2 8AA",
    address: "25 Kingsland Road, Dalston",
  },
  {
    value: "SE1 1UN",
    label: "SE1 1UN",
    postcode: "SE1 1UN",
    address: "50 Southwark Street, South Bank",
  },
];

export const LocationStep: React.FC<LocationStepProps> = ({
  formData,
  onUpdate,
}) => {
  return (
    <StepWrapper
      title="Location and Commute"
      description="Where do you want to live and where will you commute to?"
    >
      <StepContainer>
        <StepHeader title="Location and date" />

        <div className="space-y-6">
          <CustomDropdown
            label="Primary postcode"
            value={formData.primary_postcode || ""}
            onChange={(value) => onUpdate("primary_postcode", value)}
            options={POSTCODE_OPTIONS}
          />

          <LocationDropdown
            label="Commute location"
            value={formData.commute_location || "no-preference"}
            options={COMMUTE_LOCATION_OPTIONS}
            onChange={(value) => onUpdate("commute_location", value)}
            placeholder="No Preference"
          />

          <MetroDropdown
            label="Secondary location (optional)"
            value={formData.secondary_location || "no-preference"}
            options={SECONDARY_LOCATION_OPTIONS}
            onChange={(value) => onUpdate("secondary_location", value)}
            placeholder="No Preference"
          />

          <DateRangePicker
            label="Move-in Date"
            value={{
              start: formData.move_in_date || null,
              end: formData.move_out_date || null,
            }}
            onChange={(range) => {
              onUpdate("move_in_date", range.start);
              onUpdate(
                "move_out_date",
                range.start === range.end ? null : range.end
              );
            }}
            placeholder="Select date range"
          />
        </div>
      </StepContainer>
    </StepWrapper>
  );
};
