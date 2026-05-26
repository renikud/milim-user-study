import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { LocalStorageData } from '@/types/survey';

// Mock localStorage to ensure test isolation
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Persistence Logic (Data Recovery)', () => {
  const mockData: LocalStorageData = {
    userData: {
      name: 'Test',
      email: 'test@example.com',
      isNativeSpeaker: true,
      sessionId: 'session-123',
      sentenceOrder: ['s1', 's2'],
    },
    surveyState: {
      currentSentenceIndex: 1,
      ratings: [],
      modelShuffles: [],
      isComplete: false,
      submittedSentences: [],
      audioPlayStatus: {},
    },
    lastUpdated: '2024-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('saves data with the correct session key', () => {
    const { result } = renderHook(() => useLocalStorage('session-123'));
    
    result.current.saveToStorage(mockData);
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'phonikud-survey-session-123',
      expect.stringContaining('"sessionId":"session-123"')
    );
  });

  it('loads data correctly (round-trip)', () => {
    const { result } = renderHook(() => useLocalStorage('session-123'));
    
    result.current.saveToStorage(mockData);
    const loaded = result.current.loadFromStorage();
    
    expect(loaded).toMatchObject({
      userData: mockData.userData,
      surveyState: mockData.surveyState
    });
  });

  it('handles corrupted data gracefully (prevents crash)', () => {
    // Suppress expected console error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useLocalStorage('session-corrupt'));
    
    // Manually inject garbage into localStorage
    localStorageMock.setItem('phonikud-survey-session-corrupt', '{ invalid json ...');
    
    // Should return null and log error (which we suppressed), NOT throw
    const loaded = result.current.loadFromStorage();
    expect(loaded).toBeNull();
    
    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error loading from localStorage:', 
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('isolates data between sessions', () => {
    const sessionA = renderHook(() => useLocalStorage('user-A'));
    const sessionB = renderHook(() => useLocalStorage('user-B'));
    
    sessionA.result.current.saveToStorage({ ...mockData, userData: { ...mockData.userData, name: 'Alice' } });
    sessionB.result.current.saveToStorage({ ...mockData, userData: { ...mockData.userData, name: 'Bob' } });
    
    const loadedA = sessionA.result.current.loadFromStorage();
    const loadedB = sessionB.result.current.loadFromStorage();
    
    expect(loadedA?.userData.name).toBe('Alice');
    expect(loadedB?.userData.name).toBe('Bob');
  });
});
