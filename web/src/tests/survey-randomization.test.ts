import { describe, expect, it } from 'vitest';
import type { Sentence } from '@/types/survey';
import { filterSentencesForGroup, parseStudyGroup } from '@/lib/sentences';
import { generateShuffles, shuffleArray } from '@/lib/shuffle';

describe('Shuffle Logic (Research Integrity)', () => {
  const models = ['modelA', 'modelB', 'modelC', 'modelD'];
  const sentences = ['s1', 's2', 's3', 's4', 's5'];

  describe('shuffleArray', () => {
    it('is deterministic (same seed = same order)', () => {
      const seed = 'test-seed-123';
      const result1 = shuffleArray(models, seed);
      const result2 = shuffleArray(models, seed);
      
      expect(result1).toEqual(result2);
    });

    it('varies with different seeds', () => {
      const result1 = shuffleArray(models, 'seed-a');
      const result2 = shuffleArray(models, 'seed-b');
      
      // Note: It is statistically possible but extremely unlikely to be equal
      // for 4! (24) permutations. If this flakes, the RNG is very poor or we got unlucky.
      expect(result1).not.toEqual(result2);
    });

    it('preserves all elements (no data loss)', () => {
      const result = shuffleArray(models, 'some-seed');
      expect(result).toHaveLength(models.length);
      expect(result.sort()).toEqual([...models].sort());
    });
  });

  describe('generateShuffles', () => {
    it('generates distinct model orders for different sentences', () => {
      const sessionId = 'user-session-1';
      const { modelShuffles } = generateShuffles(sessionId, sentences, models);

      // Check that we don't just repeat the same model order for every sentence
      // (which would introduce positional bias)
      const orders = modelShuffles.map(s => s.modelOrder.join(','));
      const uniqueOrders = new Set(orders);
      
      // With 5 sentences and 24 permutations, we expect at least some variation
      expect(uniqueOrders.size).toBeGreaterThan(1);
    });

    it('ensures every sentence has a corresponding model shuffle', () => {
      const { sentenceOrder, modelShuffles } = generateShuffles('session', sentences, models);
      
      expect(sentenceOrder).toHaveLength(sentences.length);
      expect(modelShuffles).toHaveLength(sentences.length);
      
      sentenceOrder.forEach(sId => {
        const shuffle = modelShuffles.find(ms => ms.sentenceId === sId);
        expect(shuffle).toBeDefined();
        expect(shuffle?.modelOrder).toHaveLength(models.length);
      });
    });
  });

  describe('study groups', () => {
    const studySentences = Array.from({ length: 150 }, (_, index): Sentence => ({
      id: String(index + 1).padStart(3, '0'),
      text: `Sentence ${index + 1}`,
    }));

    it('accepts A/B/C groups from links', () => {
      expect(parseStudyGroup('A')).toBe('A');
      expect(parseStudyGroup('b')).toBe('B');
      expect(parseStudyGroup('C')).toBe('C');
      expect(parseStudyGroup(null)).toBeNull();
      expect(parseStudyGroup('D')).toBeNull();
    });

    it('assigns 50 unique items to each group and covers all 150', () => {
      const groupA = filterSentencesForGroup(studySentences, 'A');
      const groupB = filterSentencesForGroup(studySentences, 'B');
      const groupC = filterSentencesForGroup(studySentences, 'C');

      expect(groupA).toHaveLength(50);
      expect(groupB).toHaveLength(50);
      expect(groupC).toHaveLength(50);
      expect(groupA[0].id).toBe('001');
      expect(groupA[49].id).toBe('050');
      expect(groupB[0].id).toBe('051');
      expect(groupB[49].id).toBe('100');
      expect(groupC[0].id).toBe('101');
      expect(groupC[49].id).toBe('150');

      const assignedIds = [...groupA, ...groupB, ...groupC].map(s => s.id);
      expect(new Set(assignedIds).size).toBe(150);
    });
  });
});
