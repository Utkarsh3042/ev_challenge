'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormState } from '@/lib/types';
import { EMPTY_FORM_STATE, loadFormState, saveFormState } from '@/lib/form-state';

const SAVE_INTERVAL_MS = 5000;

export interface UseFormStateReturn {
  state: FormState;
  update: <K extends keyof FormState>(section: K, patch: Partial<FormState[K]>) => void;
  setAll: (next: FormState) => void;
  reset: () => void;
  isDirty: boolean;
  hasSavedBefore: boolean;
}

/**
 * Manages the multi-section form state with localStorage persistence.
 * - On mount: tries to restore a saved state (returning hasSavedBefore).
 * - On every change: marks dirty + schedules a debounced save.
 * - On unmount or successful submit: caller should call reset() (which also
 *   clears localStorage).
 */
export function useFormState(): UseFormStateReturn {
  const [state, setState] = useState<FormState>(EMPTY_FORM_STATE);
  const [isDirty, setIsDirty] = useState(false);
  const [hasSavedBefore, setHasSavedBefore] = useState(false);
  const initialLoaded = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial load — runs once on mount
  useEffect(() => {
    if (initialLoaded.current) return;
    initialLoaded.current = true;
    const saved = loadFormState();
    if (saved) {
      setState(saved);
      setHasSavedBefore(true);
    }
  }, []);

  // Debounced auto-save
  useEffect(() => {
    if (!isDirty) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveFormState(state);
    }, SAVE_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state, isDirty]);

  const update = useCallback<UseFormStateReturn['update']>((section, patch) => {
    setState((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...patch },
    }));
    setIsDirty(true);
  }, []);

  const setAll = useCallback((next: FormState) => {
    setState(next);
    setIsDirty(true);
  }, []);

  const reset = useCallback(() => {
    setState(EMPTY_FORM_STATE);
    setIsDirty(false);
    setHasSavedBefore(false);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem('roadwarrior:form-state:v1');
      } catch {
        /* noop */
      }
    }
  }, []);

  return { state, update, setAll, reset, isDirty, hasSavedBefore };
}
