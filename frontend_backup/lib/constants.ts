/**
 * Static option lists. Mirrors backend `app/api/meta.py`.
 * If backend exposes new values, update here too.
 */

import type {
  City,
  FuelMethod,
  InsuranceAnswer,
  Locale,
  Platform,
  SwitchIntent,
  VehicleType,
} from './types';

export const CITIES: City[] = [
  'Bangalore',
  'Mumbai',
  'Delhi',
  'Hyderabad',
  'Chennai',
  'Pune',
  'Other',
];

export const PLATFORMS: Platform[] = [
  'swiggy',
  'zomato',
  'blinkit',
  'porter',
  'dunzo',
  'rapido',
  'other',
];

export const VEHICLE_TYPES: VehicleType[] = ['petrol', 'diesel', 'electric', 'other'];

export const FUEL_METHODS: FuelMethod[] = [
  'petrol_pump',
  'home_charging',
  'battery_swap',
  'other',
];

export const LOCALES: Locale[] = ['en', 'hi', 'kn'];

export const SWITCH_INTENTS: SwitchIntent[] = ['yes', 'no', 'already_ev', 'need_info'];

export const INSURANCE_ANSWERS: InsuranceAnswer[] = ['yes', 'no', 'not_sure'];

/** Backend uses snake_case — keep these as-is. */
export const TOP_CHALLENGES = [
  'high_fuel_cost',
  'maintenance',
  'range_anxiety',
  'charging_time',
  'breakdown_fear',
  'earnings_too_low',
  'no_insurance',
  'health_issues',
  'accident_risk',
  'long_hours',
  'weather',
  'pollution',
];

export const EV_CHALLENGES = [
  'high_upfront_cost',
  'no_charging_nearby',
  'range_anxiety',
  'battery_replacement_cost',
  'long_charging_time',
  'unknown_brand',
  'resale_value',
  'service_centers_far',
];

export const PETROL_CHALLENGES = [
  'fuel_price_volatility',
  'high_fuel_cost',
  'engine_maintenance',
  'emissions_guilt',
  'petrol_pump_distance',
  'noisy_engine',
];

export const SWITCH_MOTIVATORS = [
  'save_money',
  'save_environment',
  'less_maintenance',
  'company_offers',
  'peer_pressure',
  'government_subsidy',
];

export const INTERESTED_IN = [
  'ev_purchase',
  'ev_rental',
  'battery_swap',
  'retrofit',
  'charging_setup',
  'subsidies',
  'financing',
  'insurance',
];

export const SEGMENT_TAGS = [
  'hot_ev_lead',
  'insurance_lead',
  'retrofit_lead',
  'accident_victim',
  'high_spender',
  'rental_lead',
  'swing_rider',
  'ev_rider',
  'petrol_rider',
  'diesel_rider',
  'veteran',
] as const;
export type SegmentTag = (typeof SEGMENT_TAGS)[number];

/** Backend `max_length=3` for top_challenges. */
export const MAX_TOP_CHALLENGES = 3;

/** Milestones — kept in sync with backend config. */
export const MILESTONES = [
  { target: 10, key: '10', bonus: 100, emoji: '🥉', label: 'Bronze' },
  { target: 25, key: '25', bonus: 300, emoji: '🥈', label: 'Silver' },
  { target: 50, key: '50', bonus: 500, emoji: '🥇', label: 'Gold' },
] as const;

/** How long (ms) to keep saved form state before considering it stale. */
export const FORM_STATE_TTL_MS = 24 * 60 * 60 * 1000;
