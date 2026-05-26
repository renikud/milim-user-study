import { useEffect, useRef } from 'react';

/**
 * Hook to ensure only one audio element plays at a time
 * Returns a ref to register audio elements
 */
export function useSingleAudioPlayer() {
  const audioRefs = useRef<Set<HTMLAudioElement>>(new Set());

  const registerAudio = (audioElement: HTMLAudioElement | null) => {
    if (audioElement) {
      audioRefs.current.add(audioElement);
      
      const handlePlay = () => {
        // Pause all other audio elements
        audioRefs.current.forEach((audio) => {
          if (audio !== audioElement && !audio.paused) {
            audio.pause();
          }
        });
      };

      audioElement.addEventListener('play', handlePlay);

      return () => {
        audioElement.removeEventListener('play', handlePlay);
        audioRefs.current.delete(audioElement);
      };
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    const registeredAudio = audioRefs.current;
    return () => {
      registeredAudio.forEach((audio) => {
        audio.pause();
      });
      registeredAudio.clear();
    };
  }, []);

  return { registerAudio };
}
