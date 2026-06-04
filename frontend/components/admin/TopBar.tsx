'use client'

import { Menu } from 'lucide-react'
import { useState } from 'react'
import { Drawer } from '../ui/drawer'
import { Sidebar } from './Sidebar'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function TopBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // Simple title mapping
  const titles: Record<string, string> = {
    '/admin': 'Dashboard Overview',
    '/admin/riders': 'All Riders',
    '/admin/leads': 'Hot Leads & Segments',
    '/admin/leaderboard': 'Leaderboard',
    '/admin/messages': 'WhatsApp Messages Log',
  }

  const title = titles[pathname] || 'Admin'

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-secondary-200 bg-surface px-4 sm:px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-md p-2 text-secondary-500 hover:bg-secondary-100 sm:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h2 className="text-lg font-semibold text-secondary-900">{title}</h2>
        </div>
        <div className="flex items-center gap-4">
          {/* Add admin profile / actions here if needed */}
        </div>
      </header>

      <Drawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title="Menu"
        side="left"
      >
        <div className="mt-4 flex flex-col gap-2">
          <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 hover:bg-secondary-50 font-medium">Overview</Link>
          <Link href="/admin/riders" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 hover:bg-secondary-50 font-medium">All Riders</Link>
          <Link href="/admin/leads" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 hover:bg-secondary-50 font-medium">Hot Leads</Link>
          <Link href="/admin/leaderboard" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 hover:bg-secondary-50 font-medium">Leaderboard</Link>
          <Link href="/admin/messages" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 hover:bg-secondary-50 font-medium">Messages</Link>
        </div>
      </Drawer>
    </>
  )
}
