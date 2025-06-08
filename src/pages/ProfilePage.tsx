import React, { useState, useEffect } from 'react'
import { Camera, Edit3, Heart, TrendingUp, Upload } from 'lucide-react'
import { supabase, Cat } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface UserStats {
  totalCats: number
  totalReactions: number
  mostPopularCat?: Cat & { reaction_count: number }
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [userCats, setUserCats] = useState<Cat[]>([])
  const [stats, setStats] = useState<UserStats>({ totalCats: 0, totalReactions: 0 })
  const [loading, setLoading] = useState(true)
  const [editingProfile, setEditingProfile] = useState(false)
  const [newUsername, setNewUsername] = useState(user?.username || '')

  useEffect(() => {
    if (user) {
      fetchUserData()
    }
  }, [user])

  const fetchUserData = async () => {
    if (!user) return

    try {
      // Fetch user's cats
      const { data: catsData, error: catsError } = await supabase
        .from('cats')
        .select('*')
        .eq('user_id', user.id)
        .order('upload_date', { ascending: false })

      if (catsError) throw catsError

      setUserCats(catsData || [])

      // Calculate stats
      let totalReactions = 0
      let mostPopularCat: (Cat & { reaction_count: number }) | undefined

      for (const cat of catsData || []) {
        const { count } = await supabase
          .from('reactions')
          .select('*', { count: 'exact', head: true })
          .eq('cat_id', cat.id)

        const reactionCount = count || 0
        totalReactions += reactionCount

        if (!mostPopularCat || reactionCount > mostPopularCat.reaction_count) {
          mostPopularCat = { ...cat, reaction_count: reactionCount }
        }
      }

      setStats({
        totalCats: catsData?.length || 0,
        totalReactions,
        mostPopularCat,
      })
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!user || !newUsername.trim()) return

    try {
      const { error } = await supabase
        .from('users')
        .update({ username: newUsername.trim() })
        .eq('id', user.id)

      if (error) throw error

      setEditingProfile(false)
      // Refresh the page to get updated user data
      window.location.reload()
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    }
  }

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
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center space-x-6">
            {/* Profile Picture */}
            <div className="w-24 h-24 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold text-white">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              {editingProfile ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="text-2xl font-bold bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 w-full max-w-xs"
                    placeholder="Username"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleUpdateProfile}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingProfile(false)
                        setNewUsername(user?.username || '')
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center space-x-3">
                    <h1 className="text-2xl font-bold text-gray-900">@{user?.username}</h1>
                    <button
                      onClick={() => setEditingProfile(true)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-gray-600">{user?.email}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Member since {new Date(user?.created_at || '').toLocaleDateString()}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Camera className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalCats}</p>
                <p className="text-gray-600">Cats Uploaded</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-pink-100 rounded-lg">
                <Heart className="w-6 h-6 text-pink-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalReactions}</p>
                <p className="text-gray-600">Total Reactions</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {stats.mostPopularCat?.reaction_count || 0}
                </p>
                <p className="text-gray-600">Best Performance</p>
              </div>
            </div>
          </div>
        </div>

        {/* Most Popular Cat */}
        {stats.mostPopularCat && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🏆 Your Most Popular Cat</h2>
            <div className="flex items-center space-x-4">
              <img
                src={stats.mostPopularCat.image_url}
                alt={stats.mostPopularCat.name}
                className="w-20 h-20 object-cover rounded-lg"
              />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{stats.mostPopularCat.name}</h3>
                <p className="text-orange-600 font-medium">
                  {stats.mostPopularCat.reaction_count} reactions
                </p>
                {stats.mostPopularCat.description && (
                  <p className="text-gray-600 text-sm mt-1">{stats.mostPopularCat.description}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* User's Cats */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Your Cats</h2>
            <span className="text-gray-600">{userCats.length} cats</span>
          </div>

          {userCats.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {userCats.map((cat) => (
                <div key={cat.id} className="group relative">
                  <img
                    src={cat.image_url}
                    alt={cat.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                    <div className="text-white text-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="font-semibold">{cat.name}</p>
                      <p className="text-sm">
                        {new Date(cat.upload_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Upload className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No cats uploaded yet</h3>
              <p className="text-gray-600 mb-4">Share your first cat with the community!</p>
              <a
                href="/upload"
                className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Your First Cat
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}