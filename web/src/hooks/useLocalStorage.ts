import { useEffect } from 'react';
import type { LocalStorageData } from '../types/survey';

const STORAGE_PREFIX = 'phonikud-survey-';

/**
 * Hook for persisting and restoring survey state to/from localStorage
 */
export function useLocalStorage(sessionId: string | null) {
  const storageKey = sessionId ? `${STORAGE_PREFIX}${sessionId}` : null;

  // Load data from localStorage
  const loadFromStorage = (): LocalStorageData | null => {
    if (!storageKey) return null;
    
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved) as LocalStorageData;
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
    return null;
  };

  // Save data to localStorage
  const saveToStorage = (data: LocalStorageData) => {
    if (!storageKey) return;
    
    try {
      const dataWithTimestamp = {
        ...data,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(storageKey, JSON.stringify(dataWithTimestamp));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  // Clear data from localStorage
  const clearStorage = () => {
    if (!storageKey) return;
    
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  };

  return {
    loadFromStorage,
    saveToStorage,
    clearStorage
  };
}

/**
 * Debounced auto-save hook
 */
export function useAutoSave<T>(
  value: T,
  save: (value: T) => void,
  delay: number = 500
) {
  useEffect(() => {
    const handler = setTimeout(() => {
      save(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, save, delay]);
}
