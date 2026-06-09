'use client';

import { useTranslation } from 'react-i18next';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { Users, Award, Flame } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useTheme } from '@/lib/theme';

export function StatsBar() {
  const { t } = useTranslation('landing');
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { data, loading, error } = useApi(() => api.getMetaSummary(), []);

  return (
    <section className="mt-4 px-4 sm:px-6">
      <div className={`mx-auto grid max-w-3xl grid-cols-3 gap-2 rounded-2xl p-4 sm:gap-4 sm:p-6 transition-all duration-300 ${
        isDark
          ? 'bg-gray-900 border border-gray-700/60 shadow-[0_4px_24px_rgba(0,0,0,0.5)]'
          : 'bg-white shadow-card'
      }`}>
        <Stat
          icon={<Users className="h-5 w-5 text-white" />}
          iconBg="bg-primary-500"
          label={t('ridersLabel')}
          isDark={isDark}
          value={
            loading
              ? '…'
              : error
                ? '—'
                : (data?.total_riders ?? 0).toLocaleString('en-IN')
          }
        />
        <Stat
          icon={<Award className="h-5 w-5 text-white" />}
          iconBg="bg-amber-500"
          label={t('pointsLabel')}
          isDark={isDark}
          value={
            loading
              ? '…'
              : error
                ? '—'
                : (data?.total_points_awarded ?? 0).toLocaleString('en-IN')
          }
        />
        <Stat
          icon={<Flame className="h-5 w-5 text-white" />}
          iconBg="bg-rose-500"
          label={t('liveLabel')}
          isDark={isDark}
          value={t('liveValue')}
          small
          live
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
  iconBg,
  label,
  value,
  small,
  live,
  isDark,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  small?: boolean;
  live?: boolean;
  isDark: boolean;
}) {
  return (
    <div className="text-center">
      <div className={`relative mx-auto grid h-11 w-11 place-items-center rounded-full shadow-md ${iconBg}`}>
        {icon}
        {live && (
          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-green-400 ring-2 ring-white animate-pulse-soft" />
        )}
      </div>
      <p
        className={`mt-2 font-extrabold transition-colors duration-300 ${
          small ? 'text-base' : 'text-xl sm:text-2xl'
        } ${isDark ? 'text-white' : 'text-secondary-900'}`}
      >
        {value}
      </p>
      <p className={`text-[11px] sm:text-xs transition-colors duration-300 ${
        isDark ? 'text-gray-400' : 'text-secondary-500'
      }`}>{label}</p>
    </div>
  );
}
