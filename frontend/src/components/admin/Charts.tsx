'use client'

import { Card } from '../ui/card'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { useTheme } from '@/lib/theme'

const COLORS = ['#FF6B1A', '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#14B8A6']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/20 bg-white/90 p-3 shadow-lg backdrop-blur-md dark:bg-gray-800/90 dark:border-gray-700">
        <p className="mb-1 text-sm font-semibold text-secondary-900 dark:text-gray-100">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-medium" style={{ color: entry.color || entry.fill }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function SignupsChart({ data }: { data: { date: string; count: number }[] }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const formattedData = data.map((d) => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  }))

  return (
    <Card className="h-[400px] w-full border-none shadow-sm flex flex-col p-5">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-bold tracking-tight text-secondary-900 dark:text-gray-100">Signups Trend</h3>
        <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">Last 30 Days</span>
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF6B1A" stopOpacity={isDark ? 0.4 : 0.3} />
                <stop offset="95%" stopColor="#FF6B1A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={isDark ? '#374151' : '#f1f5f9'} />
            <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#9ca3af' : '#94a3b8', fontSize: 12 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#9ca3af' : '#94a3b8', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              name="New Riders"
              stroke="#FF6B1A"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorSignups)"
              activeDot={{ r: 6, fill: '#FF6B1A', stroke: isDark ? '#1f2937' : '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export function VehicleTypeChart({ data }: { data: Record<string, number> }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const chartData = Object.entries(data).map(([name, value]) => ({ name, value }))

  return (
    <Card className="h-[320px] w-full flex flex-col border-none shadow-sm p-5">
      <h3 className="mb-2 text-base font-bold tracking-tight text-secondary-900 dark:text-gray-100">Vehicle Types</h3>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value">
              {chartData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={isDark ? '#1f2937' : '#ffffff'} strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500, color: isDark ? '#9ca3af' : '#475569' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export function LanguageChart({ data }: { data: Record<string, number> }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const chartData = Object.entries(data).map(([name, value]) => ({ 
    name: name === 'en' ? 'English' : name === 'hi' ? 'Hindi' : name === 'kn' ? 'Kannada' : name, 
    value 
  }))

  return (
    <Card className="h-[320px] w-full flex flex-col border-none shadow-sm p-5">
      <h3 className="mb-2 text-base font-bold tracking-tight text-secondary-900 dark:text-gray-100">Language Preferences</h3>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={0} outerRadius={85} dataKey="value">
              {chartData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} stroke={isDark ? '#1f2937' : '#fff'} strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500, color: isDark ? '#9ca3af' : '#475569' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export function CityChart({ data }: { data: Record<string, number> }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const chartData = Object.entries(data)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  return (
    <Card className="h-[320px] w-full flex flex-col border-none shadow-sm p-5">
      <h3 className="mb-4 text-base font-bold tracking-tight text-secondary-900 dark:text-gray-100">Top Cities</h3>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={isDark ? '#374151' : '#f1f5f9'} />
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#9ca3af' : '#64748b', fontSize: 12, fontWeight: 500 }} />
            <Tooltip cursor={{ fill: isDark ? '#374151' : '#f8fafc' }} content={<CustomTooltip />} />
            <Bar dataKey="count" name="Riders" fill="#3B82F6" radius={[0, 6, 6, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export function PlatformChart({ data }: { data: Record<string, number> }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const chartData = Object.entries(data)
    .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count }))
    .sort((a, b) => b.count - a.count)

  return (
    <Card className="h-[320px] w-full flex flex-col border-none shadow-sm p-5">
      <h3 className="mb-4 text-base font-bold tracking-tight text-secondary-900 dark:text-gray-100">Delivery Platforms</h3>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#374151' : '#f1f5f9'} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#9ca3af' : '#64748b', fontSize: 11, fontWeight: 500 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#9ca3af' : '#64748b', fontSize: 12 }} />
            <Tooltip cursor={{ fill: isDark ? '#374151' : '#f8fafc' }} content={<CustomTooltip />} />
            <Bar dataKey="count" name="Riders" fill="#10B981" radius={[6, 6, 0, 0]} barSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
