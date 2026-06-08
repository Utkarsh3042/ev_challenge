'use client'

import { Sidebar } from '../../components/admin/Sidebar'
import { TopBar } from '../../components/admin/TopBar'
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation(); const pathname = location.pathname;
  const navigate = useNavigate();
  const isLoginPage = pathname === '/admin/login'
  const [loading, setLoading] = useState(!isLoginPage)

  useEffect(() => {
    if (isLoginPage) return

    api.adminMe()
      .then(() => setLoading(false))
      .catch(() => navigate('/admin/login'))
  }, [isLoginPage, navigate])

  if (isLoginPage) {
    return <div className="min-h-screen bg-canvas">{children}</div>
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar />
      <div className="flex flex-col sm:pl-64">
        <TopBar />
        <main className="flex-1 p-4 sm:p-8">{children}</main>
      </div>
    </div>
  )
}
