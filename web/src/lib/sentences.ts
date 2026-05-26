import type { Sentence } from '../types/survey';

/**
 * Fetch and parse sentences from CSV file
 * Expected format: id|text (pipe-separated)
 */
export async function loadSentences(): Promise<Sentence[]> {
  try {
    // Use import.meta.env.BASE_URL to respect the base path
    const url = `${import.meta.env.BASE_URL}sentences.csv`;
    console.log('Fetching sentences from:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch sentences: ${response.statusText}`);
    }
    
    const text = await response.text();
    const lines = text.trim().split('\n');
    
    const sentences: Sentence[] = lines.map((line, index) => {
      const [id, ...textParts] = line.split('|');
      const text = textParts.join('|'); // Rejoin in case text contains pipes
      
      if (!id || !text) {
        throw new Error(`Invalid sentence format at line ${index + 1}: ${line}`);
      }
      
      return { id: id.trim(), text: text.trim() };
    });
    
    const limitRaw = import.meta.env.VITE_SENTENCE_LIMIT;
    const limit = limitRaw ? Number(limitRaw) : undefined;
    const limitedSentences =
      Number.isFinite(limit) && limit && limit > 0
        ? sentences.slice(0, limit)
        : sentences;

    console.log(`Successfully loaded ${limitedSentences.length} sentences`);
    return limitedSentences;
  } catch (error) {
    console.error('Error loading sentences:', error);
    throw error;
  }
}

/**
 * Get available TTS models - mapped to actual audio folder names
 */
export const TTS_MODELS = [
  'styletts2',
  'roboshaul'
] as const;
export type TtsModel = typeof TTS_MODELS[number];
