import { useState, useCallback, useRef, useEffect } from 'react';

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

interface UseHistoryOptions {
  sessionId?: string;
  maxHistory?: number;
}

export function useHistory<T>(initialState: T, options: UseHistoryOptions = {}) {
  const { sessionId, maxHistory = 50 } = options;
  
  // Initialize state
  const [state, setState] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: []
  });

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latestStateRef = useRef<HistoryState<T>>(state);

  // Keep ref in sync for the timeout callback
  useEffect(() => {
    latestStateRef.current = state;
  }, [state]);

  // Persistence Logic (Debounced)
  const persistHistory = useCallback((currentState: HistoryState<T>) => {
    if (!sessionId) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const payload = {
        sessionId,
        history: {
          past: currentState.past,
          future: currentState.future
          // We don't save 'present' here as it is usually saved as the current file content
          // But for a full restoration of the undo stack, we need past/future.
        }
      };

      fetch('/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }).catch(err => console.error('Failed to save history:', err));
    }, 1000); // 1s debounce
  }, [sessionId]);

  // Push new state
  const pushState = useCallback((nextState: T) => {
    setState(curr => {
      if (curr.present === nextState) return curr;

      const newPast = [...curr.past, curr.present];
      if (newPast.length > maxHistory) {
        newPast.shift(); // Remove oldest
      }

      const newState = {
        past: newPast,
        present: nextState,
        future: []
      };
      
      persistHistory(newState);
      return newState;
    });
  }, [maxHistory, persistHistory]);

  // Undo
  const undo = useCallback(() => {
    setState(curr => {
      if (curr.past.length === 0) return curr;

      const previous = curr.past[curr.past.length - 1];
      const newPast = curr.past.slice(0, curr.past.length - 1);

      const newState = {
        past: newPast,
        present: previous,
        future: [curr.present, ...curr.future]
      };

      persistHistory(newState);
      return newState;
    });
  }, [persistHistory]);

  // Redo
  const redo = useCallback(() => {
    setState(curr => {
      if (curr.future.length === 0) return curr;

      const next = curr.future[0];
      const newFuture = curr.future.slice(1);

      const newState = {
        past: [...curr.past, curr.present],
        present: next,
        future: newFuture
      };

      persistHistory(newState);
      return newState;
    });
  }, [persistHistory]);

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  // Load history on mount
  useEffect(() => {
    if (!sessionId) return;
    
    let isMounted = true;
    
    const fetchHistory = async () => {
        try {
            const res = await fetch(`/api/history?sessionId=${sessionId}`);
            if (!res.ok) return;
            
            const data = await res.json();
            if (data.history && isMounted) {
                 setState(curr => ({
                     ...curr,
                     past: Array.isArray(data.history.past) ? data.history.past : [],
                     future: Array.isArray(data.history.future) ? data.history.future : []
                 }));
            }
        } catch (e) {
            console.error("Failed to load history", e);
        }
    };

    fetchHistory();

    return () => { isMounted = false; };
  }, [sessionId]);

  return {
    state: state.present,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo
  };
}
