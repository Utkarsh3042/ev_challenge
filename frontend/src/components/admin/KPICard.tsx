import { Card } from '../ui/card'
import type { LucideIcon } from 'lucide-react'
import { useTheme } from '@/lib/theme'

interface KPICardProps {
  title: string
  value: number | string
  icon: LucideIcon
  trend?: string
  trendUp?: boolean
  gradientFrom?: string
  gradientTo?: string
  gradientFromDark?: string
  iconColor?: string
}

export function KPICard({ 
  title, value, icon: Icon, trend, trendUp, 
  gradientFrom = 'from-white',
  gradientTo = 'to-white',
  gradientFromDark = 'from-gray-800',
  iconColor = 'text-primary-500' 
}: KPICardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const gradientClass = isDark
    ? `bg-gradient-to-br ${gradientFromDark} to-gray-900`
    : `bg-gradient-to-br ${gradientFrom} ${gradientTo}`;

  return (
    <Card className={`relative overflow-hidden p-5 flex flex-col gap-3 border-none shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${gradientClass}`}>
      {/* Decorative blurred circle */}
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl ${isDark ? 'bg-white/5' : 'bg-white/20'}`} />
      
      <div className="relative z-10 flex items-center justify-between">
        <span className={`text-sm font-semibold tracking-wide uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{title}</span>
        <div className={`p-2 rounded-xl shadow-sm backdrop-blur-md ${iconColor} ${isDark ? 'bg-gray-700/60' : 'bg-white/60'}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      
      <div className="relative z-10 flex items-baseline gap-3">
        <span className={`text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</span>
        {trend && (
          <span
            className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${trendUp ? 'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-400' : 'bg-danger-100 text-danger-700 dark:bg-danger-900/40 dark:text-danger-400'}`}
          >
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
    </Card>
  )
}
