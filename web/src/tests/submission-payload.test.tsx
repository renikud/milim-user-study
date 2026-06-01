import { describe, expect, it, vi, beforeEach } from 'vitest';
import { submitBatch } from '@/lib/firebase';

// 1. Mock Firebase modules BEFORE any imports to prevent initialization side effects
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  addDoc: vi.fn(),
  getDocs: vi.fn(),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  })),
  doc: vi.fn(),
}));

// 2. Mock our own firebase lib to spy on submitBatch
vi.mock('@/lib/firebase', async () => {
  const actual = await vi.importActual<typeof import('@/lib/firebase')>('@/lib/firebase');
  return {
    ...actual,
    submitBatch: vi.fn().mockResolvedValue(undefined),
  };
});

describe('Evaluation Core Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates correct preference submission payload', async () => {
    const sentenceId = 'sentence-1';
    const user = { email: 'test@example.com' };

    const submission = {
      email: user.email,
      study_group: 'A',
      sentence_id: sentenceId,
      variant_a: 'informal',
      variant_b: 'formal',
      preference: 2,
    };

    await submitBatch([submission]);

    const mockedSubmit = vi.mocked(submitBatch);
    expect(mockedSubmit).toHaveBeenCalledTimes(1);

    const payload = mockedSubmit.mock.calls[0][0];
    expect(payload).toHaveLength(1);

    expect(Object.keys(payload[0]).sort()).toEqual([
      'email',
      'preference',
      'sentence_id',
      'study_group',
      'variant_a',
      'variant_b',
    ]);
    expect(payload[0]).toEqual({
      email: 'test@example.com',
      study_group: 'A',
      sentence_id: 'sentence-1',
      variant_a: 'informal',
      variant_b: 'formal',
      preference: 2,
    });
  });
});
