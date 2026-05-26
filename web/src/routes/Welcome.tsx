import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Button } from '../components/ui/button';
import { useUser } from '../contexts/UserContext';
import { useSurvey } from '../contexts/SurveyContext';
import { useShuffleLogic } from '../hooks/useShuffleLogic';
import { isValidEmail, isValidName } from '../lib/validation';
import { loadSentences, TTS_MODELS } from '../lib/sentences';

export default function Welcome() {
  const navigate = useNavigate();
  const { setUserData } = useUser();
  const { setModelShuffles } = useSurvey();
  const { generateUserShuffles } = useShuffleLogic();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isNativeSpeaker, setIsNativeSpeaker] = useState<string>('');
  const [showRejection, setShowRejection] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; speaker?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    const newErrors: { name?: string; email?: string; speaker?: string } = {};
    
    if (!isValidName(name)) {
      newErrors.name = 'נא להזין שם בן לפחות 2 תווים';
    }
    
    if (!isValidEmail(email)) {
      newErrors.email = 'נא להזין כתובת אימייל תקינה';
    }
    
    if (!isNativeSpeaker) {
      newErrors.speaker = 'נא לענות על השאלה';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Check if native speaker
    if (isNativeSpeaker === 'no') {
      setShowRejection(true);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Load sentences
      const sentences = await loadSentences();
      const sentenceIds = sentences.map(s => s.id);
      
      // Generate shuffles
      const { sessionId, sentenceOrder, modelShuffles } = generateUserShuffles(
        sentenceIds,
        [...TTS_MODELS]
      );
      
      // Save user data
      const userData = {
        name: name.trim(),
        email: email.trim(),
        isNativeSpeaker: true,
        sessionId,
        sentenceOrder
      };
      
      setUserData(userData);
      setModelShuffles(modelShuffles);
      
      // Save to localStorage
      const storageKey = `phonikud-survey-${sessionId}`;
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          userData,
          surveyState: {
            currentSentenceIndex: 0,
            ratings: [],
            modelShuffles,
            isComplete: false,
            submittedSentences: [],
            audioPlayStatus: {}
          },
          lastUpdated: new Date().toISOString()
        }));
      } catch (storageError) {
        console.error('Error saving to localStorage:', storageError);
      }
      
      // Navigate to instructions
      navigate('/instructions');
    } catch (error) {
      console.error('Error starting survey:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`אירעה שגיאה בטעינת המשפטים: ${errorMessage}\nנא לנסות שוב.`);
    } finally {
      setIsLoading(false);
    }
  };

  if (showRejection) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <CardTitle className="text-center" dir="rtl">תודה על העניין!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-lg" dir="rtl">
              מחקר זה מיועד לדוברי עברית שפת אם בלבד.
            </p>
            <div className="mt-6 text-center">
              <Button variant="outline" onClick={() => setShowRejection(false)}>
                חזור
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-center text-2xl" dir="rtl">
            ברוכים הבאים למחקר הערכת הפקת דיבור בעברית
          </CardTitle>
          <CardDescription className="text-center text-base mt-4" dir="rtl">
            במחקר זה תתבקשו להאזין ל-20 משפטים בעברית, כאשר כל משפט יוצג ב-2 גרסאות שונות של הפקת דיבור.
            עליכם לבחור את הגרסה המועדפת מבחינת טבעיות הדיבור ודיוק ההגייה.
            <br /><br />
            המחקר אורך כ-10 דקות.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" dir="rtl">שם</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="הזינו את שמכם"
                dir="rtl"
              />
              {errors.name && (
                <p className="text-sm text-red-600" dir="rtl">{errors.name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" dir="rtl">כתובת אימייל</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                dir="ltr"
              />
              {errors.email && (
                <p className="text-sm text-red-600" dir="rtl">{errors.email}</p>
              )}
            </div>
            
            <div className="space-y-3">
              <Label dir="rtl">האם אתה דובר עברית שפת אם?</Label>
              <RadioGroup value={isNativeSpeaker} onValueChange={setIsNativeSpeaker}>
                <div className="flex flex-row-reverse items-center gap-2">
                  <RadioGroupItem value="yes" id="yes" />
                  <Label htmlFor="yes" className="cursor-pointer" dir="rtl">כן</Label>
                </div>
                <div className="flex flex-row-reverse items-center gap-2">
                  <RadioGroupItem value="no" id="no" />
                  <Label htmlFor="no" className="cursor-pointer" dir="rtl">לא</Label>
                </div>
              </RadioGroup>
              {errors.speaker && (
                <p className="text-sm text-red-600" dir="rtl">{errors.speaker}</p>
              )}
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'טוען...' : 'התחל'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
