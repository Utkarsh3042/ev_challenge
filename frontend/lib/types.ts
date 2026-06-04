/**
 * Shared TypeScript types — mirror the backend Pydantic schemas in
 * `backend/app/schemas/`. Keep field names in sync.
 */

export type Locale = 'en' | 'hi' | 'kn';
export type City =
  | 'Bangalore'
  | 'Mumbai'
  | 'Delhi'
  | 'Hyderabad'
  | 'Chennai'
  | 'Pune'
  | 'Other';
export type Platform =
  | 'swiggy'
  | 'zomato'
  | 'blinkit'
  | 'porter'
  | 'dunzo'
  | 'rapido'
  | 'other';
export type VehicleType = 'petrol' | 'diesel' | 'electric' | 'other';
export type FuelMethod = 'petrol_pump' | 'home_charging' | 'battery_swap' | 'other';
export type InsuranceAnswer = 'yes' | 'no' | 'not_sure';
export type SwitchIntent = 'yes' | 'no' | 'already_ev' | 'need_info';
export type RiderSource = 'web' | 'whatsapp';

export interface RiderSubmit {
  full_name: string;
  phone: string;
  city: City;
  platform: Platform;
  years_experience: number;
  preferred_language: Locale;
  vehicle_type: VehicleType;
  vehicle_brand_model?: string | null;
  fuel_method: FuelMethod;
  weekly_expense: number;
  monthly_maintenance: number;
  top_challenges: string[];
  ev_challenges: string[];
  petrol_challenges: string[];
  has_accident_insurance: InsuranceAnswer;
  has_health_insurance: InsuranceAnswer;
  paid_out_of_pocket: boolean;
  open_to_switch: SwitchIntent;
  switch_motivators: string[];
  interested_in: string[];
  referred_by_code?: string | null;
}

export interface MilestoneProgress {
  target: number;
  current: number;
  points_bonus: number;
  reached: boolean;
}

export interface RiderSubmitResponse {
  success: boolean;
  rider_id: string;
  referral_code: string;
  points: number;
  segments: string[];
  whatsapp_sent: boolean;
  whatsapp_preview: string;
  is_duplicate: boolean;
}

export interface ScoreResponse {
  found: boolean;
  name?: string | null;
  referral_code?: string | null;
  points: number;
  referral_count: number;
  rank: number;
  total_riders: number;
  next_milestone: MilestoneProgress | null;
  share_url: string;
  milestones_reached: string[];
}

export interface ReferralValidation {
  valid: boolean;
  referrer_name?: string | null;
  referrer_city?: string | null;
}

export interface DayCount {
  date: string;
  count: number;
}

export interface StatsResponse {
  total_riders: number;
  total_points_awarded: number;
  active_referrers: number;
  hot_ev_leads: number;
  insurance_leads: number;
  retrofit_leads: number;
  by_vehicle_type: Record<string, number>;
  by_city: Record<string, number>;
  by_platform: Record<string, number>;
  by_language: Record<string, number>;
  signups_per_day: DayCount[];
}

export interface RiderListItem {
  id: string;
  full_name: string;
  phone: string;
  city: string;
  platform: string;
  vehicle_type: string;
  preferred_language: string;
  points: number;
  referral_count: number;
  referral_code: string;
  is_duplicate: boolean;
  source: string;
  created_at: string;
  segments: string[];
}

export interface RiderDetail extends RiderListItem {
  years_experience: number;
  vehicle_brand_model: string | null;
  fuel_method: string;
  weekly_expense: number;
  monthly_maintenance: number;
  top_challenges: string[];
  ev_challenges: string[];
  petrol_challenges: string[];
  has_accident_insurance: string;
  has_health_insurance: string;
  paid_out_of_pocket: boolean;
  open_to_switch: string;
  switch_motivators: string[];
  interested_in: string[];
  referred_by_code: string | null;
  milestone_10_reached: boolean;
  milestone_25_reached: boolean;
  milestone_50_reached: boolean;
  updated_at: string;
  notes: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  rider_id: string;
  full_name: string;
  city: string;
  points: number;
  referral_count: number;
  milestones_reached: string[];
}

export interface SegmentListResponse {
  segment: string;
  total: number;
  riders: RiderListItem[];
}

export interface WhatsAppMessage {
  id: string;
  phone: string;
  direction: 'inbound' | 'outbound';
  template: string;
  language: string;
  body: string;
  status: string;
  error: string | null;
  sent_at: string;
}

export interface MetaOptions {
  cities: City[];
  platforms: Platform[];
  vehicle_types: VehicleType[];
  fuel_methods: FuelMethod[];
  languages: Locale[];
  switch_intent: SwitchIntent[];
  insurance_answers: InsuranceAnswer[];
  challenges: {
    top: string[];
    ev: string[];
    petrol: string[];
  };
  motivators: string[];
  interested_in: string[];
}

export interface MetaSummary {
  total_riders: number;
  total_points_awarded: number;
}

/** Section shape used by useFormState */
export interface FormState {
  sectionA: {
    full_name: string;
    phone: string;
    city: City | '';
    platform: Platform | '';
    years_experience: string;
    preferred_language: Locale | '';
  };
  sectionB: {
    vehicle_type: VehicleType | '';
    vehicle_brand_model: string;
    fuel_method: FuelMethod | '';
    weekly_expense: string;
    monthly_maintenance: string;
  };
  sectionC: {
    top_challenges: string[];
    ev_challenges: string[];
    petrol_challenges: string[];
    other_challenge: string;
  };
  sectionD: {
    has_accident_insurance: InsuranceAnswer | '';
    has_health_insurance: InsuranceAnswer | '';
    paid_out_of_pocket: boolean | null;
  };
  sectionE: {
    open_to_switch: SwitchIntent | '';
    switch_motivators: string[];
    interested_in: string[];
  };
  sectionF: {
    referred: boolean | null;
    referral_code: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
  field?: string | null;
}
