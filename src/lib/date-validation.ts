/**
 * Date Validation Utilities for Family Tree
 * Ensures dates are realistic and logically consistent
 */

export interface DateValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates a birth date
 */
export function validateBirthDate(dateStr: string): DateValidationResult {
  if (!dateStr) {
    return { isValid: true }; // Optional field
  }

  const date = new Date(dateStr);
  const now = new Date();
  const year = date.getFullYear();

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      error: "Invalid date format",
    };
  }

  // Birth date cannot be in the future
  if (date > now) {
    return {
      isValid: false,
      error: "Birth date cannot be in the future",
    };
  }

  // Reasonable year range (1800 - current year)
  if (year < 1800) {
    return {
      isValid: false,
      error: "Birth year must be after 1800",
    };
  }

  if (year > now.getFullYear()) {
    return {
      isValid: false,
      error: `Birth year cannot be after ${now.getFullYear()}`,
    };
  }

  return { isValid: true };
}

/**
 * Validates a death date
 */
export function validateDeathDate(
  deathDateStr: string,
  birthDateStr?: string
): DateValidationResult {
  if (!deathDateStr) {
    return { isValid: true }; // Optional field
  }

  const deathDate = new Date(deathDateStr);
  const now = new Date();
  const year = deathDate.getFullYear();

  // Check if date is valid
  if (isNaN(deathDate.getTime())) {
    return {
      isValid: false,
      error: "Invalid date format",
    };
  }

  // Death date cannot be in the future
  if (deathDate > now) {
    return {
      isValid: false,
      error: "Death date cannot be in the future",
    };
  }

  // Reasonable year range
  if (year < 1800) {
    return {
      isValid: false,
      error: "Death year must be after 1800",
    };
  }

  if (year > now.getFullYear()) {
    return {
      isValid: false,
      error: `Death year cannot be after ${now.getFullYear()}`,
    };
  }

  // Death date must be after birth date
  if (birthDateStr) {
    const birthDate = new Date(birthDateStr);
    if (!isNaN(birthDate.getTime()) && deathDate < birthDate) {
      return {
        isValid: false,
        error: "Death date cannot be before birth date",
      };
    }

    // Check reasonable lifespan (max 150 years)
    const ageAtDeath = deathDate.getFullYear() - birthDate.getFullYear();
    if (ageAtDeath > 150) {
      return {
        isValid: false,
        error: "Age at death cannot exceed 150 years",
      };
    }
  }

  return { isValid: true };
}

/**
 * Validates both birth and death dates together
 */
export function validateDates(
  birthDateStr?: string,
  deathDateStr?: string
): DateValidationResult {
  if (birthDateStr) {
    const birthValidation = validateBirthDate(birthDateStr);
    if (!birthValidation.isValid) {
      return birthValidation;
    }
  }

  if (deathDateStr) {
    const deathValidation = validateDeathDate(deathDateStr, birthDateStr);
    if (!deathValidation.isValid) {
      return deathValidation;
    }
  }

  return { isValid: true };
}

/**
 * Get max date for input (today)
 */
export function getMaxDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get min date for input (year 1800)
 */
export function getMinDate(): string {
  return "1800-01-01";
}

/**
 * Format date for display
 */
export function formatDateForDisplay(dateStr?: string): string {
  if (!dateStr) return "N/A";
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Invalid Date";
    
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "Invalid Date";
  }
}

/**
 * Calculate age from birth date
 */
export function calculateAge(birthDateStr?: string, deathDateStr?: string): number | null {
  if (!birthDateStr) return null;
  
  const birthDate = new Date(birthDateStr);
  if (isNaN(birthDate.getTime())) return null;
  
  const endDate = deathDateStr ? new Date(deathDateStr) : new Date();
  if (isNaN(endDate.getTime())) return null;
  
  let age = endDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = endDate.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age >= 0 ? age : null;
}
