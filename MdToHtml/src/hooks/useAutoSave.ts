import { useState, useEffect, useRef } from 'react';

export function useAutoSave<T>(key: string, data: T, delay: number = 3000) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dataRef = useRef(data);

  // Keep ref updated to avoid effect re-triggering constantly if we were to use it in dependency
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    // Clear any existing timer
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsSaving(true);

    // Set new timer
    timeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(dataRef.current));
        setLastSaved(new Date());
        setIsSaving(false);
      } catch (error) {
        console.error('Auto-save failed:', error);
        setIsSaving(false);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, key, delay]);

  return { lastSaved, isSaving };
}

export function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.error('Load from storage failed:', error);
    return fallback;
  }
}
