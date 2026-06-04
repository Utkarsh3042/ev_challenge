'use client'

import { Sidebar } from '../../components/admin/Sidebar'
import { TopBar } from '../../components/admin/TopBar'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const isLoginPage = pathname === '/admin/login'
  const [loading, setLoading] = useState(!isLoginPage)

  useEffect(() => {
    if (isLoginPage) return

    api.adminMe()
      .then(() => setLoading(false))
      .catch(() => router.push('/admin/login'))
  }, [isLoginPage, router])

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
