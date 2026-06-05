'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input, Select } from '@/components/ui/input';
import { RadioCardGroup } from '@/components/ui/radio-group';
import { CITIES, LOCALES, PLATFORMS } from '@/lib/constants';
import { cityLocale } from '@/lib/locales';
import { isValidIndianPhone, normalizeIndianPhone } from '@/lib/utils';
import type { FormState } from '@/lib/types';

interface Props {
  value: FormState['sectionA'];
  onChange: (patch: Partial<FormState['sectionA']>) => void;
  errors: Partial<Record<keyof FormState['sectionA'], string>>;
}

export function SectionA({ value, onChange, errors }: Props) {
  const t = useTranslations('form.sectionA');
  const tVal = useTranslations('form.validation');
  const tOpt = useTranslations('form.options');

  const platformOptions = PLATFORMS.map((p) => ({
    value: p,
    label: tOpt(`platforms.${p}`) || (p[0].toUpperCase() + p.slice(1)),
  }));

  const localeOptions = LOCALES.map((l) => ({
    value: l,
    label: l === 'en' ? 'English' : l === 'hi' ? 'हिंदी' : 'ಕನ್ನಡ',
  }));

  const cityOptions = CITIES.map((c) => ({
    value: c,
    label: tOpt(`cities.${c}`) || c,
  }));

  // Live phone formatting
  const [phoneDisplay, setPhoneDisplay] = useState(value.phone || '');
  useEffect(() => {
    if (value.phone !== phoneDisplay.replace(/\D/g, '')) {
      setPhoneDisplay(value.phone || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.phone]);

  const phoneTouched = phoneDisplay.replace(/\D/g, '').length > 0;
  const phoneValid = phoneTouched ? isValidIndianPhone(phoneDisplay) : true;
  const phoneError =
    errors.phone ?? (phoneTouched && !phoneValid ? tVal('phoneRequired') : null);

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-xl font-extrabold text-secondary-900 sm:text-2xl">
          {t('title')}
        </h2>
        <p className="mt-1 text-sm text-secondary-500">{t('subtitle')}</p>
      </header>

      <Input
        label={t('fullName')}
        placeholder={t('fullNamePlaceholder')}
        autoComplete="name"
        value={value.full_name}
        onChange={(e) => onChange({ full_name: e.target.value })}
        error={errors.full_name ?? null}
        maxLength={100}
      />

      <Input
        label={t('phone')}
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        placeholder={t('phonePlaceholder')}
        prefix={<span className="font-semibold">+91</span>}
        value={phoneDisplay}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
          setPhoneDisplay(digits);
          try {
            onChange({ phone: digits ? normalizeIndianPhone(digits).slice(3) : '' });
          } catch {
            onChange({ phone: digits });
          }
        }}
        error={phoneError}
        maxLength={10}
      />

      <Select
        label={t('city')}
        value={value.city}
        onChange={(e) => {
          const city = e.target.value as FormState['sectionA']['city'];
          onChange({ city });
          // Auto-suggest language based on city
          if (city && !value.preferred_language) {
            const suggested = cityLocale[city];
            if (suggested) onChange({ preferred_language: suggested });
          }
        }}
        error={errors.city ?? null}
      >
        <option value="">{t('cityPlaceholder')}</option>
        {cityOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>

      <div>
        <p className="mb-2 text-sm font-medium text-secondary-900">{t('platform')}</p>
        <RadioCardGroup
          name="platform"
          value={value.platform || null}
          onChange={(v) => onChange({ platform: v as FormState['sectionA']['platform'] })}
          options={platformOptions}
          columns={2}
          error={errors.platform ?? null}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label={t('experience')}
          type="number"
          inputMode="numeric"
          min={0}
          max={50}
          value={value.years_experience}
          onChange={(e) =>
            onChange({ years_experience: e.target.value.replace(/\D/g, '').slice(0, 2) })
          }
          error={errors.years_experience ?? null}
        />
        <Select
          label={t('language')}
          value={value.preferred_language}
          onChange={(e) =>
            onChange({
              preferred_language: e.target.value as FormState['sectionA']['preferred_language'],
            })
          }
          error={errors.preferred_language ?? null}
        >
          <option value="">—</option>
          {localeOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
