import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Trophy, ArrowLeft, Loader2, Search } from 'lucide-react'
import { api, ApiClientError } from '@/lib/api'
import type { ScoreResponse } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { isValidIndianPhone, normalizeIndianPhone } from '@/lib/utils'

export function ScorePage() {
  const { t } = useTranslation('score')
  const navigate = useNavigate()
  
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ScoreResponse | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidIndianPhone(phone)) {
      setError(t('invalidPhone'))
      return
    }
    
    setLoading(true)
    setError(null)
    setResult(null)
    
    try {
      const data = await api.getScore(normalizeIndianPhone(phone))
      setResult(data)
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 404) {
        setError(t('notFound'))
      } else {
        setError(t('fetchError'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-surface sm:bg-canvas">
      <header className="sticky top-0 z-10 border-b border-secondary-200 bg-surface px-4 py-3 sm:px-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-medium text-secondary-600 hover:text-secondary-900"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backBtn')}
        </button>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-md rounded-2xl bg-surface sm:p-8 sm:shadow-card">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
              <Trophy className="h-7 w-7 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-secondary-900">{t('title')}</h1>
            <p className="mt-2 text-sm text-secondary-600">{t('subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="mb-8 space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-secondary-900">
                {t('phoneLabel')}
              </label>
              <div className="mt-1 relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-secondary-500 sm:text-sm">+91</span>
                </div>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '')
                    if (val.length <= 10) setPhone(val)
                    if (error) setError(null)
                  }}
                  className={`block w-full rounded-xl border pl-12 shadow-sm focus:ring-2 sm:text-sm sm:leading-6 ${
                    error
                      ? 'border-danger-300 pr-10 text-danger-900 placeholder-danger-300 focus:border-danger-500 focus:ring-danger-500/20'
                      : 'border-secondary-300 py-2.5 text-secondary-900 placeholder:text-secondary-400 focus:border-primary-500 focus:ring-primary-500/20'
                  }`}
                  placeholder="99999 99999"
                  inputMode="numeric"
                  autoComplete="tel-national"
                />
              </div>
              {error ? (
                <p className="mt-2 text-sm text-danger-600" role="alert">
                  {error}
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading || phone.length < 10}
              rightIcon={loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
            >
              {loading ? t('searching') : t('checkScore')}
            </Button>
          </form>

          {result ? (
            <div className="animate-fade-in rounded-xl border border-secondary-200 bg-canvas p-6 text-center shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-secondary-500">
                {t('scoreHeader')}
              </h2>
              <div className="mt-2 flex items-baseline justify-center gap-1">
                <span className="text-5xl font-extrabold text-primary-600 tracking-tight">
                  {result.points}
                </span>
                <span className="text-xl font-medium text-secondary-400">/ 100</span>
              </div>
              <p className="mt-3 text-sm text-secondary-700">
                {result.name ? `${t('hi')} ${result.name}, ` : ''}{t('scoreMsg')}
              </p>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
}
