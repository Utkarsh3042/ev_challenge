'use client';

import { useTranslations } from 'next-intl';
import { RadioCardGroup } from '@/components/ui/radio-group';
import { CheckboxGroup } from '@/components/ui/checkbox-group';
import { INTERESTED_IN, SWITCH_MOTIVATORS } from '@/lib/constants';
import type { FormState, SwitchIntent } from '@/lib/types';

interface Props {
  value: FormState['sectionE'];
  onChange: (patch: Partial<FormState['sectionE']>) => void;
  errors: Partial<Record<keyof FormState['sectionE'], string>>;
}

const switchOptions: Array<{ value: SwitchIntent; label: string; icon: string }> = [
  { value: 'yes', label: 'Yes', icon: '✅' },
  { value: 'no', label: 'No', icon: '❌' },
  { value: 'already_ev', label: 'Already EV', icon: '⚡' },
  { value: 'need_info', label: 'Need info', icon: '❓' },
];

export function SectionE({ value, onChange, errors }: Props) {
  const t = useTranslations('form.sectionE');
  const tVal = useTranslations('form.validation');
  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-xl font-extrabold text-secondary-900 sm:text-2xl">
          {t('title')}
        </h2>
        <p className="mt-1 text-sm text-secondary-500">{t('subtitle')}</p>
      </header>

      <div>
        <p className="mb-2 text-sm font-medium text-secondary-900">{t('openToSwitch')}</p>
        <RadioCardGroup
          name="open_to_switch"
          value={value.open_to_switch || null}
          onChange={(v) => onChange({ open_to_switch: v as SwitchIntent })}
          options={switchOptions}
          columns={2}
          error={errors.open_to_switch ?? (!value.open_to_switch ? tVal('switchRequired') : null)}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-secondary-900">
          {t('switchMotivators')}
        </p>
        <CheckboxGroup
          options={SWITCH_MOTIVATORS.map((m) => ({
            value: m,
            label: t(m as 'lowerRentalCost') ?? m,
          }))}
          values={value.switch_motivators}
          onChange={(next) => onChange({ switch_motivators: next })}
          columns={2}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-secondary-900">{t('interestedIn')}</p>
        <CheckboxGroup
          options={INTERESTED_IN.map((m) => ({
            value: m,
            label: t(m as 'evRentalOffer') ?? m,
          }))}
          values={value.interested_in}
          onChange={(next) => onChange({ interested_in: next })}
          columns={2}
        />
      </div>
    </div>
  );
}
