'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

interface Props {
  url: string;
  label?: string;
}

export function CopyLinkButton({ url, label }: Props) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  async function handleCopy() {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy — please copy manually');
    }
  }
  return (
    <Button variant="outline" onClick={handleCopy} leftIcon={copied ? <Check className="h-4 w-4 text-success-500" /> : <Copy className="h-4 w-4" />}>
      {copied ? 'Copied!' : label ?? 'Copy link'}
    </Button>
  );
}
