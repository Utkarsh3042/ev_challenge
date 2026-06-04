'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../../../lib/api'
import { ScoreResponse } from '../../../lib/types'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Card } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Progress } from '../../../components/ui/progress'
import { ErrorState } from '../../../components/common/ErrorState'
import { LoadingSpinner } from '../../../components/common/LoadingSpinner'

export default function ScorePage() {
  const t = useTranslations('score')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [score, setScore] = useState<ScoreResponse | null>(null)

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || phone.length < 10) {
      setError(t('notFoundDesc'))
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await api.getScore(phone)
      if (res.found) {
        setScore(res)
      } else {
        setScore(null)
        setError(t('notFoundDesc'))
      }
    } catch (err: any) {
      setError(err.message || t('notFoundDesc'))
      setScore(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-8">
      <h1 className="text-2xl font-bold text-secondary-900">{t('title')}</h1>
      <p className="mt-2 text-sm text-secondary-500">{t('subtitle')}</p>

      <form onSubmit={handleCheck} className="mt-6 flex flex-col gap-4">
        <Input
          label={t('enterPhone')}
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
          maxLength={10}
          placeholder="9876543210"
          required
        />
        <Button type="submit" disabled={loading || phone.length < 10} className="w-full">
          {loading ? <LoadingSpinner size="sm" /> : t('checkScore')}
        </Button>
      </form>

      {error && (
        <div className="mt-8">
          <ErrorState message={error} />
        </div>
      )}

      {score && (
        <div className="mt-8 flex flex-col gap-6 animate-fade-in">
          <Card className="flex flex-col gap-4 bg-gradient-to-br from-primary-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-500">{t('yourPoints')}</p>
                <p className="text-3xl font-bold text-primary-600">{score.points}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-secondary-500">{t('rank')}</p>
                <p className="text-2xl font-bold text-secondary-900">
                  #{score.rank} <span className="text-sm font-normal text-secondary-400">{t('of')} {score.total_riders}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-secondary-100 pt-4">
              <p className="text-sm font-medium text-secondary-500">{t('referralCount')}</p>
              <Badge tone="success" className="text-lg px-3 py-1">{score.referral_count}</Badge>
            </div>
          </Card>

          {score.next_milestone ? (
            <Card>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-secondary-900">{t('nextMilestone')}</p>
                <p className="text-sm font-medium text-primary-600">
                  {t('referralsAway', { count: score.next_milestone.target - score.next_milestone.current })}
                </p>
              </div>
              <Progress 
                value={(score.next_milestone.current / score.next_milestone.target) * 100} 
                className="h-3"
              />
              <div className="mt-2 flex justify-between text-xs text-secondary-500">
                <span>{score.next_milestone.current}</span>
                <span>{score.next_milestone.target}</span>
              </div>
            </Card>
          ) : (
            <Card className="bg-success-50 text-center border-success-500/20">
              <p className="text-sm font-bold text-success-600">{t('noMilestone')}</p>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
