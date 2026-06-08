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
  const [filterCity, setFilterCity] = useState('')
  const [filterSegment, setFilterSegment] = useState('')
  const [filterPinCode, setFilterPinCode] = useState('')
  const [filterFollowUp, setFilterFollowUp] = useState<string>('all') // 'all', 'yes', 'no'

  const fetchRiders = () => {
    setLoading(true)
    api.listRiders({
      city: filterCity || undefined,
      segment: filterSegment || undefined,
      pin_code: filterPinCode || undefined,
      follow_up_flag: filterFollowUp === 'all' ? undefined : filterFollowUp === 'yes',
    })
      .then((data) => setRiders(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchRiders()
  }, [filterCity, filterSegment, filterFollowUp, filterPinCode])

  const filteredRiders = riders.filter(
    (r) =>
      r.full_name.toLowerCase().includes(search.toLowerCase()) ||
      r.phone.includes(search) ||
      r.city.toLowerCase().includes(search.toLowerCase())
  )

  const handleExport = () => {
    try {
      window.open(api.getExportUrl({
        city: filterCity || undefined,
        segment: filterSegment || undefined,
        pin_code: filterPinCode || undefined,
        follow_up_flag: filterFollowUp === 'all' ? undefined : filterFollowUp === 'yes',
      }), '_blank')
    } catch (e) {
      console.error('Export failed', e)
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col flex-wrap gap-4 sm:flex-row sm:items-center">
        <div className="relative max-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search local..."
            className="pl-10"
          />
        </div>
        <select
          value={filterCity}
          onChange={(e) => setFilterCity(e.target.value)}
          className="rounded-xl border border-secondary-200 bg-white px-3 py-2 text-sm text-secondary-700 outline-none"
        >
          <option value="">All Cities</option>
          <option value="Bangalore">Bangalore</option>
          <option value="Delhi">Delhi</option>
          <option value="Mumbai">Mumbai</option>
          <option value="Hyderabad">Hyderabad</option>
          <option value="Chennai">Chennai</option>
          <option value="Pune">Pune</option>
        </select>
        <select
          value={filterSegment}
          onChange={(e) => setFilterSegment(e.target.value)}
          className="rounded-xl border border-secondary-200 bg-white px-3 py-2 text-sm text-secondary-700 outline-none"
        >
          <option value="">All Segments</option>
          <option value="PERSONAL_INSURANCE_LEAD">Personal Insurance</option>
          <option value="BIKE_INSURANCE_LEAD">Bike Insurance</option>
          <option value="EV_SALE_LEAD">EV Sale</option>
          <option value="EV_RENTAL_LEAD">EV Rental</option>
          <option value="RETROFIT_LEAD">Retrofit</option>
          <option value="PRODUCT_LEAD">Other Product</option>
        </select>
        <select
          value={filterFollowUp}
          onChange={(e) => setFilterFollowUp(e.target.value)}
          className="rounded-xl border border-secondary-200 bg-white px-3 py-2 text-sm text-secondary-700 outline-none"
        >
          <option value="all">Follow Up: Any</option>
          <option value="yes">Follow Up: Yes</option>
          <option value="no">Follow Up: No</option>
        </select>
        <Input
          value={filterPinCode}
          onChange={(e) => setFilterPinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="Filter PIN Code"
          className="max-w-[120px]"
        />
        <Button onClick={handleExport} variant="outline" className="ml-auto flex items-center gap-2 bg-surface">
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
                  <th className="px-6 py-4">City & PIN</th>
                  <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4 text-right">Points</th>
                  <th className="px-6 py-4 text-right">Referrals</th>
                  <th className="px-6 py-4">Segments</th>
                  <th className="px-6 py-4">Follow Up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200">
                {filteredRiders.map((rider) => (
                  <tr key={rider.id} className="hover:bg-secondary-50/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-secondary-900">{rider.full_name}</div>
                      <div className="text-xs">{rider.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{rider.city}</div>
                      <div className="text-xs text-secondary-500">{rider.pin_code}</div>
                    </td>
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
                    <td className="px-6 py-4">
                      {rider.follow_up_flag ? (
                        <Badge tone="success" className="text-xs">Yes</Badge>
                      ) : (
                        <Badge tone="neutral" className="text-xs text-secondary-400">No</Badge>
                      )}
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
