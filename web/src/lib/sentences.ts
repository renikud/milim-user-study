import type { Sentence } from '../types/survey';

/**
 * Fetch and parse ReNikud study items from TSV file.
 * Expected format:
 * id, source_row, category, text, target_index, informal_ipa, formal_ipa, subcategory
 */
export async function loadSentences(): Promise<Sentence[]> {
  try {
    const url = `${import.meta.env.BASE_URL}renikud_items.tsv`;
    console.log('Fetching sentences from:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch sentences: ${response.statusText}`);
    }
    
    const text = await response.text();
    const lines = text.trim().split(/\r?\n/);
    const [header, ...dataLines] = lines;
    const columns = header.split('\t');
    
    const sentences: Sentence[] = dataLines.map((line, index) => {
      const values = line.split('\t');
      const row = Object.fromEntries(columns.map((column, i) => [column, values[i] ?? '']));
      const id = row.id?.trim();
      const itemText = row.text?.trim();
      const targetIndex = Number(row.target_index);
      
      if (!id || !itemText || !Number.isInteger(targetIndex)) {
        throw new Error(`Invalid sentence format at line ${index + 1}: ${line}`);
      }
      
      return {
        id,
        text: itemText,
        sourceRow: Number(row.source_row),
        category: row.category?.trim(),
        targetIndex,
        informalIpa: row.informal_ipa?.trim(),
        formalIpa: row.formal_ipa?.trim(),
        subcategory: row.subcategory?.trim()
      };
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
  'informal',
  'formal'
] as const;
export type TtsModel = typeof TTS_MODELS[number];
