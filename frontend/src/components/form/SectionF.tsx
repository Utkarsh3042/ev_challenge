'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { RadioInlineGroup } from '@/components/ui/radio-group';
import { api, ApiClientError } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import type { FormState, ReferralValidation } from '@/lib/types';

interface Props {
  value: FormState['sectionF'];
  onChange: (patch: Partial<FormState['sectionF']>) => void;
  errors: Partial<Record<keyof FormState['sectionF'], string>>;
}

export function SectionF({ value, onChange, errors }: Props) {
  const { t } = useTranslation('form', { keyPrefix: 'sectionF' });
  const { t: tCommon } = useTranslation('common');
  const debouncedCode = useDebounce(value.referral_code.trim().toUpperCase(), 400);
  const [validation, setValidation] = useState<ReferralValidation | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!value.referred) {
      setValidation(null);
      return;
    }
    if (debouncedCode.length < 3) {
      setValidation(null);
      return;
    }
    setChecking(true);
    api
      .validateReferral(debouncedCode)
      .then((res) => {
        if (!cancelled) setValidation(res);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiClientError && err.status === 404) {
          setValidation({ valid: false });
        } else {
          setValidation({ valid: false });
        }
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedCode, value.referred]);

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-xl font-extrabold text-secondary-900 sm:text-2xl">
          {t('title')}
        </h2>
        <p className="mt-1 text-sm text-secondary-500">{t('subtitle')}</p>
      </header>

      <div>
        <p className="mb-2 text-sm font-medium text-secondary-900">{t('referredBy')}</p>
        <RadioInlineGroup
          name="referred"
          value={value.referred === null ? null : value.referred ? 'true' : 'false'}
          onChange={(v) => onChange({ referred: v === 'true' })}
          options={[
            { value: 'true', label: tCommon('yes') },
            { value: 'false', label: tCommon('no') },
          ]}
        />
      </div>

      {value.referred ? (
        <div className="space-y-2">
          <Input
            label={t('referralCode')}
            placeholder={t('referralCodePlaceholder')}
            value={value.referral_code}
            onChange={(e) =>
              onChange({ referral_code: e.target.value.toUpperCase().slice(0, 20) })
            }
            error={errors.referral_code ?? null}
            autoCapitalize="characters"
          />
          <ValidationFeedback
            code={debouncedCode}
            validation={validation}
            checking={checking}
          />
        </div>
      ) : null}
    </div>
  );
}

function ValidationFeedback({
  code,
  validation,
  checking,
}: {
  code: string;
  validation: ReferralValidation | null;
  checking: boolean;
}) {
  const { t } = useTranslation('form', { keyPrefix: 'sectionF' });
  if (code.length < 3) return null;
  if (checking) {
    return (
      <p className="flex items-center gap-2 text-sm text-secondary-500">
        <Loader2 className="h-4 w-4 animate-spin" /> {t('checkingCode')}
      </p>
    );
  }
  if (!validation) return null;
  if (validation.valid) {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-success-600">
        <CheckCircle2 className="h-4 w-4" />
        {t('validCode', {
          name: validation.referrer_name ?? '',
          city: validation.referrer_city ?? '',
        })}
      </p>
    );
  }
  return (
    <p className="flex items-center gap-2 text-sm font-medium text-danger-500">
      <XCircle className="h-4 w-4" />
      {t('invalidCode')}
    </p>
  );
}
