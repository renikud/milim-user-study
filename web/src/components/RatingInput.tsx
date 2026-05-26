import { Label } from './ui/label';
import { cn } from '../lib/utils';

interface RatingInputProps {
  naturalness?: number;
  accuracy?: number;
  onNaturalnessChange: (value: number) => void;
  onAccuracyChange: (value: number) => void;
  className?: string;
}

const CMOS_OPTIONS = [
  { value: 3,  label: 'A הרבה יותר', short: 'A++' },
  { value: 2,  label: 'A יותר',      short: 'A+' },
  { value: 1,  label: 'A קצת יותר',  short: 'A' },
  { value: 0,  label: 'דומה',        short: '=' },
  { value: -1, label: 'B קצת יותר',  short: 'B' },
  { value: -2, label: 'B יותר',      short: 'B+' },
  { value: -3, label: 'B הרבה יותר', short: 'B++' },
] as const;

function CmosScale({
  name,
  title,
  value,
  onChange
}: {
  name: string;
  title: string;
  value?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold block text-center">{title}</Label>

      {/* End labels */}
      <div className="flex justify-between items-center px-1">
        <span className="text-xs text-muted-foreground">A הרבה יותר</span>
        <span className="text-xs text-muted-foreground">B הרבה יותר</span>
      </div>

      {/* Radio row */}
      <div className="flex justify-between items-start">
        {CMOS_OPTIONS.map(option => (
          <label
            key={option.value}
            className="flex flex-col items-center gap-1.5 cursor-pointer group flex-1"
          >
            <span
              className={cn(
                "flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 transition-colors",
                value === option.value
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 text-slate-500 group-hover:border-slate-500"
              )}
            >
              <span className="text-xs sm:text-sm font-medium">{option.short}</span>
            </span>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span className={cn(
              "text-[10px] sm:text-xs leading-tight text-center max-w-[50px] sm:max-w-[70px]",
              value === option.value ? "text-slate-900 font-medium" : "text-muted-foreground"
            )}>
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function RatingInput({
  naturalness,
  accuracy,
  onNaturalnessChange,
  onAccuracyChange,
  className
}: RatingInputProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-10", className)}>
      <CmosScale
        name="naturalness"
        title="איזו דגימה נשמעת יותר כמו עברית מדוברת יומיומית?"
        value={naturalness}
        onChange={onNaturalnessChange}
      />
      <CmosScale
        name="accuracy"
        title="איזו דגימה נשמעת פחות רשמית או מוקראת?"
        value={accuracy}
        onChange={onAccuracyChange}
      />
    </div>
  );
}
