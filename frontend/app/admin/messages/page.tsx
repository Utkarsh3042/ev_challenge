'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { WhatsAppMessage } from '../../../lib/types'
import { Card } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { LoadingSpinner } from '../../../components/common/LoadingSpinner'
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react'

export default function MessagesPage() {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.listMessages()
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

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
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center"><LoadingSpinner /></div>
          ) : messages.length > 0 ? (
            <table className="w-full text-left text-sm text-secondary-600">
              <thead className="bg-secondary-50 text-xs font-semibold uppercase text-secondary-500">
                <tr>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Template (Lang)</th>
                  <th className="px-6 py-4">Message Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200">
                {messages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-secondary-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(msg.status)}
                        <span className="capitalize">{msg.status}</span>
                      </div>
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
                      <p className="line-clamp-2 max-w-md text-xs">{msg.body}</p>
                      {msg.error && (
                        <p className="mt-1 text-xs text-danger-500">Error: {msg.error}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-secondary-500">No messages logged yet.</div>
          )}
        </div>
      </Card>
    </div>
  )
}
