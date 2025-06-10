import React, { useState, useEffect } from 'react'
import { Trophy, TrendingUp, Clock, ExternalLink, Crown, Star } from 'lucide-react'
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
    <div className="card-cute overflow-hidden hover:scale-[1.02] transition-all duration-300">
      <div className="flex items-center p-6">
        {/* Rank */}
        <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center mr-4">
          {rank <= 3 ? (
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${
              rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 
              rank === 2 ? 'bg-gradient-to-r from-gray-300 to-gray-400' : 
              'bg-gradient-to-r from-orange-400 to-orange-500'
            }`}>
              {rank === 1 ? '👑' : rank}
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 flex items-center justify-center">
              <span className="text-lg font-bold text-cute-primary">#{rank}</span>
            </div>
          )}
        </div>

        {/* Cat Image */}
        <div className="flex-shrink-0 w-20 h-20 ml-2 mr-4">
          <img
            src={cat.image_url}
            alt={cat.cat_profile_name || cat.name}
            className="w-full h-full object-cover rounded-2xl border-2 border-white shadow-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = 'https://via.placeholder.com/80x80/ff6b35/ffffff?text=😸'
            }}
          />
        </div>

        {/* Cat Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            {/* Cat Profile Name - Clickable */}
            {cat.cat_profile_id_value && !isDemoMode ? (
              <Link
                to={`/cat-profile/${cat.cat_profile_id_value}`}
                className="text-lg font-bold text-cute-primary hover:text-pink-600 transition-colors truncate flex items-center group"
              >
                <span className="mr-1">😻</span>
                {cat.cat_profile_name || cat.name}
                <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-60 transition-opacity" />
              </Link>
            ) : (
              <h3 className="text-lg font-bold text-cute-primary truncate flex items-center">
                <span className="mr-1">😻</span>
                {cat.cat_profile_name || cat.name}
              </h3>
            )}
            
            {rank <= 3 && (
              <div className="text-xl">
                {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
              </div>
            )}
          </div>
          
          {/* Owner Name - Clickable */}
          <div className="flex items-center space-x-1 mb-3">
            <span className="text-sm text-cute-secondary">by</span>
            {!isDemoMode ? (
              <Link
                to={`/user/${cat.user_id}`}
                className="text-sm text-cute-secondary hover:text-pink-600 transition-colors flex items-center group"
              >
                <span className="mr-1">👤</span>
                @{cat.username}
                <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-60 transition-opacity" />
              </Link>
            ) : (
              <span className="text-sm text-cute-secondary flex items-center">
                <span className="mr-1">👤</span>
                @{cat.username}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <span className="text-lg">💕</span>
              <span className="text-sm font-bold text-pink-600">
                {showTrending ? (cat.recent_reactions || 0) : cat.reaction_count} reactions
              </span>
            </div>
            {showTrending && (
              <div className="flex items-center space-x-1 text-orange-500">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium">Trending!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-cute-gradient pb-20 md:pb-0 md:pl-72">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4 loading-paw">🏆</div>
            <div className="text-lg text-cute-primary font-medium">Loading leaderboards...</div>
            <div className="text-sm text-cute-secondary mt-2">Finding the top cats! 😻</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cute-gradient pb-20 md:pb-0 md:pl-72">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 float-animation">🏆</div>
          <h1 className="text-4xl font-bold text-cute-primary mb-2">Leaderboard</h1>
          <p className="text-cute-secondary font-medium">Discover the most beloved cat profiles in our community 💕</p>
          {isDemoMode && (
            <div className="mt-4 alert-cute-warning">
              <div className="flex items-center justify-center">
                <span className="text-2xl mr-2">🎮</span>
                <p className="font-medium">Demo Mode: Showing sample leaderboard data</p>
                <span className="text-2xl ml-2">😸</span>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && !isDemoMode && (
          <div className="mb-6 alert-cute-error">
            <div className="flex items-center">
              <span className="text-xl mr-2">⚠️</span>
              <div className="flex-1">
                <p className="font-medium">Error loading leaderboards: {error}</p>
                <button 
                  onClick={fetchLeaderboards}
                  className="mt-2 text-red-600 hover:text-red-800 underline font-medium"
                >
                  Try again 🔄
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="card-cute p-2 mb-8">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveTab('top')}
              className={`flex items-center justify-center py-4 px-6 rounded-2xl font-medium transition-all duration-300 ${
                activeTab === 'top'
                  ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-lg scale-105'
                  : 'text-cute-secondary hover:text-cute-primary hover:bg-pink-50'
              }`}
            >
              <Trophy className="w-5 h-5 mr-2" />
              <span>Top Cat Profiles</span>
              <span className="text-xl ml-2">👑</span>
            </button>
            <button
              onClick={() => setActiveTab('trending')}
              className={`flex items-center justify-center py-4 px-6 rounded-2xl font-medium transition-all duration-300 ${
                activeTab === 'trending'
                  ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-lg scale-105'
                  : 'text-cute-secondary hover:text-cute-primary hover:bg-pink-50'
              }`}
            >
              <Clock className="w-5 h-5 mr-2" />
              <span>Trending</span>
              <span className="text-xl ml-2">🔥</span>
            </button>
          </div>
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
              <div className="text-center py-16">
                <div className="card-cute p-8 max-w-md mx-auto">
                  <div className="text-6xl mb-4">😿</div>
                  <h3 className="text-xl font-bold text-cute-primary mb-4">No cat profiles yet!</h3>
                  <p className="text-cute-secondary mb-6 leading-relaxed">
                    Create cat profiles and upload photos to start the competition. 🏁
                  </p>
                  <Link
                    to="/cat-profiles"
                    className="btn-cute inline-flex items-center space-x-2"
                  >
                    <Star className="w-4 h-4" />
                    <span>Create Cat Profile</span>
                    <span className="text-lg">😸</span>
                  </Link>
                </div>
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
              <div className="text-center py-16">
                <div className="card-cute p-8 max-w-md mx-auto">
                  <div className="text-6xl mb-4">📈</div>
                  <h3 className="text-xl font-bold text-cute-primary mb-4">No trending cats!</h3>
                  <p className="text-cute-secondary mb-6 leading-relaxed">
                    Start swiping to see which cat profiles are trending today. 🔥
                  </p>
                  <Link
                    to="/swipe"
                    className="btn-cute inline-flex items-center space-x-2"
                  >
                    <span>Start Swiping</span>
                    <span className="text-lg">😻</span>
                  </Link>
                </div>
              </div>
            )
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 card-cute p-6 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">💡</span>
            <h3 className="font-bold text-cute-primary">How Rankings Work</h3>
          </div>
          <ul className="text-sm text-cute-secondary space-y-2 leading-relaxed">
            <li className="flex items-center">
              <span className="mr-2">🏆</span>
              <strong>Top Cat Profiles:</strong> Ranked by total reactions across all photos
            </li>
            <li className="flex items-center">
              <span className="mr-2">🔥</span>
              <strong>Trending:</strong> Based on reactions received in the last 24 hours
            </li>
            <li className="flex items-center">
              <span className="mr-2">👆</span>
              Click on cat profile names to view detailed profiles
            </li>
            <li className="flex items-center">
              <span className="mr-2">👤</span>
              Click on owner names to view their profile pages
            </li>
            <li className="flex items-center">
              <span className="mr-2">⭐</span>
              Only cats with complete profiles are eligible for rankings
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}