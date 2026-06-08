/** localStorage persistence for the multi-section form. */

import type { FormState } from './types';
import { FORM_STATE_TTL_MS } from './constants';

const KEY = 'roadwarrior:form-state:v1';

interface Stored {
  state: FormState;
  savedAt: number; // epoch ms
}

/** Returns the saved state, or null if absent / older than 24h / malformed. */
export function loadFormState(): FormState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (!parsed || typeof parsed.savedAt !== 'number' || !parsed.state) return null;
    if (Date.now() - parsed.savedAt > FORM_STATE_TTL_MS) {
      window.localStorage.removeItem(KEY);
      return null;
    }
    return parsed.state;
  } catch {
    return null;
  }
}

export function saveFormState(state: FormState): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: Stored = { state, savedAt: Date.now() };
    window.localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // Quota exceeded or storage unavailable — silently fail.
  }
}

export function clearFormState(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

/** Default empty form state — exported so the hook doesn't need to redefine it. */
export const EMPTY_FORM_STATE: FormState = {
  sectionA: {
    full_name: '',
    phone: '',
    pin_code: '',
    city: '',
    platform: '',
    platforms: [],
    years_experience: '',
    preferred_language: '',
  },
  sectionB: {
    vehicle_type: '',
    vehicle_brand_model: '',
    fuel_method: '',
    weekly_expense: '',
    monthly_maintenance: '',
  },
  sectionC: {
    top_challenges: [],
    ev_challenges: [],
    petrol_challenges: [],
    other_challenge: '',
  },
  sectionD: {
    has_accident_insurance: '',
    has_health_insurance: '',
    paid_out_of_pocket: null,
  },
  sectionE: {
    open_to_switch: '',
    switch_motivators: [],
    interested_in: [],
  },
  sectionF: {
    referred: null,
    referral_code: '',
  },
};
