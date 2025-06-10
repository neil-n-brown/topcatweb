import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, Heart, Camera, Star, MapPin } from 'lucide-react'
import { supabase, isDemoMode, Cat } from '../lib/supabase'

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
  username?: string
  photo_count?: number
  total_reactions?: number
}

// Demo profile for when Supabase is not configured
const demoProfile: CatProfile = {
  id: '1',
  user_id: 'demo',
  name: 'Whiskers',
  profile_picture: 'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=400',
  age: '3 years',
  breed: 'Orange Tabby',
  sex: 'Male',
  personality: 'Playful and energetic, loves to chase toys and explore new places',
  favourite_person: 'Sarah',
  favourite_treat: 'Tuna treats',
  favourite_toy: 'Feather wand',
  favourite_word: 'Treats',
  play_time_preference: 'Morning and evening',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  username: 'demo_user',
  photo_count: 5,
  total_reactions: 247
}

const demoPhotos: (Cat & { reaction_count: number })[] = [
  {
    id: '1',
    user_id: 'demo',
    name: 'Whiskers',
    description: 'Playing in the garden',
    caption: 'Having fun in the sunny garden! 🌞',
    image_url: 'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=400',
    upload_date: new Date().toISOString(),
    cat_profile_id: '1',
    reaction_count: 89
  },
  {
    id: '2',
    user_id: 'demo',
    name: 'Whiskers',
    description: 'Nap time',
    caption: 'Best nap spot ever',
    image_url: 'https://images.pexels.com/photos/1170986/pexels-photo-1170986.jpeg?auto=compress&cs=tinysrgb&w=400',
    upload_date: new Date().toISOString(),
    cat_profile_id: '1',
    reaction_count: 67
  }
]

