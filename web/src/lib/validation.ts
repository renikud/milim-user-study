/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate name (minimum 2 characters)
 */
export function isValidName(name: string): boolean {
  return name.trim().length >= 2;
}

/**
 * Validate that the preference rating for a sentence is complete
 * Each sentence requires one spoken-Hebrew score (-3 to +3)
 */
export function areSentenceRatingsComplete(
  sentenceId: string,
  ratings: Array<{ sentenceId: string; naturalness?: number }>
): boolean {
  const rating = ratings.find(r => r.sentenceId === sentenceId);
  return rating?.naturalness != null;
}
