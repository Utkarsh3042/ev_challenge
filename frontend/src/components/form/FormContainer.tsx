'use client';

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, ApiClientError } from '@/lib/api';
import { useFormState } from '@/hooks/useFormState';
import { isValidIndianPhone, normalizeIndianPhone } from '@/lib/utils';
import { clearFormState } from '@/lib/form-state';
import type { FormState, RiderSubmit, RiderSubmitResponse } from '@/lib/types';
import { ProgressBar } from './ProgressBar';
import { SectionA } from './SectionA';
import { SectionB } from './SectionB';
import { SectionC } from './SectionC';
import { SectionD } from './SectionD';
import { SectionE } from './SectionE';
import { SectionF } from './SectionF';
import { StickyNextButton } from './StickyNextButton';
import { ReviewSubmit } from './ReviewSubmit';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useToast } from '@/components/ui/toast';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

const TOTAL_SECTIONS = 6;

type SectionKey = keyof FormState;
type Errors = Partial<Record<SectionKey, Record<string, string>>>;

export function FormContainer({ locale }: { locale: string }) {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const { t } = useTranslation('common');
  const { t: tVal } = useTranslation('form', { keyPrefix: 'validation' });
  const toast = useToast();

  const { state, update, setAll, reset, hasSavedBefore } = useFormState();
  const [section, setSection] = useState(0); // 0..5 + 6 for review
  const [showResume, setShowResume] = useState(false);
  const [resumeChecked, setResumeChecked] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [honeypot, setHoneypot] = useState('');

  // On first mount, prompt to resume saved state
  useEffect(() => {
    if (resumeChecked) return;
    setResumeChecked(true);
    if (hasSavedBefore) setShowResume(true);
  }, [hasSavedBefore, resumeChecked]);

  // Auto-fill referral code from `?ref=RW-XXXX`
  useEffect(() => {
    const ref = search.get('ref');
    if (ref && /^[A-Z0-9-]{3,20}$/i.test(ref) && !state.sectionF.referral_code) {
      update('sectionF', { referred: true, referral_code: ref.toUpperCase() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function validateSection(idx: number): boolean {
    const newErrors: Errors = { ...errors };
    let ok = true;

    const fail = (sec: SectionKey, field: string, msg: string) => {
      ok = false;
      newErrors[sec] = { ...(newErrors[sec] ?? {}), [field]: msg };
    };

    if (idx === 0) {
      const a = state.sectionA;
      if (!a.full_name || a.full_name.trim().length < 2) fail('sectionA', 'full_name', tVal('fullNameRequired'));
      if (!a.phone || !isValidIndianPhone(a.phone)) fail('sectionA', 'phone', tVal('phoneRequired'));
      if (!a.pin_code || a.pin_code.length !== 6) fail('sectionA', 'pin_code', 'Please enter a valid 6-digit PIN code');
      if (!a.city) fail('sectionA', 'city', tVal('cityRequired'));
      if (!a.platforms || a.platforms.length === 0) fail('sectionA', 'platforms', 'Please select at least one platform');
    } else if (idx === 1) {
      const b = state.sectionB;
      if (!b.vehicle_type) fail('sectionB', 'vehicle_type', tVal('vehicleRequired'));
      if (!b.fuel_method) fail('sectionB', 'fuel_method', tVal('fuelMethodRequired'));
    } else if (idx === 2) {
      // optional
    } else if (idx === 3) {
      const d = state.sectionD;
      if (!d.has_accident_insurance) fail('sectionD', 'has_accident_insurance', tVal('insuranceRequired'));
      if (!d.has_health_insurance) fail('sectionD', 'has_health_insurance', tVal('insuranceRequired'));
    } else if (idx === 4) {
      const e = state.sectionE;
      if (!e.open_to_switch) fail('sectionE', 'open_to_switch', tVal('switchRequired'));
    } else if (idx === 5) {
      // F is optional — but if referred and code is blank, that's also fine
    }

    setErrors(newErrors);
    return ok;
  }

  function goNext() {
    if (section >= TOTAL_SECTIONS) return;
    if (!validateSection(section)) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    setErrors({});
    setSection((s) => Math.min(s + 1, TOTAL_SECTIONS));
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function goBack() {
    if (section <= 0) return;
    setErrors({});
    setSection((s) => Math.max(s - 1, 0));
  }

  function gotoReview() {
    // Run all validations
    for (let i = 0; i < TOTAL_SECTIONS; i++) {
      if (!validateSection(i)) {
        setSection(i);
        toast.error('Please fix the highlighted fields');
        return;
      }
    }
    setErrors({});
    setSection(TOTAL_SECTIONS);
  }

  async function handleSubmit(otp: string) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (!executeRecaptcha) {
        throw new Error('reCAPTCHA not ready');
      }
      const recaptcha_token = await executeRecaptcha('form_submit');
      const payload = buildSubmitPayload(state, recaptcha_token, honeypot, otp);
      const res: RiderSubmitResponse = await api.submitRider(payload);
      clearFormState();
      reset();
      // Persist last code so the success page can pick it up if needed
      try {
        sessionStorage.setItem('roadwarrior:last-submit', JSON.stringify(res));
      } catch {
        /* noop */
      }
      const params = new URLSearchParams({ code: res.referral_code, name: state.sectionA.full_name });
      navigate(`/${locale}/form/success?${params.toString()}`);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setSubmitError(err.payload?.message || err.message);
      } else {
        setSubmitError('Network error — please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const isReview = section === TOTAL_SECTIONS;
  const sectionLabels = useMemo(
    () => [
      t('next'),
      t('next'),
      t('next'),
      t('next'),
      t('next'),
      t('next'),
    ],
    [t],
  );

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {/* Resume-prompt sheet */}
      <ConfirmDialog
        open={showResume}
        title="Resume previous session?"
        message="We found your in-progress answers. Continue where you left off?"
        confirmLabel="Resume"
        cancelLabel="Start over"
        onConfirm={() => setShowResume(false)}
        onCancel={() => {
          setShowResume(false);
          reset();
          setAll({
            sectionA: { full_name: '', phone: '', pin_code: '', city: '', platform: '', platforms: [], years_experience: '', preferred_language: '' },
            sectionB: { vehicle_type: '', vehicle_brand_model: '', fuel_method: '', weekly_expense: '', monthly_maintenance: '' },
            sectionC: { top_challenges: [], ev_challenges: [], petrol_challenges: [], other_challenge: '' },
            sectionD: { has_accident_insurance: '', has_health_insurance: '', paid_out_of_pocket: null },
            sectionE: { open_to_switch: '', switch_motivators: [], interested_in: [] },
            sectionF: { referred: null, referral_code: '' },
          });
        }}
      />

      <ConfirmDialog
        open={showConfirmReset}
        title="Clear all answers?"
        message="This will delete everything you've entered so far."
        confirmLabel="Clear"
        destructive
        onConfirm={() => {
          setShowConfirmReset(false);
          reset();
          setAll({
            sectionA: { full_name: '', phone: '', pin_code: '', city: '', platform: '', platforms: [], years_experience: '', preferred_language: '' },
            sectionB: { vehicle_type: '', vehicle_brand_model: '', fuel_method: '', weekly_expense: '', monthly_maintenance: '' },
            sectionC: { top_challenges: [], ev_challenges: [], petrol_challenges: [], other_challenge: '' },
            sectionD: { has_accident_insurance: '', has_health_insurance: '', paid_out_of_pocket: null },
            sectionE: { open_to_switch: '', switch_motivators: [], interested_in: [] },
            sectionF: { referred: null, referral_code: '' },
          });
          setSection(0);
        }}
        onCancel={() => setShowConfirmReset(false)}
      />

      <div className="bg-white">
        <ProgressBar current={Math.min(section + 1, TOTAL_SECTIONS)} total={TOTAL_SECTIONS} />
        {hasSavedBefore ? (
          <div className="px-4 pb-1 sm:px-6">
            <button
              type="button"
              onClick={() => setShowConfirmReset(true)}
              className="text-[11px] text-secondary-500 underline-offset-2 hover:underline"
            >
              Clear & start over
            </button>
          </div>
        ) : null}
      </div>

      <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6">
        <div className="mx-auto max-w-3xl">
          {section === 0 ? <SectionA value={state.sectionA} onChange={(p) => update('sectionA', p)} errors={errors.sectionA ?? {}} /> : null}
          {section === 1 ? <SectionB value={state.sectionB} onChange={(p) => update('sectionB', p)} errors={errors.sectionB ?? {}} /> : null}
          {section === 2 ? <SectionC value={state.sectionC} onChange={(p) => update('sectionC', p)} vehicleType={state.sectionB.vehicle_type} /> : null}
          {section === 3 ? <SectionD value={state.sectionD} onChange={(p) => update('sectionD', p)} errors={errors.sectionD ?? {}} /> : null}
          {section === 4 ? <SectionE value={state.sectionE} onChange={(p) => update('sectionE', p)} errors={errors.sectionE ?? {}} /> : null}
          {section === 5 ? <SectionF value={state.sectionF} onChange={(p) => update('sectionF', p)} errors={errors.sectionF ?? {}} /> : null}
          {isReview ? (
            <ReviewSubmit
              state={state}
              onEdit={(i) => setSection(i)}
              onSubmit={handleSubmit}
              loading={submitting}
              error={submitError}
            />
          ) : null}
        </div>
      </main>

      {!isReview ? (
        <StickyNextButton
          canBack={section > 0}
          onBack={goBack}
          onNext={section === TOTAL_SECTIONS - 1 ? gotoReview : goNext}
          nextLabel={section === TOTAL_SECTIONS - 1 ? t('submit') : sectionLabels[section]}
        />
      ) : null}

      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="sr-only"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
      />
    </div>
  );
}

function buildSubmitPayload(state: FormState, recaptcha_token: string, website: string, otp: string): RiderSubmit {
  const a = state.sectionA;
  const b = state.sectionB;
  const c = state.sectionC;
  const d = state.sectionD;
  const e = state.sectionE;
  const f = state.sectionF;
  return {
    full_name: a.full_name.trim(),
    phone: a.phone ? normalizeIndianPhone(a.phone) : '',
    pin_code: a.pin_code || '000000',
    city: a.city as RiderSubmit['city'],
    platform: (a.platforms[0] || 'other') as RiderSubmit['platform'],
    platforms: a.platforms,
    years_experience: a.years_experience ? Number(a.years_experience) : 0,
    preferred_language: (a.preferred_language || 'en') as RiderSubmit['preferred_language'],
    vehicle_type: b.vehicle_type as RiderSubmit['vehicle_type'],
    vehicle_brand_model: b.vehicle_brand_model.trim() || null,
    fuel_method: b.fuel_method as RiderSubmit['fuel_method'],
    weekly_expense: b.weekly_expense ? Number(b.weekly_expense) : 0,
    monthly_maintenance: b.monthly_maintenance ? Number(b.monthly_maintenance) : 0,
    top_challenges: c.top_challenges,
    ev_challenges: b.vehicle_type === 'electric' ? c.ev_challenges : [],
    petrol_challenges: b.vehicle_type === 'petrol' || b.vehicle_type === 'diesel' ? c.petrol_challenges : [],
    has_accident_insurance: d.has_accident_insurance as RiderSubmit['has_accident_insurance'],
    has_health_insurance: d.has_health_insurance as RiderSubmit['has_health_insurance'],
    paid_out_of_pocket: !!d.paid_out_of_pocket,
    open_to_switch: e.open_to_switch as RiderSubmit['open_to_switch'],
    switch_motivators: e.switch_motivators,
    interested_in: e.interested_in,
    referred_by_code: f.referred && f.referral_code.trim() ? f.referral_code.trim().toUpperCase() : null,
    recaptcha_token,
    website: website || null,
    otp,
  };
}
