import React from "react";
import { PoundSterling } from "lucide-react";
import { InputField, SelectField } from "../ui";
import { PreferencesStepProps } from "@/app/types/preferences";

export const BudgetStep: React.FC<PreferencesStepProps> = ({
  formData,
  errors,
  onUpdate,
}) => {
  return (
    <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
          <PoundSterling className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Budget & Property Details
          </h2>
          <p className="text-slate-600 text-sm">
            Your budget and property requirements
          </p>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Budget Range
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="Minimum Price (£/month)"
            tooltip="Minimum monthly rent you're willing to pay"
            type="number"
            min="500"
            max="10000"
            placeholder="1000"
            value={formData.min_price || ""}
            onChange={(e) =>
              onUpdate("min_price", parseInt(e.target.value) || undefined)
            }
            error={errors.min_price}
          />

          <InputField
            label="Maximum Price (£/month)"
            tooltip="Maximum monthly rent you can afford"
            type="number"
            min="500"
            max="20000"
            placeholder="5000"
            value={formData.max_price || ""}
            onChange={(e) =>
              onUpdate("max_price", parseInt(e.target.value) || undefined)
            }
            error={errors.max_price}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SelectField
          label="Bedrooms (min)"
          tooltip="Minimum number of bedrooms"
          value={formData.min_bedrooms || ""}
          onChange={(e) =>
            onUpdate("min_bedrooms", parseInt(e.target.value) || undefined)
          }
          error={errors.min_bedrooms}
        >
          <option value="">No Preference</option>
          {[1, 2, 3, 4, 5].map((num) => (
            <option key={num} value={num}>
              {num} bedroom{num > 1 ? "s" : ""}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Bedrooms (max)"
          tooltip="Maximum number of bedrooms"
          value={formData.max_bedrooms || ""}
          onChange={(e) =>
            onUpdate("max_bedrooms", parseInt(e.target.value) || undefined)
          }
          error={errors.max_bedrooms}
        >
          <option value="">No Preference</option>
          {[1, 2, 3, 4, 5].map((num) => (
            <option key={num} value={num}>
              {num} bedroom{num > 1 ? "s" : ""}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Furnishing"
          tooltip="Whether you prefer furnished or unfurnished properties"
          value={formData.furnishing || ""}
          onChange={(e) => onUpdate("furnishing", e.target.value)}
          error={errors.furnishing}
        >
          <option value="furnished">Furnished</option>
          <option value="unfurnished">Unfurnished</option>
          <option value="part-furnished">Part Furnished</option>
          <option value="no-preference">No Preference</option>
        </SelectField>

        <SelectField
          label="Property Type"
          tooltip="What type of property you're looking for"
          value={formData.property_type || ""}
          onChange={(e) => onUpdate("property_type", e.target.value)}
          error={errors.property_type}
        >
          <option value="any">Any</option>
          <option value="flats">Flats</option>
          <option value="houses">Houses</option>
          <option value="studio">Studio</option>
          <option value="others">Others (specify)</option>
        </SelectField>
      </div>
    </section>
  );
};
