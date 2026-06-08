'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { LeaderboardEntry } from '../../../lib/types'
import { Card } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { LoadingSpinner } from '../../../components/common/LoadingSpinner'
import { Trophy, Medal, Award } from 'lucide-react'

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getLeaderboard()
      .then(setLeaders)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />
    if (rank === 3) return <Award className="h-6 w-6 text-amber-600" />
    return <span className="text-lg font-bold text-secondary-400">#{rank}</span>
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center"><LoadingSpinner /></div>
          ) : (
            <table className="w-full text-left text-sm text-secondary-600">
              <thead className="bg-secondary-50 text-xs font-semibold uppercase text-secondary-500">
                <tr>
                  <th className="px-6 py-4 w-20 text-center">Rank</th>
                  <th className="px-6 py-4">Rider</th>
                  <th className="px-6 py-4 text-center">Referrals</th>
                  <th className="px-6 py-4 text-right">Points</th>
                  <th className="px-6 py-4">Milestones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200">
                {leaders.map((leader) => (
                  <tr key={leader.rider_id} className={`hover:bg-secondary-50/50 ${leader.rank <= 3 ? 'bg-primary-50/10' : ''}`}>
                    <td className="px-6 py-4 text-center flex justify-center">
                      {getRankIcon(leader.rank)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-secondary-900">{leader.full_name}</div>
                      <div className="text-xs text-secondary-500">{leader.city}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-secondary-100 font-bold text-secondary-900">
                        {leader.referral_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-primary-600 text-lg">
                      {leader.points}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {leader.milestones_reached.map((m) => (
                          <Badge key={m} tone="success" className="text-xs">
                            {m.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}
