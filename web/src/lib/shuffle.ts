/**
 * Seeded random number generator using mulberry32 algorithm
 * Provides deterministic pseudo-random numbers
 */
function seededRandom(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Convert string to numeric seed
 */
function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Fisher-Yates shuffle with seeded randomness
 */
export function shuffleArray<T>(array: T[], seed: string): T[] {
  const shuffled = [...array];
  const random = seededRandom(stringToSeed(seed));
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

/**
 * Generate deterministic shuffles for a user session
 * Returns shuffled sentence order and per-sentence model orders
 */
export function generateShuffles(
  sessionId: string,
  sentenceIds: string[],
  models: string[]
): {
  sentenceOrder: string[];
  modelShuffles: { sentenceId: string; modelOrder: string[] }[];
} {
  // Shuffle sentence order
  const sentenceOrder = shuffleArray(sentenceIds, sessionId);
  
  // Shuffle models for each sentence (use sentenceId as additional entropy)
  const modelShuffles = sentenceOrder.map((sentenceId) => ({
    sentenceId,
    modelOrder: shuffleArray(models, `${sessionId}-${sentenceId}`)
  }));
  
  return { sentenceOrder, modelShuffles };
}
