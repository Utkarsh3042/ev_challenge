'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface Props {
  value: string;
  size?: number;
  className?: string;
}

export function ReferralDisplay({ value, size = 224, className }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (!ref.current || !value) return;
    QRCode.toCanvas(ref.current, value, {
      width: size,
      margin: 1,
      color: { dark: '#0F1B2D', light: '#FFFFFF' },
    }).catch(() => {
      /* noop */
    });
  }, [value, size]);
  if (!value) return null;
  return (
    <div className={className}>
      <canvas
        ref={ref}
        width={size}
        height={size}
        className="h-auto w-full max-w-[260px] rounded-2xl border border-secondary-100 bg-white p-2 shadow-card"
        aria-label="Your QR code"
      />
    </div>
  );
}
