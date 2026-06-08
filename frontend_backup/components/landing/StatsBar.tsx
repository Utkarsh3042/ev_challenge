'use client';

import { useTranslations } from 'next-intl';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { Users, Award, Flame } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export function StatsBar() {
  const t = useTranslations('landing');
  const { data, loading, error } = useApi(() => api.getMetaSummary(), []);

  return (
    <section className="-mt-10 px-4 sm:px-6">
      <div className="mx-auto grid max-w-3xl grid-cols-3 gap-2 rounded-2xl bg-white p-4 shadow-card sm:gap-4 sm:p-6">
        <Stat
          icon={<Users className="h-5 w-5 text-primary-500" />}
          label={t('ridersLabel')}
          value={
            loading
              ? '…'
              : error
                ? '—'
                : (data?.total_riders ?? 0).toLocaleString('en-IN')
          }
        />
        <Stat
          icon={<Award className="h-5 w-5 text-primary-500" />}
          label={t('pointsLabel')}
          value={
            loading
              ? '…'
              : error
                ? '—'
                : (data?.total_points_awarded ?? 0).toLocaleString('en-IN')
          }
        />
        <Stat
          icon={<Flame className="h-5 w-5 text-primary-500" />}
          label={t('liveLabel')}
          value={t('liveValue')}
          small
        />
      </div>
      {loading ? (
        <div className="mt-2 flex justify-center">
          <LoadingSpinner size="sm" />
        </div>
      ) : null}
    </section>
  );
}

function Stat({
  icon,
  label,
  value,
  small,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto grid h-8 w-8 place-items-center rounded-full bg-primary-50">
        {icon}
      </div>
      <p
        className={
          'mt-2 font-extrabold text-secondary-900 ' +
          (small ? 'text-base' : 'text-xl sm:text-2xl')
        }
      >
        {value}
      </p>
      <p className="text-[11px] text-secondary-500 sm:text-xs">{label}</p>
    </div>
  );
}
