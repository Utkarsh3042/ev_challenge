'use client'

import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { StatsResponse } from '../../lib/types'
import { Users, Zap, UserPlus, FileText, BatteryCharging, Wrench } from 'lucide-react'
import { KPICard } from '../../components/admin/KPICard'
import { SignupsChart, VehicleTypeChart, CityChart } from '../../components/admin/Charts'
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

  if (loading) return <div className="py-12 flex justify-center"><LoadingSpinner size="lg" /></div>
  if (error) return <ErrorState message={error} />
  if (!stats) return null

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Top KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard title="Total Riders" value={stats.total_riders} icon={Users} trend="12% vs last week" trendUp={true} />
        <KPICard title="Points Awarded" value={stats.total_points_awarded.toLocaleString()} icon={Zap} />
        <KPICard title="Active Referrers" value={stats.active_referrers} icon={UserPlus} />
        <KPICard title="Hot EV Leads" value={stats.hot_ev_leads} icon={BatteryCharging} />
        <KPICard title="Insurance Leads" value={stats.insurance_leads} icon={FileText} />
        <KPICard title="Retrofit Leads" value={stats.retrofit_leads} icon={Wrench} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SignupsChart data={stats.signups_per_day} />
        </div>
        <div className="flex flex-col gap-6">
          <VehicleTypeChart data={stats.by_vehicle_type} />
          <CityChart data={stats.by_city} />
        </div>
      </div>
    </div>
  )
}
