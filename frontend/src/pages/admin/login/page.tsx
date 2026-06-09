'use client'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { api } from '../../../lib/api'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { LoadingSpinner } from '../../../components/common/LoadingSpinner'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await api.adminLogin(email, password)
      navigate('/admin')
    } catch (err: any) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4 py-12 dark:bg-gray-950">
      {/* Decorative background glow */}
      <div className="absolute left-1/2 top-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-500/10 blur-[100px] dark:bg-primary-900/20" />

      <div className="w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-check">
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2-1 4-2 7-2 2.82 0 5 1 7 2a1 1 0 0 1 1 1v7z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-secondary-900 dark:text-gray-100">
            Road Warrior
          </h1>
          <p className="mt-2 text-sm font-medium text-secondary-500 dark:text-gray-400">
            Secure Admin Dashboard
          </p>
        </div>

        <Card className="border-secondary-200/60 shadow-xl dark:border-gray-800 dark:bg-gray-900/80 dark:backdrop-blur-xl">
          <div className="p-6 sm:p-8">
            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              {error && (
                <div className="rounded-xl border border-danger-500/20 bg-danger-500/10 p-3 text-sm font-medium text-danger-600 dark:text-danger-400">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <Input
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="admin@example.com"
                />
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" disabled={loading} size="lg" className="mt-4 w-full shadow-md shadow-primary-500/20">
                {loading ? <LoadingSpinner size="sm" /> : 'Log in to Admin'}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
}
