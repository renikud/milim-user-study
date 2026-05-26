import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { CheckCircle, MessageSquare } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useSurvey } from '../contexts/SurveyContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { submitComments } from '../lib/firebase';

export default function ThankYou() {
  const { userData, clearUserData, setUserData } = useUser();
  const { resetSurvey } = useSurvey();
  const { clearStorage } = useLocalStorage(userData?.sessionId || null);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmittedComments, setHasSubmittedComments] = useState(false);

  useEffect(() => {
    // Don't clear localStorage immediately - wait for potential comments
  }, []);

  const handleSubmitComments = async () => {
    if (!userData) return;
    
    setIsSubmitting(true);
    try {
      // Submit comments to Firebase
      await submitComments({
        name: userData.name,
        email: userData.email,
        comments: comments.trim(),
        sessionId: userData.sessionId
      });
      
      // Update userData with comments
      const updatedUserData = { ...userData, comments };
      setUserData(updatedUserData);
      
      setHasSubmittedComments(true);
    } catch (error) {
      console.error('Error submitting comments:', error);
      alert('שגיאה בשמירת ההערות. נא לנסות שוב.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewSession = () => {
    if (userData?.sessionId) {
      clearStorage();
    }
    clearUserData();
    resetSurvey();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-center text-3xl" dir="rtl">
            תודה רבה על השתתפותך! 🎉
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center text-lg space-y-4" dir="rtl">
            <p>
              התשובות שלך נשמרו בהצלחה ויסייעו לנו לשפר את איכות הפקת הדיבור בעברית.
            </p>
            <p className="text-slate-600">
              התוצאות יפורסמו בסיום המחקר.
            </p>
          </div>

          {/* Back to Home Button */}
          <div className="flex justify-center pt-2">
            <Link to="/" onClick={handleNewSession}>
              <Button variant="outline" size="lg">חזור לדף הבית</Button>
            </Link>
          </div>

          {/* Optional Comments Section */}
          {!hasSubmittedComments && (
            <div className="space-y-3 pt-6 border-t border-slate-200">
              <div className="text-center space-y-1" dir="rtl">
                <Label htmlFor="comments" className="text-base font-semibold">
                  רוצים לשתף אותנו במשהו? (אופציונלי)
                </Label>
              </div>
              <textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="כל משוב, הערה או הצעה לשיפור יתקבלו בברכה..."
                className="w-full min-h-[100px] p-3 border rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                dir="rtl"
              />
              <Button
                onClick={handleSubmitComments}
                disabled={isSubmitting || !comments.trim()}
                variant="secondary"
                className="w-full"
              >
                {isSubmitting ? (
                  'שולח...'
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4" />
                    שלח הערות
                  </>
                )}
              </Button>
            </div>
          )}

          {hasSubmittedComments && (
            <div className="text-center text-green-600 font-medium pt-6 border-t border-slate-200" dir="rtl">
              <span className="inline-flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                תודה על המשוב! 💚
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
