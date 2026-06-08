'use client';


import { cn } from '@/lib/utils';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface BaseProps {
  options: RadioOption[];
  value: string | null | undefined;
  onChange: (value: string) => void;
  error?: string | null;
  disabled?: boolean;
  name?: string;
}

const baseClasses = cn(
  'flex items-center gap-3 rounded-xl border p-3 text-left transition-all',
  'focus-within:ring-2 focus-within:ring-primary-500/20 tap-highlight',
);

/* ---------- Card variant (large tap targets) ----------------------------- */
export function RadioCardGroup({
  options,
  value,
  onChange,
  error,
  disabled,
  name,
  columns = 2,
}: BaseProps & { columns?: 1 | 2 | 3 }) {
  return (
    <div
      role="radiogroup"
      className={cn(
        'grid gap-2',
        columns === 1 && 'grid-cols-1',
        columns === 2 && 'grid-cols-2',
        columns === 3 && 'grid-cols-3',
      )}
    >
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <label
            key={opt.value}
            className={cn(
              baseClasses,
              'cursor-pointer',
              selected
                ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500/30'
                : 'border-secondary-200 bg-white hover:border-primary-300',
              disabled && 'cursor-not-allowed opacity-60',
            )}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={selected}
              disabled={disabled}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            {opt.icon ? (
              <span className="text-2xl" aria-hidden="true">
                {opt.icon}
              </span>
            ) : null}
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-secondary-900">
                {opt.label}
              </span>
              {opt.description ? (
                <span className="block text-xs text-secondary-500">
                  {opt.description}
                </span>
              ) : null}
            </span>
            <span
              className={cn(
                'grid h-5 w-5 shrink-0 place-items-center rounded-full border-2',
                selected ? 'border-primary-500 bg-primary-500' : 'border-secondary-300',
              )}
              aria-hidden="true"
            >
              {selected ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
            </span>
          </label>
        );
      })}
      {error ? <p className="col-span-full text-xs text-danger-500">{error}</p> : null}
    </div>
  );
}

/* ---------- Inline variant (horizontal pills) ---------------------------- */
export function RadioInlineGroup({
  options,
  value,
  onChange,
  error,
  disabled,
  name,
}: BaseProps) {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <label
              key={opt.value}
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors tap-highlight',
                selected
                  ? 'border-primary-500 bg-primary-500 text-white'
                  : 'border-secondary-200 bg-white text-secondary-900 hover:border-primary-300',
                disabled && 'cursor-not-allowed opacity-60',
              )}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={selected}
                disabled={disabled}
                onChange={() => onChange(opt.value)}
                className="sr-only"
              />
              {opt.icon ? <span aria-hidden="true">{opt.icon}</span> : null}
              <span>{opt.label}</span>
            </label>
          );
        })}
      </div>
      {error ? <p className="mt-1 text-xs text-danger-500">{error}</p> : null}
    </div>
  );
}
