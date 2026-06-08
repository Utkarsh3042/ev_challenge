'use client'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { api } from '../../../lib/api'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { ErrorState } from '../../../components/common/ErrorState'
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
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary-600">Road Warrior</h1>
          <p className="mt-2 text-secondary-500">Admin Dashboard</p>
        </div>

        <Card>
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {error && <ErrorState message={error} />}
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <Button type="submit" disabled={loading} className="mt-2">
              {loading ? <LoadingSpinner size="sm" /> : 'Log in to Admin'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
