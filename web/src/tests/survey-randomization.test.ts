import { describe, expect, it } from 'vitest';
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
});
