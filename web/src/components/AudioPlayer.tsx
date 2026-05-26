import { useRef, useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Play, Pause } from 'lucide-react';
import { cn } from '../lib/utils';

interface AudioPlayerProps {
  audioSrc: string;
  label: string; // "A", "B", "C", or "D"
  onPlayed?: () => void; // Callback when audio has been played
  onAudioRef?: (audio: HTMLAudioElement | null) => void; // Callback to register audio element
  className?: string;
  showLabel?: boolean;
}

export function AudioPlayer({
  audioSrc,
  label,
  onPlayed,
  onAudioRef,
  className,
  showLabel = true
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasPlayed, setHasPlayed] = useState(false);

  // Register audio element with parent
  useEffect(() => {
    if (onAudioRef && audioRef.current) {
      onAudioRef(audioRef.current);
      return () => onAudioRef(null);
    }
  }, [onAudioRef]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (!hasPlayed && onPlayed) {
        setHasPlayed(true);
        onPlayed();
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      if (!hasPlayed && onPlayed) {
        setHasPlayed(true);
        onPlayed();
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [hasPlayed, onPlayed]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      if (!hasPlayed && onPlayed) {
        setHasPlayed(true);
        onPlayed();
      }
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number): string => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn("flex flex-col gap-2 p-4 border rounded-lg bg-slate-50", className)}>
      <audio ref={audioRef} src={audioSrc} preload="metadata" />
      
      <div className="flex items-center gap-3">
        {showLabel && (
          <div className="text-2xl font-bold text-slate-700 min-w-[2rem] text-center">
            {label}
          </div>
        )}
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={togglePlayPause}
          className="min-w-[80px]"
        >
          {isPlaying ? (
            <>
              <Pause className="h-4 w-4" />
              <span>עצור</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              <span>הפעל</span>
            </>
          )}
        </Button>

        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-900 transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          <div className="text-xs text-slate-500 tabular-nums whitespace-nowrap">
            {formatTime(currentTime)}/{formatTime(duration)}
          </div>
        </div>
      </div>
    </div>
  );
}
