import React, { useState, useEffect } from 'react'
import { Trophy, TrendingUp, Clock } from 'lucide-react'
import { supabase, Cat, isDemoMode } from '../lib/supabase'

interface LeaderboardCat extends Cat {
  reaction_count: number
  recent_reactions?: number
}

// Demo data for when Supabase is not configured
const demoCats: LeaderboardCat[] = [
  {
    id: '1',
    user_id: 'demo',
    name: 'Whiskers',
    description: 'A fluffy orange tabby who loves to play',
    image_url: 'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=400',
    upload_date: new Date().toISOString(),
    user: { id: 'demo', email: 'demo@example.com', username: 'demo_user', created_at: new Date().toISOString() },
    reaction_count: 1247
  },
  {
    id: '2',
    user_id: 'demo',
    name: 'Luna',
    description: 'A beautiful black cat with green eyes',
    image_url: 'https://images.pexels.com/photos/416160/pexels-photo-416160.jpeg?auto=compress&cs=tinysrgb&w=400',
    upload_date: new Date().toISOString(),
    user: { id: 'demo', email: 'demo@example.com', username: 'cat_lover', created_at: new Date().toISOString() },
    reaction_count: 892
  },
  {
    id: '3',
    user_id: 'demo',
    name: 'Mittens',
    description: 'Loves to sleep in sunny spots',
    image_url: 'https://images.pexels.com/photos/1170986/pexels-photo-1170986.jpeg?auto=compress&cs=tinysrgb&w=400',
    upload_date: new Date().toISOString(),
    user: { id: 'demo', email: 'demo@example.com', username: 'kitty_fan', created_at: new Date().toISOString() },
    reaction_count: 756
  }
]

export default function LeaderboardPage() {
  const [topCats, setTopCats] = useState<LeaderboardCat[]>([])
  const [trendingCats, setTrendingCats] = useState<LeaderboardCat[]>([])
  const [activeTab, setActiveTab] = useState<'top' | 'trending'>('top')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLeaderboards()
  }, [])

  const fetchLeaderboards = async () => {
    try {
      setError(null)

      if (isDemoMode) {
        // Use demo data when Supabase is not configured
        setTopCats(demoCats)
        setTrendingCats(demoCats.map(cat => ({ ...cat, recent_reactions: Math.floor(cat.reaction_count * 0.3) })))
        setLoading(false)
        return
      }

      // Use the new leaderboard view for better performance and reliability
      const { data: topData, error: topError } = await supabase
        .from('leaderboard_cats')
        .select('*')
        .order('reaction_count', { ascending: false })
        .limit(10)

      if (topError) {
        console.error('Error fetching top cats:', topError)
        throw topError
      }

      // Use the trending view for recent reactions
      const { data: trendingData, error: trendingError } = await supabase
        .from('trending_cats')
        .select('*')
        .order('recent_reaction_count', { ascending: false })
        .limit(10)

      if (trendingError) {
        console.error('Error fetching trending cats:', trendingError)
        // If trending view fails, fall back to regular query
        const fallbackData = topData?.slice(0, 5) || []
        setTrendingCats(fallbackData.map(cat => ({
          ...cat,
          user: { id: cat.user_id, email: cat.email || '', username: cat.username || 'Unknown', created_at: '' },
          recent_reactions: Math.floor(cat.reaction_count * 0.3)
        })))
      } else {
        setTrendingCats((trendingData || []).map(cat => ({
          ...cat,
          user: { id: cat.user_id, email: cat.email || '', username: cat.username || 'Unknown', created_at: '' },
          recent_reactions: cat.recent_reaction_count
        })))
      }

      // Process top cats data
      setTopCats((topData || []).map(cat => ({
        ...cat,
        user: { id: cat.user_id, email: cat.email || '', username: cat.username || 'Unknown', created_at: '' }
      })))

    } catch (error: any) {
      console.error('Error fetching leaderboards:', error)
      setError(error.message || 'Failed to load leaderboards')
      
      // Fallback to demo data on error
      setTopCats(demoCats)
      setTrendingCats(demoCats.map(cat => ({ ...cat, recent_reactions: Math.floor(cat.reaction_count * 0.3) })))
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
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = 'https://via.placeholder.com/64x64/ff6b35/ffffff?text=Cat'
            }}
          />
        </div>

        {/* Cat Info */}
        <div className="flex-1 ml-4 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{cat.name}</h3>
          <p className="text-sm text-gray-600">by @{cat.user?.username || 'Unknown'}</p>
          <div className="flex items-center mt-1">
            <span className="text-sm font-medium text-orange-600">
              {showTrending ? (cat.recent_reactions || 0) : cat.reaction_count} reactions
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 pb-20 md:pb-0 md:pl-64">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading leaderboards...</p>
          </div>
        </div>
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
          {isDemoMode && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
              <p className="text-yellow-800 text-sm">Demo Mode: Showing sample leaderboard data</p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && !isDemoMode && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-red-800">Error loading leaderboards: {error}</p>
            <button 
              onClick={fetchLeaderboards}
              className="mt-2 text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

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