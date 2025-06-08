import React, { useState, useEffect } from 'react'
import { Upload, Camera, X, Star, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase, isDemoMode } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface CatProfile {
  id: string
  name: string
  profile_picture?: string
  breed?: string
  age?: string
}

export default function UploadPage() {
  const { user } = useAuth()
  const [caption, setCaption] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  // Cat profile selection (now required)
  const [catProfiles, setCatProfiles] = useState<CatProfile[]>([])
  const [selectedProfileId, setSelectedProfileId] = useState<string>('')
  const [profilesLoading, setProfilesLoading] = useState(true)
  const [profilesError, setProfilesError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchCatProfiles()
    }
  }, [user])

  const fetchCatProfiles = async () => {
    if (!user) return

    try {
      setProfilesError(null)
      
      if (isDemoMode) {
        setCatProfiles([
          { 
            id: '1', 
            name: 'Whiskers', 
            profile_picture: 'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=100',
            breed: 'Orange Tabby',
            age: '3 years'
          },
          { 
            id: '2', 
            name: 'Luna', 
            profile_picture: 'https://images.pexels.com/photos/416160/pexels-photo-416160.jpeg?auto=compress&cs=tinysrgb&w=100',
            breed: 'Black Shorthair',
            age: '2 years'
          }
        ])
        setProfilesLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('cat_profiles')
        .select('id, name, profile_picture, breed, age')
        .eq('user_id', user.id)
        .order('name')

      if (error) throw error

      setCatProfiles(data || [])
    } catch (error: any) {
      console.error('Error fetching cat profiles:', error)
      setProfilesError('Failed to load cat profiles')
      setCatProfiles([])
    } finally {
      setProfilesLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be smaller than 5MB')
        return
      }

      setImage(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !image || !selectedProfileId) {
      alert('Please select a cat profile and upload an image')
      return
    }

    if (isDemoMode) {
      alert('Demo mode - upload not available. Connect to Supabase to enable uploads!')
      return
    }

    // Basic profanity filter for caption
    const profanityWords = ['bad', 'inappropriate', 'offensive'] // Add more as needed
    const containsProfanity = profanityWords.some(word => 
      caption.toLowerCase().includes(word)
    )

    if (containsProfanity) {
      alert('Please use appropriate language in your photo caption')
      return
    }

    setUploading(true)

    try {
      // Upload image to Supabase Storage
      const fileExt = image.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('cat-photos')
        .upload(fileName, image)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('cat-photos')
        .getPublicUrl(fileName)

      // Get cat profile name for the cats table
      const selectedProfile = catProfiles.find(p => p.id === selectedProfileId)
      if (!selectedProfile) {
        throw new Error('Selected cat profile not found')
      }

      // Save cat data to database with required profile linking
      const catData = {
        user_id: user.id,
        name: selectedProfile.name, // Use cat profile name
        description: null, // Legacy field, keeping null
        caption: caption.trim() || null, // New caption field
        image_url: publicUrl,
        cat_profile_id: selectedProfileId // Required link to cat profile
      }

      const { error: dbError } = await supabase
        .from('cats')
        .insert([catData])

      if (dbError) throw dbError

      setSuccess(true)
      setCaption('')
      setImage(null)
      setImagePreview(null)
      setSelectedProfileId('')

      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (error: any) {
      console.error('Error uploading cat photo:', error)
      alert('Failed to upload photo. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const selectedProfile = catProfiles.find(p => p.id === selectedProfileId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 pb-20 md:pb-0 md:pl-64">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Cat Photo</h1>
          <p className="text-gray-600">Add a new photo to one of your cat profiles</p>
          {isDemoMode && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
              <p className="text-yellow-800 text-sm">Demo Mode: Upload functionality requires Supabase configuration</p>
            </div>
          )}
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">
            🎉 Your photo has been uploaded successfully! It will appear in the swipe feed soon.
          </div>
        )}

        {/* No Cat Profiles Warning */}
        {!profilesLoading && catProfiles.length === 0 && !profilesError && (
          <div className="bg-orange-100 border border-orange-300 rounded-lg p-6 mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 text-orange-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-orange-900 mb-2">
                  Create a Cat Profile First
                </h3>
                <p className="text-orange-800 mb-4">
                  You need to create at least one cat profile before you can upload photos. 
                  Cat profiles help organize your photos and provide detailed information about your cats.
                </p>
                <Link
                  to="/cat-profiles"
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Create Cat Profile
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Profiles Error */}
        {profilesError && (
          <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800">{profilesError}</span>
              <button
                onClick={fetchCatProfiles}
                className="ml-auto text-red-600 hover:text-red-800 underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Upload Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cat Profile Selection - Required */}
            <div>
              <label htmlFor="cat-profile" className="block text-sm font-medium text-gray-700 mb-2">
                Select Cat Profile *
              </label>
              
              {profilesLoading ? (
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-2"></div>
                  Loading cat profiles...
                </div>
              ) : catProfiles.length > 0 ? (
                <>
                  <select
                    id="cat-profile"
                    value={selectedProfileId}
                    onChange={(e) => setSelectedProfileId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                    disabled={isDemoMode}
                  >
                    <option value="">Choose a cat profile...</option>
                    {catProfiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name} {profile.breed && `(${profile.breed})`} {profile.age && `- ${profile.age}`}
                      </option>
                    ))}
                  </select>
                  
                  {/* Selected Profile Preview */}
                  {selectedProfile && (
                    <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center">
                        {selectedProfile.profile_picture && (
                          <img
                            src={selectedProfile.profile_picture}
                            alt={selectedProfile.name}
                            className="w-10 h-10 object-cover rounded-full mr-3"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{selectedProfile.name}</p>
                          {(selectedProfile.breed || selectedProfile.age) && (
                            <p className="text-sm text-gray-600">
                              {selectedProfile.breed} {selectedProfile.age && `• ${selectedProfile.age}`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                  No cat profiles available. Create one first to upload photos.
                </div>
              )}
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo *
              </label>
              
              {!imagePreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                    disabled={isDemoMode || catProfiles.length === 0}
                  />
                  <label
                    htmlFor="image-upload"
                    className={`cursor-pointer flex flex-col items-center ${
                      isDemoMode || catProfiles.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Camera className="w-12 h-12 text-gray-400 mb-4" />
                    <span className="text-lg font-medium text-gray-900 mb-2">
                      {isDemoMode ? 'Demo Mode - Upload Disabled' : 
                       catProfiles.length === 0 ? 'Create a cat profile first' : 
                       'Choose a photo'}
                    </span>
                    <span className="text-sm text-gray-600">
                      PNG, JPG up to 5MB
                    </span>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Photo Caption */}
            <div>
              <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-2">
                Photo Caption (Optional)
              </label>
              <textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                placeholder="Add a caption for this photo..."
                maxLength={125}
                disabled={isDemoMode}
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-sm text-gray-500">
                  Describe what's happening in this photo
                </p>
                <p className={`text-sm ${caption.length > 100 ? 'text-orange-600' : 'text-gray-500'}`}>
                  {caption.length}/125
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading || !image || !selectedProfileId || isDemoMode || catProfiles.length === 0}
              className="w-full bg-orange-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : isDemoMode ? (
                'Demo Mode - Upload Disabled'
              ) : catProfiles.length === 0 ? (
                'Create a Cat Profile First'
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Photo
                </>
              )}
            </button>
          </form>
        </div>

        {/* Guidelines */}
        <div className="mt-8 bg-blue-50 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Upload Guidelines</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Select one of your existing cat profiles to link this photo</li>
            <li>• Use clear, high-quality photos of your cats</li>
            <li>• Keep captions family-friendly and descriptive</li>
            <li>• Only upload photos you own or have permission to use</li>
            <li>• Photos should be in portrait orientation for best results</li>
          </ul>
        </div>
      </div>
    </div>
  )
}