import type { Sentence } from '../types/survey';

export const DATASET_PATH = 'colloquial_formal_informal_renikud_study_150';
export const STUDY_GROUPS = ['A', 'B', 'C'] as const;
export type StudyGroup = typeof STUDY_GROUPS[number];

const GROUP_SIZE = 50;

export function parseStudyGroup(value: string | null): StudyGroup | null {
  const group = value?.trim().toUpperCase();
  return STUDY_GROUPS.includes(group as StudyGroup) ? group as StudyGroup : null;
}

export function filterSentencesForGroup(sentences: Sentence[], group: StudyGroup): Sentence[] {
  const groupIndex = STUDY_GROUPS.indexOf(group);
  const start = groupIndex * GROUP_SIZE;
  return sentences.slice(start, start + GROUP_SIZE);
}

/**
 * Fetch and parse ReNikud study items from the reviewed dataset metadata.
 * Expected format:
 * id|index|graphemes|formal_wav|informal_wav|formal_ipa|informal_ipa|...
 */
export async function loadSentences(): Promise<Sentence[]> {
  try {
    const url = `${import.meta.env.BASE_URL}${DATASET_PATH}/metadata.csv`;
    console.log('Fetching sentences from:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch sentences: ${response.statusText}`);
    }
    
    const text = await response.text();
    const lines = text.trim().split(/\r?\n/);
    const [header, ...dataLines] = lines;
    const columns = header.split('|');
    
    const sentences: Sentence[] = dataLines.map((line, index) => {
      const values = line.split('|');
      const row = Object.fromEntries(columns.map((column, i) => [column, values[i] ?? '']));
      const id = row.id?.trim();
      const itemText = row.graphemes?.trim();
      const targetIndex = Number(row.index);
      const formalWav = row.formal_wav?.trim();
      const informalWav = row.informal_wav?.trim();
      
      if (!id || !itemText || !Number.isInteger(targetIndex) || !formalWav || !informalWav) {
        throw new Error(`Invalid sentence format at line ${index + 1}: ${line}`);
      }
      
      return {
        id,
        text: itemText,
        targetIndex,
        informalIpa: row.informal_ipa?.trim(),
        formalIpa: row.formal_ipa?.trim(),
        informalWav,
        formalWav
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
