import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useUser } from '../contexts/UserContext';
import { useSurvey } from '../contexts/SurveyContext';
import { useSurveyProgress } from '../hooks/useSurveyProgress';
import { useLocalStorage, useAutoSave } from '../hooks/useLocalStorage';
import { useSingleAudioPlayer } from '../hooks/useSingleAudioPlayer';
import { loadSentences } from '../lib/sentences';
import { submitBatch } from '../lib/firebase';
import type { Sentence } from '../types/survey';
import { Progress } from '../components/ui/progress';
import { Button } from '../components/ui/button';
import { AudioPlayer } from '../components/AudioPlayer';
import { RatingInput } from '../components/RatingInput';
import { Info, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Evaluation() {
  const navigate = useNavigate();
  const { userData } = useUser();
  const {
    surveyState,
    setCurrentSentenceIndex,
    updateRating,
    getRating,
    markSentenceAsSubmitted,
    markAudioAsPlayed,
    hasPlayedBothAudios,
    completeSurvey
  } = useSurvey();
  const { saveToStorage } = useLocalStorage(userData?.sessionId || null);
  const { registerAudio } = useSingleAudioPlayer();

  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load sentences on mount
  useEffect(() => {
    loadSentences()
      .then(setSentences)
      .catch(error => {
        console.error('Error loading sentences:', error);
        alert('שגיאה בטעינת המשפטים');
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Auto-save to localStorage on state change
  useAutoSave(
    { userData, surveyState },
    (data) => {
      if (data.userData) {
        saveToStorage({
          userData: data.userData,
          surveyState: data.surveyState,
          lastUpdated: new Date().toISOString()
        });
      }
    },
    500
  );

  // Warn before leaving if survey not complete
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (surveyState.isComplete) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [surveyState.isComplete]);

  const {
    progressPercentage,
    canGoPrevious,
    isLastSentence,
    currentSentenceId
  } = useSurveyProgress(
    surveyState.currentSentenceIndex,
    userData?.sentenceOrder.length || 0,
    surveyState.ratings,
    userData?.sentenceOrder || []
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl" dir="rtl">טוען משפטים...</div>
      </div>
    );
  }

  if (!userData || !sentences.length) {
    navigate('/');
    return null;
  }

  const currentSentenceData = sentences.find(s => s.id === currentSentenceId);
  const currentModelShuffle = surveyState.modelShuffles.find(
    m => m.sentenceId === currentSentenceId
  );

  const rating = getRating(currentSentenceId);
  const allRatingsComplete = rating?.naturalness != null && rating?.accuracy != null;
  const bothAudiosPlayed = hasPlayedBothAudios(currentSentenceId);
  const canProceed = allRatingsComplete && bothAudiosPlayed;

  if (!currentSentenceData || !currentModelShuffle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600" dir="rtl">שגיאה בטעינת נתונים</div>
      </div>
    );
  }

  const [modelA, modelB] = currentModelShuffle.modelOrder;

  const handleNext = async () => {
    if (!canProceed || !currentSentenceId || !rating || rating.naturalness == null || rating.accuracy == null) return;

    // Check if this sentence hasn't been submitted yet
    if (!surveyState.submittedSentences.includes(currentSentenceId)) {
      setIsSubmitting(true);

      try {
        await submitBatch([{
          name: userData.name,
          email: userData.email,
          sentence_id: currentSentenceId,
          model_a: modelA,
          model_b: modelB,
          naturalness_cmos: rating.naturalness,
          accuracy_cmos: rating.accuracy
        }]);

        markSentenceAsSubmitted(currentSentenceId);
        console.log(`Submitted ratings for sentence ${currentSentenceId}`);
      } catch (error) {
        console.error('Error submitting ratings:', error);
        alert('שגיאה בשמירת הנתונים. נא לנסות שוב.');
        setIsSubmitting(false);
        return;
      } finally {
        setIsSubmitting(false);
      }
    }

    // Navigate to next sentence or complete survey
    if (isLastSentence) {
      completeSurvey();
      navigate('/thank-you');
    } else {
      setCurrentSentenceIndex(surveyState.currentSentenceIndex + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevious = () => {
    if (!canGoPrevious) return;
    setCurrentSentenceIndex(surveyState.currentSentenceIndex - 1);
    window.scrollTo(0, 0);
  };

  const audioSrcA = `${import.meta.env.BASE_URL}audio/${modelA}/${currentSentenceId}.m4a`;
  const audioSrcB = `${import.meta.env.BASE_URL}audio/${modelB}/${currentSentenceId}.m4a`;

  return (
    <div className="min-h-screen bg-slate-50 py-8 pb-20 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium" dir="rtl">
              משפט {surveyState.currentSentenceIndex + 1} מתוך {userData.sentenceOrder.length}
            </span>
            <span className="text-sm text-slate-600">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="w-full" />
        </div>

        {/* Quick Instructions Reminder */}
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm" dir="rtl">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-slate-100 p-2 text-slate-700">
              <Info className="h-4 w-4" />
            </div>
            <div className="text-sm text-slate-700">
              <span className="font-semibold">הוראות:</span> השוו את ההקלטות לפי טבעיות ותאימות לטקסט בסולם 7 דרגות
            </div>
          </div>
        </div>

        {/* Sentence Text */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-500 text-center mb-1" dir="rtl">
            הטקסט שהוזן למערכת
          </div>
          <div className="text-lg font-medium text-center" dir="rtl">
            {currentSentenceData.text}
          </div>
        </div>

        {/* Audio Players */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
            <div className="text-lg font-bold text-center">A</div>
            <AudioPlayer
              key={`audio-${currentSentenceId}-A`}
              audioSrc={audioSrcA}
              label="A"
              onPlayed={() => markAudioAsPlayed(currentSentenceId, 'A')}
              onAudioRef={registerAudio}
              className="bg-transparent p-0 border-0 rounded-none shadow-none"
              showLabel={false}
            />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
            <div className="text-lg font-bold text-center">B</div>
            <AudioPlayer
              key={`audio-${currentSentenceId}-B`}
              audioSrc={audioSrcB}
              label="B"
              onPlayed={() => markAudioAsPlayed(currentSentenceId, 'B')}
              onAudioRef={registerAudio}
              className="bg-transparent p-0 border-0 rounded-none shadow-none"
              showLabel={false}
            />
          </div>
        </div>

        {/* Rating Input */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <RatingInput
            naturalness={rating?.naturalness}
            accuracy={rating?.accuracy}
            onNaturalnessChange={(v) => updateRating(currentSentenceId, { naturalness: v })}
            onAccuracyChange={(v) => updateRating(currentSentenceId, { accuracy: v })}
          />
          {!bothAudiosPlayed && (
            <div className="mt-3 text-sm text-amber-700 text-center" dir="rtl">
              כדי להמשיך, יש להפעיל לפחות פעם אחת את שתי הדגימות (A ו-B).
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={!canGoPrevious || isSubmitting}
          >
            <ChevronLeft className="h-4 w-4" />
            הקודם
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed || isSubmitting}
          >
            {isSubmitting ? (
              'שומר...'
            ) : isLastSentence ? (
              'סיים'
            ) : (
              <>
                הבא
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {/* Warning if not complete */}
        {!allRatingsComplete && (
          <div className="text-center text-sm text-amber-600" dir="rtl">
            נא לדרג את שתי הקטגוריות לפני המעבר למשפט הבא
          </div>
        )}
      </div>
    </div>
  );
}
