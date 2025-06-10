import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Edit3, Trash2, Camera, Calendar, Heart, Star } from 'lucide-react'
import { supabase, isDemoMode, authHelpers } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import CreateCatProfileModal from '../components/CreateCatProfileModal'
import CatProfileDetailModal from '../components/CatProfileDetailModal'

interface CatProfile {
  id: string
  user_id: string
  name: string
  profile_picture?: string
  date_of_birth?: string
  age?: string
  breed?: string
  sex?: string
  personality?: string
  favourite_person?: string
  favourite_treat?: string
  favourite_toy?: string
  favourite_word?: string
  play_time_preference?: string
  created_at: string
  updated_at: string
  photo_count?: number
  total_reactions?: number
}

// Demo data for when Supabase is not configured
const demoCatProfiles: CatProfile[] = [
  {
    id: '1',
    user_id: 'demo',
    name: 'Whiskers',
    profile_picture: 'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=400',
    age: '3 years',
    breed: 'Orange Tabby',
    sex: 'Male',
    personality: 'Playful and energetic',
    favourite_treat: 'Tuna treats',
    favourite_toy: 'Feather wand',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    photo_count: 5,
    total_reactions: 247
  },
  {
    id: '2',
    user_id: 'demo',
    name: 'Luna',
    profile_picture: 'https://images.pexels.com/photos/416160/pexels-photo-416160.jpeg?auto=compress&cs=tinysrgb&w=400',
    age: '2 years',
    breed: 'Black Shorthair',
    sex: 'Female',
    personality: 'Calm and affectionate',
    favourite_person: 'Mom',
    favourite_treat: 'Salmon',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    photo_count: 3,
    total_reactions: 189
  }
]

