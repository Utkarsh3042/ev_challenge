'use client'

import { Menu } from 'lucide-react'
import { useState } from 'react'
import { Drawer } from '../ui/drawer'
import { ThemeToggle } from '../common/ThemeToggle'
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

export function TopBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation(); const pathname = location.pathname;

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
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      <Drawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title="Menu"
        side="left"
      >
        <div className="mt-4 flex flex-col gap-2">
          <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 hover:bg-secondary-50 font-medium">Overview</Link>
          <Link to="/admin/riders" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 hover:bg-secondary-50 font-medium">All Riders</Link>
          <Link to="/admin/leads" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 hover:bg-secondary-50 font-medium">Hot Leads</Link>
          <Link to="/admin/leaderboard" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 hover:bg-secondary-50 font-medium">Leaderboard</Link>
          <Link to="/admin/messages" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 hover:bg-secondary-50 font-medium">Messages</Link>
        </div>
      </Drawer>
    </>
  )
}
