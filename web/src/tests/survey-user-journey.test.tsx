import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
vi.mock('@/lib/sentences', () => ({
  loadSentences: vi.fn().mockResolvedValue([
    { id: 's1', text: 'Sentence One' },
    { id: 's2', text: 'Sentence Two' }
  ]),
  TTS_MODELS: ['m1', 'm2'],
}));

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
    vi.clearAllMocks();
  });

  it('completes the entire survey flow with CMOS ratings', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
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

    // 1. Welcome Screen
    await screen.findByText(/ברוכים הבאים/i);

    // Fill User Info
    fireEvent.change(screen.getByLabelText(/שם/i), { target: { value: 'Random Tester' } });
    fireEvent.change(screen.getByLabelText(/אימייל/i), { target: { value: 'random@test.com' } });
    const yesRadio = screen.getByLabelText('כן');
    fireEvent.click(yesRadio);

    // Click Start
    fireEvent.click(screen.getByRole('button', { name: /התחל/i }));

    // 2. Instructions Screen
    await screen.findByText(/הוראות למחקר/i);
    
    // Check the "I have read" checkbox
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    // Click Continue to Evaluation
    const continueBtn = screen.getByRole('button', { name: /המשך להערכה/i });
    await waitFor(() => expect(continueBtn).toBeEnabled());
    fireEvent.click(continueBtn);

    // 3. Evaluation Loop
    for (let i = 0; i < MOCK_SENTENCES.length; i++) {
      // Wait for sentence text to appear
      await screen.findByText(/Sentence (One|Two)/);

      // Play both audio samples (A and B)
      const playButtons = screen.getAllByRole('button', { name: /הפעל/ });
      fireEvent.click(playButtons[0]);
      fireEvent.click(playButtons[1]);

      // Click a CMOS option for naturalness (first "דומה") and accuracy (second "דומה")
      const similarOptions = screen.getAllByRole('radio', { name: /דומה/ });
      fireEvent.click(similarOptions[0]); // naturalness: 0
      fireEvent.click(similarOptions[1]); // accuracy: 0

      // Click Next / Finish
      const nextBtn = screen.getByRole('button', { name: /הבא|סיים/i });
      await waitFor(() => expect(nextBtn).toBeEnabled());
      fireEvent.click(nextBtn);

      if (i === MOCK_SENTENCES.length - 1) {
        await waitFor(() => expect(vi.mocked(submitBatch)).toHaveBeenCalled());
      }
    }

    // 4. Verify Submission
    const calls = vi.mocked(submitBatch).mock.calls;
    expect(calls).toHaveLength(MOCK_SENTENCES.length);

    const allSubmissions = calls.flatMap(call => call[0] as Submission[]);
    expect(allSubmissions).toHaveLength(MOCK_SENTENCES.length);

    // Verify submission structure
    expect(allSubmissions[0]).toMatchObject({
      name: 'Random Tester',
      email: 'random@test.com',
      sentence_id: expect.stringMatching(/s[1-2]/),
      model_a: expect.any(String),
      model_b: expect.any(String),
      naturalness_cmos: 0,
      accuracy_cmos: 0,
    });

    // 5. Verify Thank You Page
    await screen.findByText(/תודה רבה על השתתפותך/i);
  });
});
