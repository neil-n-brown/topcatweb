import React, { useState, useEffect } from 'react'
import { Trophy, TrendingUp, Clock, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase, isDemoMode } from '../lib/supabase'

// Enhanced leaderboard cat interface with profile information
interface LeaderboardCat {
  id: string
  user_id: string
  name: string
  description?: string
  caption?: string
  image_url: string
  upload_date: string
  cat_profile_id?: string
  username: string
  email?: string
  reaction_count: number
  recent_reactions?: number
  cat_profile_name?: string
  cat_profile_id_value?: string
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
    username: 'demo_user',
    reaction_count: 1247,
    cat_profile_name: 'Whiskers',
    cat_profile_id_value: '1'
  },
  {
    id: '2',
    user_id: 'demo',
    name: 'Luna',
    description: 'A beautiful black cat with green eyes',
    image_url: 'https://images.pexels.com/photos/416160/pexels-photo-416160.jpeg?auto=compress&cs=tinysrgb&w=400',
    upload_date: new Date().toISOString(),
    username: 'cat_lover',
    reaction_count: 892,
    cat_profile_name: 'Luna',
    cat_profile_id_value: '2'
  },
  {
    id: '3',
    user_id: 'demo',
    name: 'Mittens',
    description: 'Loves to sleep in sunny spots',
    image_url: 'https://images.pexels.com/photos/1170986/pexels-photo-1170986.jpeg?auto=compress&cs=tinysrgb&w=400',
    upload_date: new Date().toISOString(),
    username: 'kitty_fan',
    reaction_count: 756,
    cat_profile_name: 'Mittens',
    cat_profile_id_value: '3'
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

      // Enhanced query to get cat profile information
      const { data: topData, error: topError } = await supabase
        .from('cats')
        .select(`
          *,
          user:users(username, email),
          cat_profile:cat_profiles(id, name),
          reaction_count:reactions(count)
        `)
        .not('cat_profile_id', 'is', null) // Only show cats with profiles
        .order('reaction_count', { ascending: false })
        .limit(10)

      if (topError) {
        console.error('Error fetching top cats:', topError)
        
        // Fallback to the leaderboard view if the enhanced query fails
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('leaderboard_cats')
          .select('*')
          .order('reaction_count', { ascending: false })
          .limit(10)

        if (fallbackError) {
          throw fallbackError
        }

        setTopCats((fallbackData || []).map(cat => ({
          ...cat,
          cat_profile_name: cat.name,
          cat_profile_id_value: cat.id
        })))
      } else {
        // Process the enhanced data
        const processedTopData = (topData || []).map(cat => ({
          ...cat,
          username: cat.user?.username || 'Unknown',
          email: cat.user?.email,
          reaction_count: cat.reaction_count?.length || 0,
          cat_profile_name: cat.cat_profile?.name || cat.name,
          cat_profile_id_value: cat.cat_profile?.id || cat.cat_profile_id
        }))

        // Sort by reaction count
        processedTopData.sort((a, b) => b.reaction_count - a.reaction_count)
        setTopCats(processedTopData)
      }

      // Get trending cats (last 24 hours)
      const { data: trendingData, error: trendingError } = await supabase
        .from('trending_cats')
        .select('*')
        .order('recent_reaction_count', { ascending: false })
        .limit(10)

      if (trendingError) {
        console.error('Error fetching trending cats:', trendingError)
        // Use top cats as fallback for trending
        const fallbackTrending = topData?.slice(0, 5) || []
        setTrendingCats(fallbackTrending.map(cat => ({
          ...cat,
          username: cat.user?.username || 'Unknown',
          recent_reactions: Math.floor((cat.reaction_count?.length || 0) * 0.3),
          cat_profile_name: cat.cat_profile?.name || cat.name,
          cat_profile_id_value: cat.cat_profile?.id || cat.cat_profile_id
        })))
      } else {
        setTrendingCats((trendingData || []).map(cat => ({
          ...cat,
          recent_reactions: cat.recent_reaction_count,
          cat_profile_name: cat.name,
          cat_profile_id_value: cat.id
        })))
      }

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
            alt={cat.cat_profile_name || cat.name}
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = 'https://via.placeholder.com/64x64/ff6b35/ffffff?text=Cat'
            }}
          />
        </div>

        {/* Cat Info */}
        <div className="flex-1 ml-4 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            {/* Cat Profile Name - Clickable */}
            {cat.cat_profile_id_value && !isDemoMode ? (
              <Link
                to={`/cat-profile/${cat.cat_profile_id_value}`}
                className="text-lg font-semibold text-gray-900 hover:text-orange-600 transition-colors truncate flex items-center"
              >
                {cat.cat_profile_name || cat.name}
                <ExternalLink className="w-3 h-3 ml-1 opacity-60" />
              </Link>
            ) : (
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {cat.cat_profile_name || cat.name}
              </h3>
            )}
          </div>
          
          {/* Owner Name - Clickable */}
          <div className="flex items-center space-x-1 mb-2">
            <span className="text-sm text-gray-500">by</span>
            {!isDemoMode ? (
              <Link
                to={`/user/${cat.user_id}`}
                className="text-sm text-gray-600 hover:text-orange-600 transition-colors flex items-center"
              >
                @{cat.username}
                <ExternalLink className="w-3 h-3 ml-1 opacity-60" />
              </Link>
            ) : (
              <span className="text-sm text-gray-600">@{cat.username}</span>
            )}
          </div>
          
          <div className="flex items-center">
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
          <p className="text-gray-600">Discover the most beloved cat profiles in our community</p>
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
            Top Cat Profiles
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">No cat profiles yet!</h3>
                <p className="text-gray-600 mb-4">Create cat profiles and upload photos to start the competition.</p>
                <Link
                  to="/cat-profiles"
                  className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Create Cat Profile
                </Link>
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
                <p className="text-gray-600 mb-4">Start swiping to see which cat profiles are trending today.</p>
                <Link
                  to="/swipe"
                  className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Start Swiping
                </Link>
              </div>
            )
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">How Rankings Work</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Top Cat Profiles:</strong> Ranked by total reactions across all photos</li>
            <li>• <strong>Trending:</strong> Based on reactions received in the last 24 hours</li>
            <li>• Click on cat profile names to view detailed profiles</li>
            <li>• Click on owner names to view their profile pages</li>
            <li>• Only cats with complete profiles are eligible for rankings</li>
          </ul>
        </div>
      </div>
    </div>
  )
}