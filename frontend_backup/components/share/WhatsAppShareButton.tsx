'use client';

import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  message: string;
  className?: string;
}

export function WhatsAppShareButton({ message, className }: Props) {
  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className} aria-label="Share on WhatsApp">
      <Button variant="primary" fullWidth leftIcon={<MessageCircle className="h-4 w-4" />}>
        WhatsApp
      </Button>
    </a>
  );
}
