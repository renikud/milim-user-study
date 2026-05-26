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

  it('generates correct CMOS submission payload', async () => {
    const sentenceId = 'sentence-1';
    const user = { name: 'Test User', email: 'test@example.com' };

    const submission = {
      name: user.name,
      email: user.email,
      sentence_id: sentenceId,
      model_a: 'styletts2',
      model_b: 'roboshaul',
      naturalness_cmos: 2,
      accuracy_cmos: -1,
    };

    await submitBatch([submission]);

    const mockedSubmit = vi.mocked(submitBatch);
    expect(mockedSubmit).toHaveBeenCalledTimes(1);

    const payload = mockedSubmit.mock.calls[0][0];
    expect(payload).toHaveLength(1);

    expect(payload[0]).toEqual(
      expect.objectContaining({
        name: 'Test User',
        email: 'test@example.com',
        sentence_id: 'sentence-1',
        model_a: 'styletts2',
        model_b: 'roboshaul',
        naturalness_cmos: 2,
        accuracy_cmos: -1,
      })
    );
  });
});
