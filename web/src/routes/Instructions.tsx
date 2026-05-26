import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useUser } from '../contexts/UserContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Info } from 'lucide-react';

export default function Instructions() {
  const navigate = useNavigate();
  const { userData } = useUser();
  const [hasReadInstructions, setHasReadInstructions] = useState(false);

  if (!userData) {
    navigate('/');
    return null;
  }

  const handleContinue = () => {
    if (hasReadInstructions) {
      navigate('/evaluation');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-2xl w-full">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl" dir="rtl">
              הוראות למחקר
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0" dir="rtl">
            {/* Main Instructions */}
            <div className="bg-slate-50 border border-slate-300 rounded-lg p-3 sm:p-4 space-y-2 shadow-sm">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="mt-1 rounded-full bg-slate-200 p-1.5 sm:p-2 text-slate-500">
                  <Info className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="flex-1 space-y-2 text-slate-800">
                  <p className="text-sm sm:text-base leading-relaxed">
                    יוצג בפניך טקסט ושתי הקלטות של אותו משפט. מילה אחת בטקסט תודגש.
                    תתבקש.י להשוות בין שתי ההקלטות ולהעריך איזו מהן נשמעת יותר כמו עברית מדוברת יומיומית.
                  </p>

                  <div className="space-y-2 pr-2 sm:pr-4">
                    <div className="space-y-1">
                      <div className="font-bold text-sm sm:text-base text-slate-900">
                        • עברית מדוברת יומיומית
                      </div>
                      <p className="pr-3 sm:pr-6 text-sm sm:text-base leading-relaxed">
                        בחרו את הדגימה שנשמעת יותר כמו אדם שמדבר עברית רגילה ביום-יום.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="font-bold text-sm sm:text-base text-slate-900">
                        • לא דיבור רשמי או מוקרא
                      </div>
                      <p className="pr-3 sm:pr-6 text-sm sm:text-base leading-relaxed">
                        אם אחת הדגימות נשמעת כמו קריאה רשמית, תקנית מדי או פחות טבעית לשיחה רגילה, סמנו את הדגימה השנייה.
                        אם אין הבדל ברור, אפשר לסמן שהדגימות דומות.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reading Confirmation */}
            <div className="bg-slate-100 rounded-lg p-3 sm:p-6">
              <p className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">
                נא לקרוא את ההוראות בעיון ולסמן את התיבה למטה לפני המשך:
              </p>

              <div className="flex items-start gap-2 sm:gap-3 bg-white rounded-lg p-3 sm:p-4 border-2 border-slate-200 hover:border-slate-300 transition-colors">
                <Checkbox
                  id="instructions-read"
                  checked={hasReadInstructions}
                  onCheckedChange={(checked: boolean) => setHasReadInstructions(checked === true)}
                  className="mt-1"
                />
                <label
                  htmlFor="instructions-read"
                  className="flex-1 text-base font-medium cursor-pointer select-none leading-relaxed"
                >
                  קראתי והבנתי את ההוראות
                </label>
              </div>
            </div>

            {/* Continue Button */}
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={handleContinue}
                disabled={!hasReadInstructions}
                className="w-full"
              >
                המשך להערכה
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
