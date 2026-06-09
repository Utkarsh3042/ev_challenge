'use client'

import { useEffect, useState, useMemo } from 'react'
import { api } from '../../lib/api'
import type { StatsResponse } from '../../lib/types'
import { Users, Zap, UserPlus, FileText, BatteryCharging, Wrench, Lightbulb } from 'lucide-react'
import { KPICard } from '../../components/admin/KPICard'
import { SignupsChart, VehicleTypeChart, CityChart, PlatformChart, LanguageChart } from '../../components/admin/Charts'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { ErrorState } from '../../components/common/ErrorState'

export default function AdminOverview() {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.getStats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const insights = useMemo(() => {
    if (!stats) return null
    const evCount = stats.by_vehicle_type['electric'] || 0
    const evPercent = stats.total_riders ? Math.round((evCount / stats.total_riders) * 100) : 0
    const activeReferrerPercent = stats.total_riders ? Math.round((stats.active_referrers / stats.total_riders) * 100) : 0
    return { evPercent, activeReferrerPercent }
  }, [stats])

  if (loading) return <div className="py-12 flex justify-center"><LoadingSpinner size="lg" /></div>
  if (error) return <ErrorState message={error} />
  if (!stats || !insights) return null

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-10">
      
      {/* Quick Insights Banner */}
      <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 p-5 text-white shadow-md">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
          <Lightbulb className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Quick Insights</h2>
          <p className="text-primary-50">
            <strong>{insights.evPercent}%</strong> of your riders are already driving electric vehicles. 
            Additionally, <strong>{insights.activeReferrerPercent}%</strong> of all riders have actively referred someone else!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard 
          title="Total Riders" 
          value={stats.total_riders.toLocaleString()} 
          icon={Users} 
          gradientFrom="from-blue-50" gradientTo="to-white" gradientFromDark="from-blue-950/60"
          iconColor="text-blue-500"
        />
        <KPICard 
          title="Points Awarded" 
          value={stats.total_points_awarded.toLocaleString()} 
          icon={Zap} 
          gradientFrom="from-amber-50" gradientTo="to-white" gradientFromDark="from-amber-950/60"
          iconColor="text-amber-500"
        />
        <KPICard 
          title="Active Referrers" 
          value={stats.active_referrers.toLocaleString()} 
          icon={UserPlus} 
          gradientFrom="from-emerald-50" gradientTo="to-white" gradientFromDark="from-emerald-950/60"
          iconColor="text-emerald-500"
        />
        <KPICard 
          title="Hot EV Leads" 
          value={stats.hot_ev_leads.toLocaleString()} 
          icon={BatteryCharging} 
          gradientFrom="from-purple-50" gradientTo="to-white" gradientFromDark="from-purple-950/60"
          iconColor="text-purple-500"
        />
        <KPICard 
          title="Insurance Leads" 
          value={stats.insurance_leads.toLocaleString()} 
          icon={FileText} 
          gradientFrom="from-pink-50" gradientTo="to-white" gradientFromDark="from-pink-950/60"
          iconColor="text-pink-500"
        />
        <KPICard 
          title="Retrofit Leads" 
          value={stats.retrofit_leads.toLocaleString()} 
          icon={Wrench} 
          gradientFrom="from-teal-50" gradientTo="to-white" gradientFromDark="from-teal-950/60"
          iconColor="text-teal-500"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SignupsChart data={stats.signups_per_day} />
        </div>
        <div className="lg:col-span-1">
          <PlatformChart data={stats.by_platform} />
        </div>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <VehicleTypeChart data={stats.by_vehicle_type} />
        <LanguageChart data={stats.by_language} />
        <CityChart data={stats.by_city} />
      </div>
    </div>
  )
}
