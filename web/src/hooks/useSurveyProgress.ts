import { useMemo } from 'react';
import type { Rating } from '../types/survey';
import { areSentenceRatingsComplete } from '../lib/validation';

export function useSurveyProgress(
  currentSentenceIndex: number,
  totalSentences: number,
  ratings: Rating[],
  sentenceOrder: string[]
) {
  const currentSentenceId = sentenceOrder[currentSentenceIndex];

  const isCurrentSentenceComplete = useMemo(() => {
    if (!currentSentenceId) return false;
    return areSentenceRatingsComplete(currentSentenceId, ratings);
  }, [currentSentenceId, ratings]);

  const progressPercentage = useMemo(() => {
    return Math.round((currentSentenceIndex / totalSentences) * 100);
  }, [currentSentenceIndex, totalSentences]);

  const canGoNext = isCurrentSentenceComplete;
  const canGoPrevious = currentSentenceIndex > 0;
  const isLastSentence = currentSentenceIndex === totalSentences - 1;

  return {
    isCurrentSentenceComplete,
    progressPercentage,
    canGoNext,
    canGoPrevious,
    isLastSentence,
    currentSentenceId
  };
}
