import { Card, CardContent } from './ui/card';
import { cn } from '../lib/utils';

interface SentenceCardProps {
  text: string;
  className?: string;
}

export function SentenceCard({ text, className }: SentenceCardProps) {
  return (
    <Card className={cn("bg-gradient-to-br from-slate-50 to-slate-100", className)}>
      <CardContent className="p-8">
        <p 
          dir="rtl" 
          className="text-2xl leading-relaxed text-center text-slate-900 font-medium"
        >
          {text}
        </p>
      </CardContent>
    </Card>
  );
}
