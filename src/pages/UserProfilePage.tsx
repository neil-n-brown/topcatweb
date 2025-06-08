import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, Heart, Star, Calendar } from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'

interface UserProfile {
  id: string
  email: string
  username: string
  profile_pic?: string
  created_at: string
}

interface UserStats {
  totalCatProfiles: number
  totalPhotos: number
  totalReactions: number
}

interface CatProfile {
  id: string
  name: string
  profile_picture?: string
  photo_count: number
  total_reactions: number
}

// Demo data for when Supabase is not configured
const demoUser: UserProfile = {
  id: 'demo',
  email: 'demo@topcat.com',
  username: 'demo_user',
  created_at: new Date().toISOString()
}

const demoStats: UserStats = {
  totalCatProfiles: 2,
  totalPhotos: 8,
  totalReactions: 156
}

const demoCatProfiles: CatProfile[] = [
  {
    id: '1',
    name: 'Whiskers',
    profile_picture: 'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=200',
    photo_count: 5,
    total_reactions: 89
  },
  {
    id: '2',
    name: 'Luna',
    profile_picture: 'https://images.pexels.com/photos/416160/pexels-photo-416160.jpeg?auto=compress&cs=tinysrgb&w=200',
    photo_count: 3,
    total_reactions: 67
  }
]

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats>({ totalCatProfiles: 0, totalPhotos: 0, totalReactions: 0 })
  const [catProfiles, setCatProfiles] = useState<CatProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchUserProfile()
    }
  }, [id])

  const fetchUserProfile = async () => {
    if (!id) return

    try {
      setError(null)
      
      if (isDemoMode) {
        setUser(demoUser)
        setStats(demoStats)
        setCatProfiles(demoCatProfiles)
        setLoading(false)
        return
      }

      // Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()

      if (userError) {
        if (userError.code === 'PGRST116') {
          setError('User not found')
        } else {
          throw userError
        }
        return
      }

      setUser(userData)

      // Fetch user's cat profiles with stats
      const { data: profilesData, error: profilesError } = await supabase
        .from('cat_profiles_with_stats')
        .select('*')
        .eq('user_id', id)
        .order('total_reactions', { ascending: false })

      if (profilesError) {
        console.error('Error fetching cat profiles:', profilesError)
        setCatProfiles([])
      } else {
        setCatProfiles(profilesData || [])
      }

      // Calculate stats
      const totalCatProfiles = profilesData?.length || 0
      const totalPhotos = profilesData?.reduce((sum, profile) => sum + (profile.photo_count || 0), 0) || 0
      const totalReactions = profilesData?.reduce((sum, profile) => sum + (profile.total_reactions || 0), 0) || 0

      setStats({
        totalCatProfiles,
        totalPhotos,
        totalReactions
      })

    } catch (error: any) {
      console.error('Error fetching user profile:', error)
      setError('Failed to load user profile')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 pb-20 md:pb-0 md:pl-64">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading user profile...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 pb-20 md:pb-0 md:pl-64">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">User Not Found</h2>
            <p className="text-gray-600 mb-4">{error || 'This user profile does not exist.'}</p>
            <button
              onClick={() => navigate('/leaderboard')}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Back to Leaderboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 pb-20 md:pb-0 md:pl-64">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header with back button */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors mr-4"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">@{user.username}</h1>
            <p className="text-gray-600">Member since {formatDate(user.created_at)}</p>
          </div>
        </div>

        {/* Demo Mode Indicator */}
        {isDemoMode && (
          <div className="mb-6 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
            <p className="text-yellow-800 text-sm">Demo Mode: Showing sample user profile</p>
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center space-x-6">
            {/* Profile Picture */}
            <div className="w-24 h-24 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full flex items-center justify-center">
              {user.profile_pic ? (
                <img
                  src={user.profile_pic}
                  alt={user.username}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">@{user.username}</h2>
              <p className="text-gray-600 mb-3">{user.email}</p>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-1" />
                Joined {formatDate(user.created_at)}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Star className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalCatProfiles}</p>
                <p className="text-gray-600">Cat Profiles</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Camera className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalPhotos}</p>
                <p className="text-gray-600">Photos Uploaded</p>
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
        </div>

        {/* Cat Profiles */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Cat Profiles</h3>
          
          {catProfiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {catProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/cat-profile/${profile.id}`)}
                >
                  <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      {/* Profile Picture */}
                      <div className="w-16 h-16 flex-shrink-0">
                        {profile.profile_picture ? (
                          <img
                            src={profile.profile_picture}
                            alt={profile.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-orange-200 to-pink-200 rounded-lg flex items-center justify-center">
                            <Camera className="w-6 h-6 text-orange-400" />
                          </div>
                        )}
                      </div>

                      {/* Profile Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                          {profile.name}
                        </h4>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Camera className="w-3 h-3 mr-1" />
                            {profile.photo_count}
                          </div>
                          <div className="flex items-center text-sm text-orange-600">
                            <Heart className="w-3 h-3 mr-1" />
                            {profile.total_reactions}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Cat Profiles</h4>
              <p className="text-gray-600">This user hasn't created any cat profiles yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}