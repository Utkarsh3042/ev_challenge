'use client';

import { useTranslation } from 'react-i18next';
import { RadioInlineGroup } from '@/components/ui/radio-group';
import type { FormState, InsuranceAnswer } from '@/lib/types';

interface Props {
  value: FormState['sectionD'];
  onChange: (patch: Partial<FormState['sectionD']>) => void;
  errors: Partial<Record<keyof FormState['sectionD'], string>>;
}

const answerOptions = (t: (k: string) => string) => [
  { value: 'yes', label: t('yes') },
  { value: 'no', label: t('no') },
  { value: 'not_sure', label: t('notSure') },
];

const boolOptions = (t: (k: string) => string) => [
  { value: 'true', label: t('yes') },
  { value: 'false', label: t('no') },
];

export function SectionD({ value, onChange, errors }: Props) {
  const { t } = useTranslation('form', { keyPrefix: 'sectionD' });
  const { t: tCommon } = useTranslation('common');
  const { t: tVal } = useTranslation('form', { keyPrefix: 'validation' });
  const accErr = errors.has_accident_insurance ?? (!value.has_accident_insurance ? tVal('insuranceRequired') : null);
  const healthErr = errors.has_health_insurance ?? (!value.has_health_insurance ? tVal('insuranceRequired') : null);
  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-xl font-extrabold text-secondary-900 sm:text-2xl">
          {t('title')}
        </h2>
        <p className="mt-1 text-sm text-secondary-500">{t('subtitle')}</p>
      </header>

      <div>
        <p className="mb-2 text-sm font-medium text-secondary-900">{t('accidentInsurance')}</p>
        <RadioInlineGroup
          name="has_accident_insurance"
          value={(value.has_accident_insurance as string) || null}
          onChange={(v) => onChange({ has_accident_insurance: v as InsuranceAnswer })}
          options={answerOptions(tCommon)}
          error={accErr}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-secondary-900">{t('healthInsurance')}</p>
        <RadioInlineGroup
          name="has_health_insurance"
          value={(value.has_health_insurance as string) || null}
          onChange={(v) => onChange({ has_health_insurance: v as InsuranceAnswer })}
          options={answerOptions(tCommon)}
          error={healthErr}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-secondary-900">{t('paidOutOfPocket')}</p>
        <RadioInlineGroup
          name="paid_out_of_pocket"
          value={value.paid_out_of_pocket === null ? null : value.paid_out_of_pocket ? 'true' : 'false'}
          onChange={(v) => onChange({ paid_out_of_pocket: v === 'true' })}
          options={boolOptions(tCommon)}
        />
      </div>
    </div>
  );
}
