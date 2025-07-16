import React from "react";
import { Heart } from "lucide-react";
import { SelectField } from "../ui";
import { PreferencesStepProps } from "@/app/types/preferences";
import { HOBBY_OPTIONS } from "@/app/constants/preferences";

export const PersonalStep: React.FC<PreferencesStepProps> = ({
  formData,
  errors,
  onUpdate,
}) => {
  const selectedHobbies = formData.hobbies || [];

  const toggleHobby = (hobby: string) => {
    const updated = selectedHobbies.includes(hobby)
      ? selectedHobbies.filter((h) => h !== hobby)
      : [...selectedHobbies, hobby];
    onUpdate("hobbies", updated);
  };

  return (
    <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
          <Heart className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-black">Personal Preferences</h2>
          <p className="text-black text-sm">
            Tell us about yourself and your living preferences
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Hobbies */}
        <div>
          <label className="block text-sm font-semibold text-black mb-3">
            Hobbies & Interests
          </label>
          <p className="text-sm text-gray-600 mb-4">
            Select activities you enjoy (helps match you with like-minded
            housemates)
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {HOBBY_OPTIONS.map((hobby) => (
              <button
                key={hobby}
                type="button"
                onClick={() => toggleHobby(hobby)}
                className={`px-4 py-3 text-sm rounded-xl border-2 transition-all duration-200 font-medium ${
                  selectedHobbies.includes(hobby)
                    ? "bg-blue-50 border-blue-300 text-blue-700 shadow-sm"
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300"
                }`}
              >
                {hobby}
              </button>
            ))}
          </div>
          {selectedHobbies.length > 0 && (
            <p className="text-sm text-blue-600 mt-3 font-medium">
              ✓ {selectedHobbies.length} interest
              {selectedHobbies.length !== 1 ? "s" : ""} selected
            </p>
          )}
        </div>

        {/* Living Environment & Personal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SelectField
            label="Ideal Living Environment"
            tooltip="The type of household atmosphere you prefer"
            value={formData.ideal_living_environment || ""}
            onChange={(e) =>
              onUpdate("ideal_living_environment", e.target.value)
            }
            error={errors.ideal_living_environment}
          >
            <option value="quiet-professional">Quiet Professional</option>
            <option value="social-friendly">Social & Friendly</option>
            <option value="family-oriented">Family Oriented</option>
            <option value="student-lifestyle">Student Lifestyle</option>
            <option value="creative-artistic">Creative & Artistic</option>
            <option value="no-preference">No Preference</option>
          </SelectField>

          <SelectField
            label="Pets"
            tooltip="Important for matching with pet-friendly accommodations"
            value={formData.pets || ""}
            onChange={(e) => onUpdate("pets", e.target.value)}
            error={errors.pets}
          >
            <option value="none">No Pets</option>
            <option value="dog">Dog</option>
            <option value="cat">Cat</option>
            <option value="small-pets">Small Pets (Birds, Fish, etc.)</option>
            <option value="planning-to-get">Planning to Get Pet</option>
          </SelectField>
        </div>

        {/* Smoker */}
        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
          <input
            type="checkbox"
            checked={formData.smoker || false}
            onChange={(e) => onUpdate("smoker", e.target.checked)}
            className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
          />
          <div>
            <label className="text-base font-medium text-black cursor-pointer">
              I am a smoker
            </label>
            <p className="text-sm text-gray-600 mt-1">
              This helps us match you with smoking-friendly accommodations
            </p>
          </div>
        </div>

        {/* Additional Information */}
        <div>
          <label className="block text-sm font-semibold text-black mb-3">
            About You
          </label>
          <p className="text-sm text-gray-600 mb-4">
            Tell potential landlords and housemates about yourself (optional)
          </p>
          <textarea
            rows={4}
            value={formData.additional_info || ""}
            onChange={(e) => onUpdate("additional_info", e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors resize-none text-black placeholder-gray-500 bg-white"
            placeholder="e.g., I'm a quiet professional who enjoys cooking and reading. I keep a clean living space and am always respectful of neighbors. I'm looking for a peaceful home environment where I can relax after work..."
          />
          {errors.additional_info && (
            <p className="text-red-600 text-sm mt-1">
              {errors.additional_info}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
