import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import Welcome from '@/routes/Welcome';
import Instructions from '@/routes/Instructions';
import Evaluation from '@/routes/Evaluation';
import ThankYou from '@/routes/ThankYou';
import { UserProvider } from '@/contexts/UserContext';
import { SurveyProvider } from '@/contexts/SurveyContext';
import { submitBatch } from '@/lib/firebase';
import type { Submission } from '@/lib/firebase';

// --- Mocks ---

// 1. Mock Firebase (prevent network calls)
vi.mock('firebase/app', () => ({ initializeApp: vi.fn() }));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(), collection: vi.fn(), addDoc: vi.fn(), getDocs: vi.fn(), doc: vi.fn(),
  writeBatch: vi.fn(() => ({ set: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) })),
}));
vi.mock('@/lib/firebase', async () => {
  const actual = await vi.importActual<typeof import('@/lib/firebase')>('@/lib/firebase');
  return { ...actual, submitBatch: vi.fn().mockResolvedValue(undefined) };
});

// 2. Mock Sentences (Load only 2 sentences for speed)
vi.mock('@/lib/sentences', async () => {
  const actual = await vi.importActual<typeof import('@/lib/sentences')>('@/lib/sentences');
  return {
    ...actual,
    filterSentencesForGroup: vi.fn((sentences) => sentences),
    loadSentences: vi.fn().mockResolvedValue([
      { id: 's1', text: 'Sentence One' },
      { id: 's2', text: 'Sentence Two' }
    ]),
  };
});

// Define constants for use in test assertions (must match mock above)
const MOCK_SENTENCES = [
  { id: 's1', text: 'Sentence One' },
  { id: 's2', text: 'Sentence Two' }
];

// 3. Mock Helpers (Stop timeouts/scrolls)
vi.mock('@/hooks/useLocalStorage', () => ({
  useLocalStorage: () => ({ saveToStorage: vi.fn(), loadFromStorage: vi.fn(() => null), clearStorage: vi.fn() }),
  useAutoSave: () => {},
}));
Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });

// --- Test ---

describe('Full Survey Flow Integration', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  async function startSurveyFromGroup(group: string, email = 'random@test.com') {
    window.history.pushState(null, '', `/?group=${group}`);

    render(
      <MemoryRouter initialEntries={[`/?group=${group}`]}>
        <UserProvider>
          <SurveyProvider>
            <Routes>
              <Route path="/" element={<Welcome />} />
              <Route path="/instructions" element={<Instructions />} />
              <Route path="/evaluation" element={<Evaluation />} />
              <Route path="/thank-you" element={<ThankYou />} />
            </Routes>
          </SurveyProvider>
        </UserProvider>
      </MemoryRouter>
    );

    await screen.findByText(/ברוכים הבאים/i);
    fireEvent.change(screen.getByLabelText(/שם/i), { target: { value: 'Random Tester' } });
    fireEvent.change(screen.getByLabelText(/אימייל/i), { target: { value: email } });
    fireEvent.click(screen.getByLabelText('כן'));
    fireEvent.click(screen.getByRole('button', { name: /התחל/i }));

    await screen.findByText(/הוראות למחקר/i);
    fireEvent.click(screen.getByRole('checkbox'));
    const continueBtn = screen.getByRole('button', { name: /המשך להערכה/i });
    await waitFor(() => expect(continueBtn).toBeEnabled());
    fireEvent.click(continueBtn);
  }

  async function submitCurrentSentence() {
    await screen.findByText(/Sentence (One|Two)/);
    const playButtons = screen.getAllByRole('button', { name: /הפעל/ });
    fireEvent.click(playButtons[0]);
    fireEvent.click(playButtons[1]);

    const similarOptions = screen.getAllByRole('radio', { name: /דומה/ });
    fireEvent.click(similarOptions[0]);

    const nextBtn = screen.getByRole('button', { name: /הבא|סיים/i });
    await waitFor(() => expect(nextBtn).toBeEnabled());
    fireEvent.click(nextBtn);
    await waitFor(() => expect(vi.mocked(submitBatch)).toHaveBeenCalled());
  }

  it('completes the entire survey flow with preference ratings', async () => {
    await startSurveyFromGroup('A');

    // 3. Evaluation Loop
    for (let i = 0; i < MOCK_SENTENCES.length; i++) {
      await submitCurrentSentence();
    }

    // 4. Verify Submission
    const calls = vi.mocked(submitBatch).mock.calls;
    expect(calls).toHaveLength(MOCK_SENTENCES.length);

    const allSubmissions = calls.flatMap(call => call[0] as Submission[]);
    expect(allSubmissions).toHaveLength(MOCK_SENTENCES.length);

    // Verify submission structure
    expect(Object.keys(allSubmissions[0]).sort()).toEqual([
      'email',
      'preference',
      'sentence_id',
      'study_group',
      'variant_a',
      'variant_b',
    ]);
    expect(allSubmissions[0]).toMatchObject({
      email: 'random@test.com',
      study_group: 'A',
      sentence_id: expect.stringMatching(/s[1-2]/),
      variant_a: expect.stringMatching(/formal|informal/),
      variant_b: expect.stringMatching(/formal|informal/),
      preference: 0,
    });

    // 5. Verify Thank You Page
    await screen.findByText(/תודה רבה על השתתפותך/i);
  });

  it.each([
    ['A', 'A'],
    ['A', 'B'],
    ['C', 'C'],
  ])('submits study group %s from ?group=%s after routing', async (expectedGroup, group) => {
    await startSurveyFromGroup(group, `${group.toLowerCase()}@test.com`);
    await submitCurrentSentence();

    const firstSubmission = vi.mocked(submitBatch).mock.calls[0][0][0] as Submission;
    expect(firstSubmission.study_group).toBe(expectedGroup);
    expect(new URL(window.location.href).searchParams.get('group')).toBe(expectedGroup);
  });
});