export default function CatProfilesPage() {
  const { user, loading: authLoading, error: authError } = useAuth()
  const [catProfiles, setCatProfiles] = useState<CatProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<CatProfile | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Memoize storage info to prevent repeated checks
  const storageInfo = useMemo(() => {
    try {
      return authHelpers.getStorageInfo()
    } catch (error) {
      return { type: 'memory', available: false }
    }
  }, [])

  // Memoize the fetch function to prevent recreation on every render
  const fetchCatProfiles = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setError(null)
      
      if (isDemoMode) {
        setCatProfiles(demoCatProfiles)
        setLoading(false)
        return
      }

      // Use the cat_profiles_with_stats view for better performance
      const { data, error: fetchError } = await supabase
        .from('cat_profiles_with_stats')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('Error fetching cat profiles:', fetchError)
        setError('Failed to load cat profiles')
        setCatProfiles(demoCatProfiles) // Fallback to demo data
      } else {
        setCatProfiles(data || [])
      }
    } catch (error: any) {
      console.error('Error fetching cat profiles:', error)
      setError('Failed to load cat profiles')
      setCatProfiles(demoCatProfiles)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Single useEffect for fetching profiles when user changes
  useEffect(() => {
    if (user && !authLoading) {
      fetchCatProfiles()
    } else if (!authLoading && !user) {
      setLoading(false)
    }
  }, [user, authLoading, fetchCatProfiles])

  // Memoize the delete handler to prevent recreation
  const handleDeleteProfile = useCallback(async (profileId: string) => {
    if (isDemoMode) {
      alert('Demo mode - deletion not available')
      return
    }

    if (!confirm('Are you sure you want to delete this cat profile? This will not delete the photos, but will unlink them from this profile.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('cat_profiles')
        .delete()
        .eq('id', profileId)
        .eq('user_id', user?.id)

      if (error) {
        throw error
      }

      setCatProfiles(prev => prev.filter(profile => profile.id !== profileId))
    } catch (error: any) {
      console.error('Error deleting cat profile:', error)
      alert('Failed to delete cat profile. Please try again.')
    }
  }, [user])

  // Memoize event handlers to prevent recreation
  const handleProfileCreated = useCallback(() => {
    setShowCreateModal(false)
    fetchCatProfiles()
  }, [fetchCatProfiles])

  const handleProfileUpdated = useCallback(() => {
    setShowDetailModal(false)
    setSelectedProfile(null)
    fetchCatProfiles()
  }, [fetchCatProfiles])

  const handleProfileSelect = useCallback((profile: CatProfile) => {
    setSelectedProfile(profile)
    setShowDetailModal(true)
  }, [])

  const handleCloseDetailModal = useCallback(() => {
    setShowDetailModal(false)
    setSelectedProfile(null)
  }, [])

  // Show loading state while auth is loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 pb-20 md:pb-0 md:pl-64">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">
              {authLoading ? 'Authenticating...' : 'Loading cat profiles...'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show auth error if present
  if (authError && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 pb-20 md:pb-0 md:pl-64">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Authentication Required</h2>
            <p className="text-gray-600 mb-4">{authError}</p>
            <button
              onClick={() => window.location.href = '/auth'}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 pb-20 md:pb-0 md:pl-64">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cat Profiles</h1>
            <p className="text-gray-600">Create detailed profiles for your cats and track their photos</p>
            
            {/* Demo Mode Indicator */}
            {isDemoMode && (
              <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                <p className="text-yellow-800 text-sm">Demo Mode: Showing sample cat profiles</p>
              </div>
            )}
            
            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-orange-100 border border-orange-300 rounded-lg">
                <p className="text-orange-800 text-sm">{error}</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors flex items-center"
            disabled={!user}
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Profile
          </button>
        </div>

        {/* Cat Profiles Grid */}
        {catProfiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {catProfiles.map((profile) => (
              <div key={profile.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                {/* Profile Picture */}
                <div className="relative h-48">
                  {profile.profile_picture ? (
                    <img
                      src={profile.profile_picture}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = 'https://via.placeholder.com/300x200/ff6b35/ffffff?text=' + encodeURIComponent(profile.name)
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-200 to-pink-200 flex items-center justify-center">
                      <Camera className="w-12 h-12 text-orange-400" />
                    </div>
                  )}
                  
                  {/* Action buttons */}
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <button
                      onClick={() => handleProfileSelect(profile)}
                      className="p-2 bg-black bg-opacity-20 rounded-full text-white hover:bg-opacity-30 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProfile(profile.id)}
                      className="p-2 bg-black bg-opacity-20 rounded-full text-white hover:bg-opacity-30 transition-colors"
                      disabled={isDemoMode}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{profile.name}</h3>
                  
                  <div className="space-y-2 mb-4">
                    {profile.age && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        {profile.age}
                      </div>
                    )}
                    {profile.breed && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Breed:</span> {profile.breed}
                      </div>
                    )}
                    {profile.personality && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Personality:</span> {profile.personality}
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center text-sm text-gray-600">
                      <Camera className="w-4 h-4 mr-1" />
                      {profile.photo_count || 0} photos
                    </div>
                    <div className="flex items-center text-sm text-orange-600">
                      <Heart className="w-4 h-4 mr-1" />
                      {profile.total_reactions || 0} reactions
                    </div>
                  </div>

                  {/* View Profile Button */}
                  <button
                    onClick={() => handleProfileSelect(profile)}
                    className="w-full mt-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors font-medium"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Star className="w-12 h-12 text-orange-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Cat Profiles Yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Create detailed profiles for your cats to organize their photos and track their popularity!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors inline-flex items-center"
              disabled={!user}
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Cat Profile
            </button>
          </div>
        )}

        {/* Create Cat Profile Modal */}
        {showCreateModal && (
          <CreateCatProfileModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleProfileCreated}
          />
        )}

        {/* Cat Profile Detail Modal */}
        {showDetailModal && selectedProfile && (
          <CatProfileDetailModal
            profile={selectedProfile}
            onClose={handleCloseDetailModal}
            onSuccess={handleProfileUpdated}
          />
        )}
      </div>
    </div>
  )
}