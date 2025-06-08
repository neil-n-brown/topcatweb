import React, { useState, useEffect } from 'react'
import { Trophy, TrendingUp, Clock } from 'lucide-react'
import { supabase, Cat } from '../lib/supabase'

interface LeaderboardCat extends Cat {
  reaction_count: number
  recent_reactions?: number
}

export default function LeaderboardPage() {
  const [topCats, setTopCats] = useState<LeaderboardCat[]>([])
  const [trendingCats, setTrendingCats] = useState<LeaderboardCat[]>([])
  const [activeTab, setActiveTab] = useState<'top' | 'trending'>('top')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboards()
  }, [])

  const fetchLeaderboards = async () => {
    try {
      // Fetch top cats (all time)
      const { data: topData, error: topError } = await supabase
        .from('cats')
        .select(`
          *,
          user:users(*),
          reactions(count)
        `)
        .order('reactions(count)', { ascending: false })
        .limit(10)

      if (topError) throw topError

      // Fetch trending cats (last 24 hours)
      const twentyFourHoursAgo = new Date()
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

      const { data: trendingData, error: trendingError } = await supabase
        .from('cats')
        .select(`
          *,
          user:users(*),
          reactions!inner(count)
        `)
        .gte('reactions.created_at', twentyFourHoursAgo.toISOString())
        .order('reactions(count)', { ascending: false })
        .limit(10)

      if (trendingError) throw trendingError

      // Process the data to get reaction counts
      const processedTopCats = await Promise.all(
        (topData || []).map(async (cat) => {
          const { count } = await supabase
            .from('reactions')
            .select('*', { count: 'exact', head: true })
            .eq('cat_id', cat.id)

          return { ...cat, reaction_count: count || 0 }
        })
      )

      const processedTrendingCats = await Promise.all(
        (trendingData || []).map(async (cat) => {
          const { count } = await supabase
            .from('reactions')
            .select('*', { count: 'exact', head: true })
            .eq('cat_id', cat.id)
            .gte('created_at', twentyFourHoursAgo.toISOString())

          return { ...cat, reaction_count: count || 0, recent_reactions: count || 0 }
        })
      )

      setTopCats(processedTopCats.sort((a, b) => b.reaction_count - a.reaction_count))
      setTrendingCats(processedTrendingCats.sort((a, b) => (b.recent_reactions || 0) - (a.recent_reactions || 0)))
    } catch (error) {
      console.error('Error fetching leaderboards:', error)
    } finally {
      setLoading(false)
    }
  }

  const LeaderboardCard = ({ cat, rank, showTrending = false }: { 
    cat: LeaderboardCat
    rank: number
    showTrending?: boolean 
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex items-center p-4">
        {/* Rank */}
        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
          {rank <= 3 ? (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
              rank === 1 ? 'bg-yellow-500' : rank === 2 ? 'bg-gray-400' : 'bg-orange-400'
            }`}>
              {rank}
            </div>
          ) : (
            <span className="text-lg font-semibold text-gray-600">#{rank}</span>
          )}
        </div>

        {/* Cat Image */}
        <div className="flex-shrink-0 w-16 h-16 ml-4">
          <img
            src={cat.image_url}
            alt={cat.name}
            className="w-full h-full object-cover rounded-lg"
          />
        </div>

        {/* Cat Info */}
        <div className="flex-1 ml-4 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{cat.name}</h3>
          <p className="text-sm text-gray-600">by @{cat.user?.username}</p>
          <div className="flex items-center mt-1">
            <span className="text-sm font-medium text-orange-600">
              {showTrending ? cat.recent_reactions : cat.reaction_count} reactions
            </span>
            {showTrending && (
              <TrendingUp className="w-4 h-4 ml-1 text-orange-500" />
            )}
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 pb-20 md:pb-0 md:pl-64">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Leaderboard</h1>
          <p className="text-gray-600">Discover the most beloved cats in our community</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-lg p-1 mb-8 shadow-sm">
          <button
            onClick={() => setActiveTab('top')}
            className={`flex-1 flex items-center justify-center py-3 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'top'
                ? 'bg-orange-500 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Trophy className="w-5 h-5 mr-2" />
            Top Cats
          </button>
          <button
            onClick={() => setActiveTab('trending')}
            className={`flex-1 flex items-center justify-center py-3 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'trending'
                ? 'bg-orange-500 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="w-5 h-5 mr-2" />
            Trending
          </button>
        </div>

        {/* Leaderboard Content */}
        <div className="space-y-4">
          {activeTab === 'top' ? (
            topCats.length > 0 ? (
              topCats.map((cat, index) => (
                <LeaderboardCard
                  key={cat.id}
                  cat={cat}
                  rank={index + 1}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No cats yet!</h3>
                <p className="text-gray-600">Be the first to upload a cat and start the competition.</p>
              </div>
            )
          ) : (
            trendingCats.length > 0 ? (
              trendingCats.map((cat, index) => (
                <LeaderboardCard
                  key={cat.id}
                  cat={cat}
                  rank={index + 1}
                  showTrending
                />
              ))
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No trending cats!</h3>
                <p className="text-gray-600">Start swiping to see which cats are trending today.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}