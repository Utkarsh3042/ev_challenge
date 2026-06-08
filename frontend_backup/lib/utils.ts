import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind-aware className merger. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format an integer as Indian Rupees: 1500 -> "₹1,500" */
export function formatCurrency(value: number | string | null | undefined): string {
  if (value == null || value === '') return '—';
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return '—';
  return '₹' + n.toLocaleString('en-IN');
}

/** Format a date in the user's locale */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Display a phone number in the canonical +91 98xxx xxxxx form */
export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return '—';
  // already E.164
  const m = phone.match(/^\+91(\d{5})(\d{5})$/);
  if (m) return `+91 ${m[1]} ${m[2]}`;
  return phone;
}

/** Validate a 10-digit Indian mobile number (no country code). */
export function isValidIndianPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  return digits.length === 10 && /^[6-9]\d{9}$/.test(digits);
}

/** Normalize to E.164 (+91XXXXXXXXXX). Throws on bad input. */
export function normalizeIndianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `+91${digits.slice(1)}`;
  throw new Error('Invalid phone number');
}

/** Truncate a string with ellipsis */
export function truncate(s: string, max: number): string {
  if (!s) return '';
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

/** Build a share URL like http://localhost:3000/en/form?ref=RW-AB23 */
export function buildShareUrl(code: string, locale: string = 'en'): string {
  const base =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SITE_URL) ||
    'http://localhost:3000';
  return `${base.replace(/\/$/, '')}/${locale}/form?ref=${encodeURIComponent(code)}`;
}

/** Sleep helper (for retries / debounced UX). */
export function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}