export default function CatProfileDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<CatProfile | null>(null)
  const [photos, setPhotos] = useState<(Cat & { reaction_count: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [photosLoading, setPhotosLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchProfile()
      fetchProfilePhotos()
    }
  }, [id])

  const fetchProfile = async () => {
    if (!id) return

    try {
      setError(null)
      
      if (isDemoMode) {
        setProfile(demoProfile)
        setLoading(false)
        return
      }

      // First try the cat_profiles_with_stats view
      const { data, error } = await supabase
        .from('cat_profiles_with_stats')
        .select('*')
        .eq('id', id)
        .maybeSingle() // Use maybeSingle instead of single to avoid error when no rows

      if (error) {
        console.error('Error fetching from cat_profiles_with_stats:', error)
        
        // Fallback to direct cat_profiles query
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('cat_profiles')
          .select(`
            *,
            user:users(username)
          `)
          .eq('id', id)
          .maybeSingle()

        if (fallbackError) {
          throw fallbackError
        }

        if (!fallbackData) {
          setError('Cat profile not found')
          setLoading(false)
          return
        }

        // Calculate stats manually for fallback
        const { count: photoCount } = await supabase
          .from('cats')
          .select('*', { count: 'exact', head: true })
          .eq('cat_profile_id', id)

        const { data: reactionData } = await supabase
          .from('reactions')
          .select('id')
          .in('cat_id', 
            await supabase
              .from('cats')
              .select('id')
              .eq('cat_profile_id', id)
              .then(({ data }) => data?.map(cat => cat.id) || [])
          )

        setProfile({
          ...fallbackData,
          username: fallbackData.user?.username,
          photo_count: photoCount || 0,
          total_reactions: reactionData?.length || 0
        })
      } else {
        if (!data) {
          setError('Cat profile not found')
        } else {
          setProfile(data)
        }
      }
    } catch (error: any) {
      console.error('Error fetching cat profile:', error)
      setError('Failed to load cat profile')
    } finally {
      setLoading(false)
    }
  }

  const fetchProfilePhotos = async () => {
    if (!id) return

    try {
      if (isDemoMode) {
        setPhotos(demoPhotos)
        setPhotosLoading(false)
        return
      }

      // Fetch photos linked to this cat profile with reaction counts
      const { data: catsData, error: catsError } = await supabase
        .from('cats')
        .select('*')
        .eq('cat_profile_id', id)
        .order('upload_date', { ascending: false })

      if (catsError) {
        throw catsError
      }

      // Get reaction counts for each photo
      const photosWithReactions = await Promise.all(
        (catsData || []).map(async (cat) => {
          try {
            const { count } = await supabase
              .from('reactions')
              .select('*', { count: 'exact', head: true })
              .eq('cat_id', cat.id)

            return {
              ...cat,
              reaction_count: count || 0
            }
          } catch (error: any) {
            console.warn('Error fetching reaction count for cat:', cat.id, error)
            return {
              ...cat,
              reaction_count: 0
            }
          }
        })
      )

      setPhotos(photosWithReactions)
    } catch (error: any) {
      console.error('Error fetching profile photos:', error)
      setPhotos([])
    } finally {
      setPhotosLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate)
    const today = new Date()
    const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth())
    
    if (ageInMonths < 12) {
      return `${ageInMonths} month${ageInMonths !== 1 ? 's' : ''} old`
    } else {
      const years = Math.floor(ageInMonths / 12)
      const months = ageInMonths % 12
      if (months === 0) {
        return `${years} year${years !== 1 ? 's' : ''} old`
      } else {
        return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''} old`
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 pb-20 md:pb-0 md:pl-64">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading cat profile...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 pb-20 md:pb-0 md:pl-64">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
            <div className="text-6xl mb-4">😿</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Not Found</h2>
            <p className="text-gray-600 mb-4">{error || 'This cat profile does not exist.'}</p>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/cat-profiles')}
                className="w-full bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Browse Cat Profiles
              </button>
              <button
                onClick={() => navigate(-1)}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 pb-20 md:pb-0 md:pl-64">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header with back button */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors mr-4"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
            <p className="text-gray-600">
              by @{profile.username} • Created {formatDate(profile.created_at)}
            </p>
          </div>
        </div>

        {/* Demo Mode Indicator */}
        {isDemoMode && (
          <div className="mb-6 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
            <p className="text-yellow-800 text-sm">Demo Mode: Showing sample cat profile</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              {/* Profile Picture */}
              <div className="text-center mb-6">
                {profile.profile_picture ? (
                  <img
                    src={profile.profile_picture}
                    alt={profile.name}
                    className="w-32 h-32 object-cover rounded-full mx-auto"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gradient-to-br from-orange-200 to-pink-200 rounded-full flex items-center justify-center mx-auto">
                    <Camera className="w-12 h-12 text-orange-400" />
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{profile.name}</h2>
                {profile.age && (
                  <p className="text-gray-600 mb-1">{profile.age}</p>
                )}
                {profile.date_of_birth && (
                  <p className="text-sm text-gray-500">
                    Born {formatDate(profile.date_of_birth)}
                    {!profile.age && ` (${calculateAge(profile.date_of_birth)})`}
                  </p>
                )}
              </div>

              {/* Details */}
              <div className="space-y-4">
                {profile.breed && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Breed:</span>
                    <span className="text-sm text-gray-600 ml-2">{profile.breed}</span>
                  </div>
                )}
                
                {profile.sex && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Sex:</span>
                    <span className="text-sm text-gray-600 ml-2">{profile.sex}</span>
                  </div>
                )}

                {profile.personality && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Personality:</span>
                    <p className="text-sm text-gray-600 mt-1">{profile.personality}</p>
                  </div>
                )}

                {profile.favourite_person && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Favourite Person:</span>
                    <span className="text-sm text-gray-600 ml-2">{profile.favourite_person}</span>
                  </div>
                )}

                {profile.favourite_treat && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Favourite Treat:</span>
                    <span className="text-sm text-gray-600 ml-2">{profile.favourite_treat}</span>
                  </div>
                )}

                {profile.favourite_toy && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Favourite Toy:</span>
                    <span className="text-sm text-gray-600 ml-2">{profile.favourite_toy}</span>
                  </div>
                )}

                {profile.favourite_word && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Favourite Word:</span>
                    <span className="text-sm text-gray-600 ml-2">{profile.favourite_word}</span>
                  </div>
                )}

                {profile.play_time_preference && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Play Time:</span>
                    <span className="text-sm text-gray-600 ml-2">{profile.play_time_preference}</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="bg-gray-50 rounded-lg p-4 mt-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{profile.photo_count || 0}</div>
                    <div className="text-sm text-gray-600">Photos</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-pink-600">{profile.total_reactions || 0}</div>
                    <div className="text-sm text-gray-600">Reactions</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Photo Gallery */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Photo Gallery</h3>
              
              {photosLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : photos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {photos.map((photo) => (
                    <div key={photo.id} className="group">
                      <div className="relative overflow-hidden rounded-lg">
                        <img
                          src={photo.image_url}
                          alt={photo.caption || photo.description || 'Cat photo'}
                          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-end">
                          <div className="p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Heart className="w-4 h-4 mr-1" />
                                {photo.reaction_count}
                              </div>
                              <p className="text-xs">{formatDate(photo.upload_date)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Caption */}
                      {photo.caption && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">{photo.caption}</p>
                        </div>
                      )}
                      
                      {/* Legacy description fallback */}
                      {!photo.caption && photo.description && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">{photo.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No photos yet</h4>
                  <p className="text-gray-600">This cat profile doesn't have any photos uploaded yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}