import { Card } from '../ui/card'
import { LucideIcon } from 'lucide-react'

interface KPICardProps {
  title: string
  value: number | string
  icon: LucideIcon
  trend?: string
  trendUp?: boolean
}

export function KPICard({ title, value, icon: Icon, trend, trendUp }: KPICardProps) {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-secondary-500">
        <span className="text-sm font-medium">{title}</span>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-secondary-900">{value}</span>
        {trend && (
          <span
            className={`text-sm font-medium ${trendUp ? 'text-success-600' : 'text-danger-600'}`}
          >
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
    </Card>
  )
}
