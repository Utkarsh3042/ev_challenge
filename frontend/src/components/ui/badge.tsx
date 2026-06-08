
import { cn } from '@/lib/utils';

type Tone =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'ev'
  | 'petrol'
  | 'retrofit'
  | 'insurance'
  | 'victim'
  | 'spender';

const TONE_STYLES: Record<Tone, string> = {
  neutral: 'bg-secondary-50 text-secondary-900 border-secondary-200',
  primary: 'bg-primary-50 text-primary-700 border-primary-200',
  success: 'bg-success-500/10 text-success-600 border-success-500/20',
  warning: 'bg-warning-500/10 text-warning-600 border-warning-500/20',
  danger: 'bg-danger-500/10 text-danger-600 border-danger-500/20',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  ev: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  petrol: 'bg-amber-50 text-amber-700 border-amber-200',
  retrofit: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  insurance: 'bg-rose-50 text-rose-700 border-rose-200',
  victim: 'bg-red-50 text-red-700 border-red-200',
  spender: 'bg-purple-50 text-purple-700 border-purple-200',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ className, tone = 'neutral', ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        TONE_STYLES[tone],
        className,
      )}
      {...rest}
    />
  );
}

/** Map segment tag → badge tone */
export function segmentTone(tag: string): Tone {
  switch (tag) {
    case 'hot_ev_lead':
      return 'primary';
    case 'ev_rider':
    case 'swing_rider':
      return 'ev';
    case 'petrol_rider':
    case 'diesel_rider':
      return 'petrol';
    case 'insurance_lead':
      return 'insurance';
    case 'accident_victim':
      return 'victim';
    case 'retrofit_lead':
    case 'rental_lead':
      return 'retrofit';
    case 'high_spender':
      return 'spender';
    case 'veteran':
      return 'warning';
    default:
      return 'neutral';
  }
}

export function SegmentBadge({ tag }: { tag: string }) {
  return <Badge tone={segmentTone(tag)}>{tag.replace(/_/g, ' ')}</Badge>;
}
