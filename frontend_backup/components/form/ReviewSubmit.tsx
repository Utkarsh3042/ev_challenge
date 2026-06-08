'use client';

import { useTranslations } from 'next-intl';
import { Edit2 } from 'lucide-react';
import type { FormState } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

interface Row {
  label: string;
  value: string;
}

interface Props {
  state: FormState;
  onEdit: (sectionIndex: number) => void;
  onSubmit: () => void;
  loading?: boolean;
  error?: string | null;
}

export function ReviewSubmit({ state, onEdit, onSubmit, loading, error }: Props) {
  const t = useTranslations('form');
  const tCommon = useTranslations('common');

  const rows: Array<{ title: string; rows: Row[] }> = [
    {
      title: t('sectionA.title'),
      rows: [
        { label: t('sectionA.fullName'), value: state.sectionA.full_name || '—' },
        { label: t('sectionA.phone'), value: state.sectionA.phone ? `+91 ${state.sectionA.phone}` : '—' },
        { label: t('sectionA.city'), value: state.sectionA.city || '—' },
        { label: t('sectionA.platform'), value: state.sectionA.platform || '—' },
        { label: t('sectionA.experience'), value: state.sectionA.years_experience || '—' },
        { label: t('sectionA.language'), value: state.sectionA.preferred_language || '—' },
      ],
    },
    {
      title: t('sectionB.title'),
      rows: [
        { label: t('sectionB.vehicleType'), value: state.sectionB.vehicle_type || '—' },
        { label: t('sectionB.brandModel'), value: state.sectionB.vehicle_brand_model || '—' },
        { label: t('sectionB.fuelMethod'), value: state.sectionB.fuel_method || '—' },
        { label: t('sectionB.weeklyExpense'), value: state.sectionB.weekly_expense ? formatCurrency(state.sectionB.weekly_expense) : '—' },
        { label: t('sectionB.monthlyMaintenance'), value: state.sectionB.monthly_maintenance ? formatCurrency(state.sectionB.monthly_maintenance) : '—' },
      ],
    },
    {
      title: t('sectionC.title'),
      rows: [
        { label: t('sectionC.topChallenges'), value: state.sectionC.top_challenges.length ? state.sectionC.top_challenges.join(', ') : '—' },
        ...(state.sectionB.vehicle_type === 'electric'
          ? [{ label: t('sectionC.evChallenges'), value: state.sectionC.ev_challenges.length ? state.sectionC.ev_challenges.join(', ') : '—' }]
          : []),
        ...(state.sectionB.vehicle_type === 'petrol' || state.sectionB.vehicle_type === 'diesel'
          ? [{ label: t('sectionC.petrolChallenges'), value: state.sectionC.petrol_challenges.length ? state.sectionC.petrol_challenges.join(', ') : '—' }]
          : []),
      ],
    },
    {
      title: t('sectionD.title'),
      rows: [
        { label: t('sectionD.accidentInsurance'), value: state.sectionD.has_accident_insurance || '—' },
        { label: t('sectionD.healthInsurance'), value: state.sectionD.has_health_insurance || '—' },
        { label: t('sectionD.paidOutOfPocket'), value: state.sectionD.paid_out_of_pocket === null ? '—' : state.sectionD.paid_out_of_pocket ? 'Yes' : 'No' },
      ],
    },
    {
      title: t('sectionE.title'),
      rows: [
        { label: t('sectionE.openToSwitch'), value: state.sectionE.open_to_switch || '—' },
        { label: t('sectionE.switchMotivators'), value: state.sectionE.switch_motivators.length ? state.sectionE.switch_motivators.join(', ') : '—' },
        { label: t('sectionE.interestedIn'), value: state.sectionE.interested_in.length ? state.sectionE.interested_in.join(', ') : '—' },
      ],
    },
    {
      title: t('sectionF.title'),
      rows: [
        { label: t('sectionF.referredBy'), value: state.sectionF.referred === null ? '—' : state.sectionF.referred ? 'Yes' : 'No' },
        { label: t('sectionF.referralCode'), value: state.sectionF.referral_code || '—' },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-xl font-extrabold text-secondary-900 sm:text-2xl">
          {t('reviewTitle')}
        </h2>
      </header>
      <div className="space-y-3">
        {rows.map((sec, i) => (
          <section key={sec.title} className="rounded-2xl border border-secondary-100 bg-white p-4 shadow-card">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-secondary-900">{sec.title}</h3>
              <button
                type="button"
                onClick={() => onEdit(i)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
              >
                <Edit2 className="h-3.5 w-3.5" />
                {tCommon('back')}
              </button>
            </div>
            <dl className="grid grid-cols-1 gap-1.5 text-sm sm:grid-cols-2 sm:gap-x-4">
              {sec.rows.map((r) => (
                <div key={r.label} className="flex flex-col">
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-secondary-500">{r.label}</dt>
                  <dd className="text-secondary-900">{r.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
      {error ? (
        <p className="rounded-lg border border-danger-500/30 bg-danger-500/5 px-3 py-2 text-sm text-danger-600">
          {error}
        </p>
      ) : null}
      <Button onClick={onSubmit} loading={loading} size="xl" fullWidth>
        {tCommon('submit')}
      </Button>
    </div>
  );
}
