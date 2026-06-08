'use client';


import { cn } from '@/lib/utils';

export interface CheckboxOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface Props {
  options: CheckboxOption[];
  values: string[];
  onChange: (next: string[]) => void;
  max?: number;
  error?: string | null;
  disabled?: boolean;
  columns?: 1 | 2 | 3;
  emptyHint?: string;
}

export function CheckboxGroup({
  options,
  values,
  onChange,
  max,
  error,
  disabled,
  columns = 2,
  emptyHint,
}: Props) {
  const reached = max != null && values.length >= max;
  return (
    <div>
      {max != null ? (
        <div className="mb-2 text-xs font-medium text-secondary-500">
          {values.length}/{max} {emptyHint ?? 'selected'}
        </div>
      ) : null}
      <div
        className={cn(
          'grid gap-2',
          columns === 1 && 'grid-cols-1',
          columns === 2 && 'grid-cols-2',
          columns === 3 && 'grid-cols-3',
        )}
      >
        {options.map((opt) => {
          const checked = values.includes(opt.value);
          const disabledThis = disabled || (!checked && reached);
          return (
            <label
              key={opt.value}
              className={cn(
                'flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border p-3 text-left text-sm transition-colors tap-highlight',
                checked
                  ? 'border-primary-500 bg-primary-50 text-secondary-900'
                  : 'border-secondary-200 bg-white text-secondary-900 hover:border-primary-300',
                disabledThis && 'cursor-not-allowed opacity-60',
              )}
            >
              <input
                type="checkbox"
                value={opt.value}
                checked={checked}
                disabled={disabledThis}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...values, opt.value]);
                  } else {
                    onChange(values.filter((v) => v !== opt.value));
                  }
                }}
                className="sr-only"
              />
              <span
                className={cn(
                  'grid h-5 w-5 shrink-0 place-items-center rounded-md border-2',
                  checked
                    ? 'border-primary-500 bg-primary-500 text-white'
                    : 'border-secondary-300',
                )}
                aria-hidden="true"
              >
                {checked ? (
                  <svg viewBox="0 0 20 20" className="h-3 w-3 fill-current">
                    <path d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 011.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z" />
                  </svg>
                ) : null}
              </span>
              {opt.icon ? (
                <span className="text-lg" aria-hidden="true">
                  {opt.icon}
                </span>
              ) : null}
              <span className="min-w-0 flex-1 text-sm font-medium leading-tight">
                {opt.label}
              </span>
            </label>
          );
        })}
      </div>
      {error ? <p className="mt-1 text-xs text-danger-500">{error}</p> : null}
    </div>
  );
}
