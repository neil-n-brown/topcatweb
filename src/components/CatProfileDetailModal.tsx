import React, { useState, useEffect } from 'react'
import { X, Edit3, Save, Camera, Heart, Calendar, MapPin } from 'lucide-react'
import { supabase, Cat, isDemoMode } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

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

interface CatProfileDetailModalProps {
  profile: CatProfile
  onClose: () => void
  onSuccess: () => void
}

// Demo photos for when Supabase is not configured
const demoPhotos: (Cat & { reaction_count: number })[] = [
  {
    id: '1',
    user_id: 'demo',
    name: 'Whiskers',
    description: 'Playing in the garden',
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
    image_url: 'https://images.pexels.com/photos/1170986/pexels-photo-1170986.jpeg?auto=compress&cs=tinysrgb&w=400',
    upload_date: new Date().toISOString(),
    cat_profile_id: '1',
    reaction_count: 67
  }
]

export default function CatProfileDetailModal({ profile, onClose, onSuccess }: CatProfileDetailModalProps) {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [photos, setPhotos] = useState<(Cat & { reaction_count: number })[]>([])
  const [photosLoading, setPhotosLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: profile.name,
    date_of_birth: profile.date_of_birth || '',
    age: profile.age || '',
    breed: profile.breed || '',
    sex: profile.sex || '',
    personality: profile.personality || '',
    favourite_person: profile.favourite_person || '',
    favourite_treat: profile.favourite_treat || '',
    favourite_toy: profile.favourite_toy || '',
    favourite_word: profile.favourite_word || '',
    play_time_preference: profile.play_time_preference || ''
  })
  const [newProfilePicture, setNewProfilePicture] = useState<File | null>(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null)

  useEffect(() => {
    fetchProfilePhotos()
  }, [profile.id])

  const fetchProfilePhotos = async () => {
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
        .eq('cat_profile_id', profile.id)
        .order('upload_date', { ascending: false })

      if (catsError) throw catsError

      // Get reaction counts for each photo
      const photosWithReactions = await Promise.all(
        (catsData || []).map(async (cat) => {
          const { count } = await supabase
            .from('reactions')
            .select('*', { count: 'exact', head: true })
            .eq('cat_id', cat.id)

          return {
            ...cat,
            reaction_count: count || 0
          }
        })
      )

      setPhotos(photosWithReactions)
    } catch (error) {
      console.error('Error fetching profile photos:', error)
      setPhotos(demoPhotos)
    } finally {
      setPhotosLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be smaller than 5MB')
        return
      }

      setNewProfilePicture(file)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfilePicturePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    if (!user || !formData.name.trim()) {
      alert('Please enter a name for your cat')
      return
    }

    if (isDemoMode) {
      alert('Demo mode - editing not available')
      return
    }

    setLoading(true)

    try {
      let profilePictureUrl = profile.profile_picture

      // Upload new profile picture if provided
      if (newProfilePicture) {
        const fileExt = newProfilePicture.name.split('.').pop()
        const fileName = `profile-${user.id}-${Date.now()}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('cat-photos')
          .upload(fileName, newProfilePicture)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('cat-photos')
          .getPublicUrl(fileName)

        profilePictureUrl = publicUrl
      }

      // Update cat profile
      const updateData = {
        name: formData.name.trim(),
        profile_picture: profilePictureUrl,
        date_of_birth: formData.date_of_birth || null,
        age: formData.age.trim() || null,
        breed: formData.breed.trim() || null,
        sex: formData.sex || null,
        personality: formData.personality.trim() || null,
        favourite_person: formData.favourite_person.trim() || null,
        favourite_treat: formData.favourite_treat.trim() || null,
        favourite_toy: formData.favourite_toy.trim() || null,
        favourite_word: formData.favourite_word.trim() || null,
        play_time_preference: formData.play_time_preference.trim() || null
      }

      const { error } = await supabase
        .from('cat_profiles')
        .update(updateData)
        .eq('id', profile.id)
        .eq('user_id', user.id)

      if (error) throw error

      setIsEditing(false)
      setNewProfilePicture(null)
      setProfilePicturePreview(null)
      onSuccess()
    } catch (error) {
      console.error('Error updating cat profile:', error)
      alert('Failed to update cat profile. Please try again.')
    } finally {
      setLoading(false)
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Profile' : profile.name}
          </h2>
          <div className="flex items-center space-x-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Edit3 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Information */}
            <div className="lg:col-span-1">
              {/* Profile Picture */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  {profilePicturePreview || profile.profile_picture ? (
                    <img
                      src={profilePicturePreview || profile.profile_picture}
                      alt={profile.name}
                      className="w-32 h-32 object-cover rounded-full mx-auto"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gradient-to-br from-orange-200 to-pink-200 rounded-full flex items-center justify-center mx-auto">
                      <Camera className="w-12 h-12 text-orange-400" />
                    </div>
                  )}
                  
                  {isEditing && (
                    <div className="absolute bottom-0 right-0">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="profile-picture-edit"
                      />
                      <label
                        htmlFor="profile-picture-edit"
                        className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-600 transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Details */}
              <div className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        maxLength={50}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                      <input
                        type="text"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="e.g., 3 years"
                        maxLength={20}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        name="date_of_birth"
                        value={formData.date_of_birth}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
                      <input
                        type="text"
                        name="breed"
                        value={formData.breed}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        maxLength={50}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                      <select
                        name="sex"
                        value={formData.sex}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Personality</label>
                      <textarea
                        name="personality"
                        value={formData.personality}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                        maxLength={200}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Favourite Person</label>
                      <input
                        type="text"
                        name="favourite_person"
                        value={formData.favourite_person}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        maxLength={50}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Favourite Treat</label>
                      <input
                        type="text"
                        name="favourite_treat"
                        value={formData.favourite_treat}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        maxLength={50}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Favourite Toy</label>
                      <input
                        type="text"
                        name="favourite_toy"
                        value={formData.favourite_toy}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        maxLength={50}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Favourite Word</label>
                      <input
                        type="text"
                        name="favourite_word"
                        value={formData.favourite_word}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        maxLength={50}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Play Time Preference</label>
                      <input
                        type="text"
                        name="play_time_preference"
                        value={formData.play_time_preference}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        maxLength={50}
                      />
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 disabled:bg-gray-300 transition-colors flex items-center justify-center"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false)
                          setNewProfilePicture(null)
                          setProfilePicturePreview(null)
                          setFormData({
                            name: profile.name,
                            date_of_birth: profile.date_of_birth || '',
                            age: profile.age || '',
                            breed: profile.breed || '',
                            sex: profile.sex || '',
                            personality: profile.personality || '',
                            favourite_person: profile.favourite_person || '',
                            favourite_treat: profile.favourite_treat || '',
                            favourite_toy: profile.favourite_toy || '',
                            favourite_word: profile.favourite_word || '',
                            play_time_preference: profile.play_time_preference || ''
                          })
                        }}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{profile.name}</h3>
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

                    <div className="space-y-3">
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
                  </>
                )}
              </div>
            </div>

            {/* Photo Gallery */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Photo Gallery</h3>
              
              {photosLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.image_url}
                        alt={photo.description || 'Cat photo'}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                        <div className="text-white text-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center justify-center mb-1">
                            <Heart className="w-4 h-4 mr-1" />
                            {photo.reaction_count}
                          </div>
                          <p className="text-xs">{formatDate(photo.upload_date)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Camera className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No photos yet</h4>
                  <p className="text-gray-600">Upload photos and link them to this profile to see them here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}