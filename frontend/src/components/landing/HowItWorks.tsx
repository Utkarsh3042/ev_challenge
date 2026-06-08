'use client';

import { useTranslation } from 'react-i18next';
import { ClipboardList, Key, Share2 } from 'lucide-react';

const STEPS = [
  { key: 'step1Title', descKey: 'step1Desc', icon: ClipboardList },
  { key: 'step2Title', descKey: 'step2Desc', icon: Key },
  { key: 'step3Title', descKey: 'step3Desc', icon: Share2 },
] as const;

export function HowItWorks() {
  const { t } = useTranslation('landing');
  return (
    <section className="px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-2xl font-extrabold text-secondary-900 sm:text-3xl">
          {t('howTitle')}
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <li
                key={s.key}
                className="rounded-2xl border border-secondary-100 bg-white p-5 shadow-card"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-50 text-primary-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-secondary-900 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-bold text-secondary-900">
                  {t(s.key)}
                </h3>
                <p className="mt-1 text-sm text-secondary-500">{t(s.descKey)}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
