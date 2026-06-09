'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import type { RiderListItem } from '../../../lib/types'
import { Card } from '../../../components/ui/card'
import { LoadingSpinner } from '../../../components/common/LoadingSpinner'
import { Download } from 'lucide-react'

const SEGMENTS = [
  { id: 'PERSONAL_INSURANCE_LEAD', label: 'Personal Insurance', color: 'bg-blue-100 text-blue-800', desc: 'No health insurance' },
  { id: 'BIKE_INSURANCE_LEAD', label: 'Bike Insurance', color: 'bg-amber-100 text-amber-800', desc: 'No accident insurance' },
  { id: 'EV_SALE_LEAD', label: 'EV Sale', color: 'bg-green-100 text-green-800', desc: 'Interested in EV purchase' },
  { id: 'EV_RENTAL_LEAD', label: 'EV Rental', color: 'bg-purple-100 text-purple-800', desc: 'Interested in EV rental' },
  { id: 'RETROFIT_LEAD', label: 'Retrofit', color: 'bg-orange-100 text-orange-800', desc: 'Interested in retrofitting' },
  { id: 'PRODUCT_LEAD', label: 'Product', color: 'bg-rose-100 text-rose-800', desc: 'Other product interests' },
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

  const handleExport = () => {
    const url = api.getExportUrl({ segment: activeSegment })
    window.open(url, '_blank')
  }

  const activeSeg = SEGMENTS.find(s => s.id === activeSegment)!

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-secondary-900">Lead Segments</h2>
          <p className="text-sm text-secondary-500">Click a segment to view and export riders</p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Segment pills */}
      <div className="flex flex-wrap gap-2">
        {SEGMENTS.map((seg) => (
          <button
            key={seg.id}
            onClick={() => setActiveSegment(seg.id)}
            className={`flex flex-col items-start rounded-2xl border px-4 py-3 text-left transition-all ${
              activeSegment === seg.id
                ? 'border-primary-500 bg-primary-600 text-white shadow-md'
                : 'border-secondary-200 bg-white text-secondary-700 hover:border-primary-300 hover:bg-primary-50'
            }`}
          >
            <span className="text-sm font-bold">{seg.label}</span>
            <span className={`mt-0.5 text-[11px] ${activeSegment === seg.id ? 'text-primary-100' : 'text-secondary-400'}`}>{seg.desc}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-secondary-200 bg-secondary-50 px-6 py-4">
          <div>
            <h3 className="font-semibold text-secondary-900">{activeSeg.label} Leads</h3>
            <p className="text-xs text-secondary-500">{total} rider{total !== 1 ? 's' : ''} in this segment</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${activeSeg.color}`}>
            {activeSeg.id}
          </span>
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
                  <th className="px-6 py-4">Platform</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200 bg-white">
                {riders.map((rider) => (
                  <tr key={rider.id} className="hover:bg-secondary-50/50">
                    <td className="px-6 py-4 font-medium text-secondary-900">{rider.full_name}</td>
                    <td className="px-6 py-4 font-mono text-xs">{rider.phone}</td>
                    <td className="px-6 py-4">{rider.city}</td>
                    <td className="px-6 py-4 capitalize">{rider.vehicle_type}</td>
                    <td className="px-6 py-4 capitalize">{rider.platform}</td>
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
