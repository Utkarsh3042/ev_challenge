'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { CheckboxGroup } from '@/components/ui/checkbox-group';
import { EV_CHALLENGES, MAX_TOP_CHALLENGES, PETROL_CHALLENGES, TOP_CHALLENGES } from '@/lib/constants';
import type { FormState } from '@/lib/types';

interface Props {
  value: FormState['sectionC'];
  onChange: (patch: Partial<FormState['sectionC']>) => void;
  vehicleType: FormState['sectionB']['vehicle_type'];
}

export function SectionC({ value, onChange, vehicleType }: Props) {
  const t = useTranslations('form.sectionC');
  const tCommon = useTranslations('common');

  const isEv = vehicleType === 'electric';
  const isPetrol = vehicleType === 'petrol' || vehicleType === 'diesel';

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-xl font-extrabold text-secondary-900 sm:text-2xl">
          {t('title')}
        </h2>
        <p className="mt-1 text-sm text-secondary-500">{t('subtitle')}</p>
      </header>

      <div>
        <p className="mb-2 text-sm font-medium text-secondary-900">
          {t('topChallenges')}
        </p>
        <CheckboxGroup
          options={TOP_CHALLENGES.map((c) => ({
            value: c,
            label: t(c as 'high_fuel_cost') ?? c,
          }))}
          values={value.top_challenges}
          onChange={(next) => onChange({ top_challenges: next })}
          max={MAX_TOP_CHALLENGES}
          emptyHint={tCommon('max3')}
          columns={2}
        />
      </div>

      {isEv ? (
        <div>
          <p className="mb-2 text-sm font-medium text-secondary-900">
            {t('evChallenges')}
          </p>
          <CheckboxGroup
            options={EV_CHALLENGES.map((c) => ({
              value: c,
              label: t(c as 'batteryDrainsFast') ?? c,
            }))}
            values={value.ev_challenges}
            onChange={(next) => onChange({ ev_challenges: next })}
            columns={2}
          />
        </div>
      ) : null}

      {isPetrol ? (
        <div>
          <p className="mb-2 text-sm font-medium text-secondary-900">
            {t('petrolChallenges')}
          </p>
          <CheckboxGroup
            options={PETROL_CHALLENGES.map((c) => ({
              value: c,
              label: t(c as 'fuelPriceTooHigh') ?? c,
            }))}
            values={value.petrol_challenges}
            onChange={(next) => onChange({ petrol_challenges: next })}
            columns={2}
          />
        </div>
      ) : null}

      <Input
        label={t('otherChallenge')}
        value={value.other_challenge}
        onChange={(e) => onChange({ other_challenge: e.target.value })}
        maxLength={200}
        hint="Optional"
      />
    </div>
  );
}
