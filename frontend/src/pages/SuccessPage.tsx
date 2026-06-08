'use client'

import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useEffect, useState, Suspense } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ReferralDisplay } from '@/components/share/ReferralDisplay'
import { WhatsAppShareButton } from '@/components/share/WhatsAppShareButton'
import { CopyLinkButton } from '@/components/share/CopyLinkButton'
import { DownloadQRButton } from '@/components/share/DownloadQRButton'
import type { RiderSubmitResponse } from '@/lib/types'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Link } from 'react-router-dom';

function SuccessContent({ lang }: { lang: string }) {
  const { t } = useTranslation('success');
  const [searchParams] = useSearchParams()
  const code = searchParams.get('code') || ''
  const nameParam = searchParams.get('name') || ''
  const name = nameParam.split(' ')[0] || 'Rider'

  const [points, setPoints] = useState(10) // default starter points
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/${lang}?ref=${code}` : ''
  const shareMessage = t('shareMessage', { code, url: shareUrl })

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('roadwarrior:last-submit')
      if (saved) {
        const data = JSON.parse(saved) as RiderSubmitResponse
        if (data.referral_code === code) {
          setPoints(data.points)
        }
      }
    } catch {}
  }, [code])

  return (
    <div className="flex flex-1 flex-col p-4 sm:p-6 animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-secondary-900">{t('title', { name })}</h1>
        <p className="mt-1 text-secondary-500">{t('subtitle')}</p>
      </div>

      <Card className="flex flex-col items-center gap-6 bg-gradient-to-br from-primary-50 to-white text-center">
        <div>
          <p className="text-sm font-medium text-secondary-500">{t('yourCode')}</p>
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="text-3xl font-bold tracking-wider text-primary-600">{code}</span>
          </div>
        </div>
        
        {code && (
          <div className="flex flex-col items-center gap-4 w-full">
            <ReferralDisplay value={`${window.location.origin}/api/riders/qr/${code}.png`} size={200} />
            <DownloadQRButton code={code} />
          </div>
        )}

        <div className="w-full border-t border-secondary-100 pt-4">
          <p className="text-sm font-medium text-secondary-500">{t('points')}</p>
          <p className="text-2xl font-bold text-secondary-900">{points}</p>
        </div>
      </Card>

      <div className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold text-secondary-900 text-center">{t('shareTitle')}</h2>
        
        <WhatsAppShareButton message={shareMessage} />
        <CopyLinkButton url={shareMessage} label={t('copyLink')} />

        <div className="rounded-lg bg-secondary-50 p-4 text-center text-sm text-secondary-600">
          {t('milestoneHint')}
        </div>
      </div>

      <div className="mt-12 text-center border-t border-secondary-200 pt-6">
        <p className="text-sm text-secondary-500 mb-4">{t('checkScore')}</p>
        <Link to={`/${lang}/score`}>
          <Button variant="outline" className="w-full">
            {t('scoreLink')}
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default function SuccessPage({ params: { lang } }: { params: { lang: string } }) {
  return (
    <Suspense fallback={<div className="flex justify-center p-12"><LoadingSpinner size="lg" /></div>}>
      <SuccessContent lang={lang} />
    </Suspense>
  )
}
