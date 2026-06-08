import { Badge } from '../../../components/ui/badge';
'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import type { WhatsAppMessage } from '../../../lib/types'
import { Card } from '../../../components/ui/card'

import { LoadingSpinner } from '../../../components/common/LoadingSpinner'
import { CheckCircle2, AlertCircle, Clock, ChevronRight, X } from 'lucide-react'

export default function MessagesPage() {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [filterDirection, setFilterDirection] = useState<'all' | 'inbound' | 'outbound'>('all')
  const [selectedMsg, setSelectedMsg] = useState<WhatsAppMessage | null>(null)

  useEffect(() => {
    api.listMessages()
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = messages.filter(m => filterDirection === 'all' || m.direction === filterDirection)

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'sent':
      case 'delivered':
      case 'read':
        return <CheckCircle2 className="h-4 w-4 text-success-500" />
      case 'failed':
      case 'undelivered':
        return <AlertCircle className="h-4 w-4 text-danger-500" />
      default:
        return <Clock className="h-4 w-4 text-warning-500" />
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in relative">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-secondary-600">Direction:</span>
        <select
          className="rounded border border-secondary-200 bg-white px-3 py-1.5 text-sm"
          value={filterDirection}
          onChange={(e) => setFilterDirection(e.target.value as any)}
        >
          <option value="all">All</option>
          <option value="inbound">Inbound (from riders)</option>
          <option value="outbound">Outbound (to riders)</option>
        </select>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center"><LoadingSpinner /></div>
          ) : filtered.length > 0 ? (
            <table className="w-full text-left text-sm text-secondary-600">
              <thead className="bg-secondary-50 text-xs font-semibold uppercase text-secondary-500">
                <tr>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Direction</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Template (Lang)</th>
                  <th className="px-6 py-4">Preview</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200">
                {filtered.map((msg) => (
                  <tr
                    key={msg.id}
                    className="hover:bg-secondary-50/50 cursor-pointer"
                    onClick={() => setSelectedMsg(msg)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(msg.status)}
                        <span className="capitalize">{msg.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge tone={msg.direction === 'inbound' ? 'primary' : 'neutral'}>
                        {msg.direction}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(msg.sent_at).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 font-medium">{msg.phone}</td>
                    <td className="px-6 py-4">
                      {msg.template ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">{msg.template}</span>
                          <Badge tone="neutral" className="text-[10px] uppercase">{msg.language}</Badge>
                        </div>
                      ) : (
                        <span className="text-secondary-400 italic">Generic</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="line-clamp-1 max-w-xs text-xs">{msg.body}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ChevronRight className="h-4 w-4 text-secondary-400 inline-block" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-secondary-500">No messages found.</div>
          )}
        </div>
      </Card>

      {selectedMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg shadow-xl relative animate-in slide-in-from-bottom-4">
            <button
              className="absolute top-4 right-4 text-secondary-400 hover:text-secondary-600"
              onClick={() => setSelectedMsg(null)}
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-secondary-900">Message Details</h3>
              <p className="text-sm text-secondary-500">
                {selectedMsg.direction === 'inbound' ? 'From: ' : 'To: '}
                {selectedMsg.phone}
              </p>
            </div>
            <div className="bg-secondary-50 rounded-lg p-4 font-mono text-sm text-secondary-800 whitespace-pre-wrap max-h-[60vh] overflow-y-auto">
              {selectedMsg.body}
            </div>

            {selectedMsg.error && (
              <div className="mt-4 p-3 bg-danger-50 text-danger-600 rounded text-sm">
                <strong>Error:</strong> {selectedMsg.error}
              </div>
            )}

            <div className="mt-6 flex justify-between items-center text-xs text-secondary-400">
              <span>Status: <span className="uppercase text-secondary-600 font-medium">{selectedMsg.status}</span></span>
              <span>{new Date(selectedMsg.sent_at).toLocaleString()}</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
