'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import type { RiderListItem } from '../../../lib/types'
import { Card } from '../../../components/ui/card'

import { LoadingSpinner } from '../../../components/common/LoadingSpinner'

const SEGMENTS = [
  { id: 'hot_ev_lead', label: 'Hot EV Leads', color: 'bg-primary-100 text-primary-800' },
  { id: 'insurance_lead', label: 'Insurance Leads', color: 'bg-warning-100 text-warning-800' },
  { id: 'retrofit_lead', label: 'Retrofit Leads', color: 'bg-secondary-100 text-secondary-800' },
  { id: 'accident_victim', label: 'Accident Victims', color: 'bg-danger-100 text-danger-800' },
  { id: 'high_spender', label: 'High Spenders', color: 'bg-success-100 text-success-800' },
]

export default function LeadsPage() {
  const [activeSegment, setActiveSegment] = useState(SEGMENTS[0].id)
  const [riders, setRiders] = useState<RiderListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.getSegment(activeSegment)
      .then((data) => {
        setRiders(data.riders)
        setTotal(data.total)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [activeSegment])

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-wrap gap-2">
        {SEGMENTS.map((seg) => (
          <button
            key={seg.id}
            onClick={() => setActiveSegment(seg.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              activeSegment === seg.id
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-surface text-secondary-600 hover:bg-secondary-50'
            }`}
          >
            {seg.label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-secondary-200 bg-secondary-50 px-6 py-4">
          <h3 className="font-semibold text-secondary-900">
            {SEGMENTS.find(s => s.id === activeSegment)?.label} ({total})
          </h3>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center"><LoadingSpinner /></div>
          ) : riders.length > 0 ? (
            <table className="w-full text-left text-sm text-secondary-600">
              <thead className="bg-white text-xs font-semibold uppercase text-secondary-500">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">City</th>
                  <th className="px-6 py-4">Vehicle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200 bg-white">
                {riders.map((rider) => (
                  <tr key={rider.id} className="hover:bg-secondary-50/50">
                    <td className="px-6 py-4 font-medium text-secondary-900">{rider.full_name}</td>
                    <td className="px-6 py-4">{rider.phone}</td>
                    <td className="px-6 py-4">{rider.city}</td>
                    <td className="px-6 py-4 capitalize">{rider.vehicle_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-secondary-500">No riders found in this segment.</div>
          )}
        </div>
      </Card>
    </div>
  )
}
