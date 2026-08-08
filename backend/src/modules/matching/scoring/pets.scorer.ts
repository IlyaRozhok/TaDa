import { Property } from "@/entities/property.entity";
import { Preferences } from "@/entities/preferences.entity";
import { CategoryMatchResult } from "@/modules/matching/interfaces/matching.interfaces";

/**
 * Pets matching
 */
export function matchPets(
  property: Property,
  preferences: Preferences,
  maxScore: number,
): CategoryMatchResult {
  const needsPetFriendly = preferences.pet_policy === true;
  const userPets = preferences.pets || [];
  const propertyAllowsPets = property.pet_policy === true;
  const allowedPets = property.pets || [];

  // User doesn't have pets and doesn't need pet-friendly - exclude from calculation
  if (!needsPetFriendly && userPets.length === 0) {
    return {
      category: "pets",
      match: false,
      score: 0,
      maxScore: 0,
      reason: "No pet requirements",
      details: "You don't require a pet-friendly property",
      hasPreference: false,
    };
  }

  // User has pets but property doesn't allow
  if ((needsPetFriendly || userPets.length > 0) && !propertyAllowsPets) {
    return {
      category: "pets",
      match: false,
      score: 0,
      maxScore,
      reason: "Pets not allowed",
      details: "This property does not allow pets",
      hasPreference: true,
    };
  }

  // Property allows pets
  if (propertyAllowsPets) {
    // Check specific pet compatibility if user has specified pets
    if (userPets.length > 0 && allowedPets.length > 0) {
      const userPetTypes = userPets.map((p) => p.type?.toLowerCase());
      const allowedPetTypes = allowedPets.map((p) => p.type?.toLowerCase());

      const allPetsAllowed = userPetTypes.every(
        (type) =>
          allowedPetTypes.includes(type) || allowedPetTypes.includes("all"),
      );

      if (allPetsAllowed) {
        return {
          category: "pets",
          match: true,
          score: maxScore,
          maxScore,
          reason: "Pet-friendly",
          details: `Allows: ${allowedPets.map((p) => p.type).join(", ")}`,
          hasPreference: true,
        };
      }

      // Partial match
      const matchedPets = userPetTypes.filter(
        (type) =>
          allowedPetTypes.includes(type) || allowedPetTypes.includes("all"),
      );

      if (matchedPets.length > 0) {
        return {
          category: "pets",
          match: false,
          score: Math.round(
            maxScore * (matchedPets.length / userPetTypes.length),
          ),
          maxScore,
          reason: "Some pets allowed",
          details: `Allows: ${allowedPets.map((p) => p.type).join(", ")}`,
          hasPreference: true,
        };
      }
    }

    return {
      category: "pets",
      match: true,
      score: maxScore,
      maxScore,
      reason: "Pet-friendly property",
      details: allowedPets.length
        ? `Allows: ${allowedPets.map((p) => p.type).join(", ")}`
        : "Pets allowed",
      hasPreference: true,
    };
  }

  return {
    category: "pets",
    match: false,
    score: 0,
    maxScore,
    reason: "Pet policy unclear",
    details: "Pet policy not specified",
    hasPreference: true,
  };
}
