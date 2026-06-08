'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';

interface Props {
  code: string;
  filename?: string;
}

export function DownloadQRButton({ code, filename }: Props) {
  const toast = useToast();
  async function handleDownload() {
    try {
      const url = api.getQrPngUrl(code);
      const res = await fetch(url);
      if (!res.ok) throw new Error('Could not generate QR');
      const blob = await res.blob();
      const dl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dl;
      a.download = filename ?? `roadwarrior-${code}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(dl);
      toast.success('QR downloaded');
    } catch {
      toast.error('Could not download QR');
    }
  }
  return (
    <Button variant="outline" onClick={handleDownload} leftIcon={<Download className="h-4 w-4" />}>
      Download QR
    </Button>
  );
}
