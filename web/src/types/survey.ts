export interface UserData {
  name: string;
  email: string;
  isNativeSpeaker: boolean;
  sessionId: string;
  sentenceOrder: string[]; // Shuffled sentence IDs
  comments?: string; // Optional feedback from user
}

export interface Rating {
  sentenceId: string;
  naturalness?: number; // CMOS: -3 to +3 (positive = A better)
  accuracy?: number;    // CMOS: -3 to +3 (positive = A better)
}

export interface ModelShuffle {
  sentenceId: string;
  modelOrder: string[]; // Shuffled model names for this sentence
}

export interface SurveyState {
  currentSentenceIndex: number;
  ratings: Rating[]; // All ratings collected so far
  modelShuffles: ModelShuffle[]; // Per-sentence model orders
  isComplete: boolean;
  submittedSentences: string[]; // IDs of sentences already submitted to Firebase
  audioPlayStatus: Record<string, { A: boolean; B: boolean }>; // Per-sentence playback state
}

export interface Sentence {
  id: string;
  text: string;
}

export interface LocalStorageData {
  userData: UserData;
  surveyState: SurveyState;
  lastUpdated: string; // ISO timestamp
}
