'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Flame, Trophy, MessageSquare, LogOut } from 'lucide-react'
import { api } from '../../lib/api'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/riders', label: 'All Riders', icon: Users },
  { href: '/admin/leads', label: 'Hot Leads', icon: Flame },
  { href: '/admin/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await api.adminLogout()
      router.push('/admin/login')
    } catch (e) {}
  }

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-secondary-200 bg-surface sm:flex">
      <div className="flex h-16 items-center border-b border-secondary-200 px-6">
        <h1 className="text-xl font-bold text-primary-600">Road Warrior</h1>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? 'text-primary-600' : 'text-secondary-400'}`} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-secondary-200 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-danger-600 transition-colors hover:bg-danger-50"
        >
          <LogOut className="h-5 w-5 text-danger-500" />
          Logout
        </button>
      </div>
    </aside>
  )
}
