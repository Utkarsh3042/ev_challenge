import { Card } from '../ui/card'
import type { LucideIcon } from 'lucide-react'

interface KPICardProps {
  title: string
  value: number | string
  icon: LucideIcon
  trend?: string
  trendUp?: boolean
  gradientFrom?: string
  gradientTo?: string
  iconColor?: string
}

export function KPICard({ 
  title, value, icon: Icon, trend, trendUp, 
  gradientFrom = 'from-white', gradientTo = 'to-white', iconColor = 'text-primary-500' 
}: KPICardProps) {
  return (
    <Card className={`relative overflow-hidden flex flex-col gap-3 border-none shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md bg-gradient-to-br ${gradientFrom} ${gradientTo}`}>
      {/* Decorative blurred circle */}
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/20 blur-2xl" />
      
      <div className="relative z-10 flex items-center justify-between">
        <span className="text-sm font-semibold tracking-wide text-secondary-500 uppercase">{title}</span>
        <div className={`p-2 rounded-xl bg-white/60 shadow-sm backdrop-blur-md ${iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      
      <div className="relative z-10 flex items-baseline gap-3">
        <span className="text-3xl font-extrabold text-secondary-900 tracking-tight">{value}</span>
        {trend && (
          <span
            className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${trendUp ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-700'}`}
          >
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
    </Card>
  )
}
