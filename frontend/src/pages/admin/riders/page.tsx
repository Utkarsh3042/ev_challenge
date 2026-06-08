import { Badge } from '../../../components/ui/badge';
'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import type { RiderListItem } from '../../../lib/types'
import { Card } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'

import { LoadingSpinner } from '../../../components/common/LoadingSpinner'
import { Download, Search } from 'lucide-react'

export default function RidersPage() {
  const [riders, setRiders] = useState<RiderListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.listRiders()
      .then((data) => setRiders(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filteredRiders = riders.filter(
    (r) =>
      r.full_name.toLowerCase().includes(search.toLowerCase()) ||
      r.phone.includes(search) ||
      r.city.toLowerCase().includes(search.toLowerCase())
  )

  const handleExport = () => {
    try {
      window.open(api.getExportUrl(), '_blank')
    } catch (e) {
      console.error('Export failed', e)
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search riders..."
            className="pl-10"
          />
        </div>
        <Button onClick={handleExport} variant="outline" className="flex items-center gap-2 bg-surface">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center"><LoadingSpinner /></div>
          ) : (
            <table className="w-full text-left text-sm text-secondary-600">
              <thead className="bg-secondary-50 text-xs font-semibold uppercase text-secondary-500">
                <tr>
                  <th className="px-6 py-4">Name & Phone</th>
                  <th className="px-6 py-4">City</th>
                  <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4 text-right">Points</th>
                  <th className="px-6 py-4 text-right">Referrals</th>
                  <th className="px-6 py-4">Segments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200">
                {filteredRiders.map((rider) => (
                  <tr key={rider.id} className="hover:bg-secondary-50/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-secondary-900">{rider.full_name}</div>
                      <div className="text-xs">{rider.phone}</div>
                    </td>
                    <td className="px-6 py-4">{rider.city}</td>
                    <td className="px-6 py-4 capitalize">{rider.vehicle_type}</td>
                    <td className="px-6 py-4 text-right font-bold text-primary-600">{rider.points}</td>
                    <td className="px-6 py-4 text-right">{rider.referral_count}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {rider.segments.slice(0, 2).map((seg) => (
                          <Badge key={seg} tone="neutral" className="text-[10px] uppercase">
                            {seg.replace('_', ' ')}
                          </Badge>
                        ))}
                        {rider.segments.length > 2 && (
                          <Badge tone="neutral" className="text-[10px] uppercase">
                            +{rider.segments.length - 2}
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && filteredRiders.length === 0 && (
            <div className="p-8 text-center text-secondary-500">No riders found.</div>
          )}
        </div>
      </Card>
    </div>
  )
}
