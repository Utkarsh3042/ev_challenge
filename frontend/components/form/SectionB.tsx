'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { RadioCardGroup } from '@/components/ui/radio-group';
import { FUEL_METHODS, VEHICLE_TYPES } from '@/lib/constants';
import type { FormState, FuelMethod, VehicleType } from '@/lib/types';

const vehicleOptions: Array<{
  value: VehicleType;
  label: string;
  icon: string;
  description?: string;
}> = [
  { value: 'petrol', label: 'Petrol', icon: '🛵' },
  { value: 'diesel', label: 'Diesel', icon: '⚙️' },
  { value: 'electric', label: 'Electric', icon: '⚡' },
  { value: 'other', label: 'Other', icon: '❓' },
];

const fuelOptions: Array<{ value: FuelMethod; label: string; icon: string }> = [
  { value: 'petrol_pump', label: 'Petrol pump', icon: '⛽' },
  { value: 'home_charging', label: 'Home charging', icon: '🏠' },
  { value: 'battery_swap', label: 'Battery swap', icon: '🔋' },
  { value: 'other', label: 'Other', icon: '❓' },
];

interface Props {
  value: FormState['sectionB'];
  onChange: (patch: Partial<FormState['sectionB']>) => void;
  errors: Partial<Record<keyof FormState['sectionB'], string>>;
}

export function SectionB({ value, onChange, errors }: Props) {
  const t = useTranslations('form.sectionB');
  const tVal = useTranslations('form.validation');
  
  const fuelOptionsDynamic = fuelOptions.map(v => {
    let key = v.value as string;
    if (key === 'petrol_pump') key = 'petrolPump';
    if (key === 'home_charging') key = 'homeCharging';
    if (key === 'battery_swap') key = 'batterySwap';
    return {
      ...v,
      label: t(key as any) || v.label
    };
  });

  // Touched-derived errors
  const fuelError = errors.fuel_method ?? (!value.fuel_method ? tVal('fuelMethodRequired') : null);

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-xl font-extrabold text-secondary-900 sm:text-2xl">
          {t('title')}
        </h2>
        <p className="mt-1 text-sm text-secondary-500">{t('subtitle')}</p>
      </header>

      <div>
        <p className="mb-2 text-sm font-medium text-secondary-900">{t('vehicleType')}</p>
        <RadioCardGroup
          name="vehicle_type"
          value={value.vehicle_type || null}
          onChange={(v) => onChange({ vehicle_type: v as VehicleType })}
          options={vehicleOptions.map((v) => ({
            value: v.value,
            label: t(v.value as 'petrol' | 'diesel' | 'electric' | 'other'),
            icon: v.icon,
          }))}
          columns={2}
          error={errors.vehicle_type ?? null}
        />
      </div>

      <Input
        label={t('brandModel')}
        placeholder={t('brandModelPlaceholder')}
        value={value.vehicle_brand_model}
        onChange={(e) => onChange({ vehicle_brand_model: e.target.value })}
        maxLength={100}
        hint="Optional"
      />

      <div>
        <p className="mb-2 text-sm font-medium text-secondary-900">{t('fuelMethod')}</p>
        <RadioCardGroup
          name="fuel_method"
          value={value.fuel_method || null}
          onChange={(v) => onChange({ fuel_method: v as FuelMethod })}
          options={fuelOptionsDynamic}
          columns={2}
          error={fuelError}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label={t('weeklyExpense')}
          type="number"
          inputMode="numeric"
          min={0}
          prefix={<span className="font-semibold">₹</span>}
          placeholder={t('weeklyExpensePlaceholder')}
          value={value.weekly_expense}
          onChange={(e) =>
            onChange({ weekly_expense: e.target.value.replace(/\D/g, '').slice(0, 6) })
          }
        />
        <Input
          label={t('monthlyMaintenance')}
          type="number"
          inputMode="numeric"
          min={0}
          prefix={<span className="font-semibold">₹</span>}
          placeholder={t('monthlyMaintenancePlaceholder')}
          value={value.monthly_maintenance}
          onChange={(e) =>
            onChange({ monthly_maintenance: e.target.value.replace(/\D/g, '').slice(0, 6) })
          }
        />
      </div>
    </div>
  );
}
