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
 * Validate that the CMOS ratings for a sentence are complete
 * Each sentence requires both naturalness and accuracy scores (-3 to +3)
 */
export function areSentenceRatingsComplete(
  sentenceId: string,
  ratings: Array<{ sentenceId: string; naturalness?: number; accuracy?: number }>
): boolean {
  const rating = ratings.find(r => r.sentenceId === sentenceId);
  return rating?.naturalness != null && rating?.accuracy != null;
}
