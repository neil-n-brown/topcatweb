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
        alert('Please select an image file 📸')
        return
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be smaller than 5MB 📏')
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
      alert('Please select a cat profile and upload an image 😸📸')
      return
    }

    if (isDemoMode) {
      alert('Demo mode - upload not available. Connect to Supabase to enable uploads! 🚀😸')
      return
    }

    // Basic profanity filter for caption
    const profanityWords = ['bad', 'inappropriate', 'offensive'] // Add more as needed
    const containsProfanity = profanityWords.some(word => 
      caption.toLowerCase().includes(word)
    )

    if (containsProfanity) {
      alert('Please use appropriate language in your photo caption 😊💕')
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
      alert('Failed to upload photo. Please try again. 😿')
    } finally {
      setUploading(false)
    }
  }

  const selectedProfile = catProfiles.find(p => p.id === selectedProfileId)

  return (
    <div className="min-h-screen bg-cute-gradient pb-20 md:pb-0 md:pl-72">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 float-animation">📸</div>
          <h1 className="text-4xl font-bold text-cute-primary mb-2">Upload Cat Photo</h1>
          <p className="text-cute-secondary font-medium">Add a new photo to one of your cat profiles 😻</p>
          {isDemoMode && (
            <div className="mt-4 alert-cute-warning">
              <div className="flex items-center justify-center">
                <span className="text-2xl mr-2">🎮</span>
                <p className="font-medium">Demo Mode: Upload functionality requires Supabase configuration</p>
                <span className="text-2xl ml-2">😸</span>
              </div>
            </div>
          )}
        </div>

        {/* Success Message */}
        {success && (
          <div className="alert-cute-success mb-6">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🎉</span>
              <div>
                <p className="font-medium">Your photo has been uploaded successfully!</p>
                <p className="text-sm">It will appear in the swipe feed soon. 😻💕</p>
              </div>
            </div>
          </div>
        )}

        {/* No Cat Profiles Warning */}
        {!profilesLoading && catProfiles.length === 0 && !profilesError && (
          <div className="card-cute p-6 mb-6 bg-gradient-to-r from-orange-50 to-pink-50 border-2 border-orange-200">
            <div className="flex items-start">
              <AlertCircle className="w-8 h-8 text-orange-600 mt-1 mr-4 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-orange-900 mb-3 flex items-center">
                  <span className="mr-2">⭐</span>
                  Create a Cat Profile First
                </h3>
                <p className="text-orange-800 mb-4 leading-relaxed">
                  You need to create at least one cat profile before you can upload photos. 
                  Cat profiles help organize your photos and provide detailed information about your cats. 🐱💕
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
          </div>
        )}

        {/* Profiles Error */}
        {profilesError && (
          <div className="alert-cute-error mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
              <div className="flex-1">
                <span className="font-medium">{profilesError}</span>
                <button
                  onClick={fetchCatProfiles}
                  className="ml-4 text-red-600 hover:text-red-800 underline font-medium"
                >
                  Retry 🔄
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Form */}
        <div className="card-cute p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cat Profile Selection - Required */}
            <div>
              <label htmlFor="cat-profile" className="block text-sm font-medium text-cute-primary mb-3 flex items-center">
                <span className="mr-2">⭐</span>
                Select Cat Profile *
              </label>
              
              {profilesLoading ? (
                <div className="input-cute flex items-center bg-gray-50">
                  <div className="loading-paw text-lg mr-2">🐾</div>
                  <span className="text-cute-secondary">Loading cat profiles...</span>
                </div>
              ) : catProfiles.length > 0 ? (
                <>
                  <select
                    id="cat-profile"
                    value={selectedProfileId}
                    onChange={(e) => setSelectedProfileId(e.target.value)}
                    className="input-cute w-full"
                    required
                    disabled={isDemoMode}
                  >
                    <option value="">Choose a cat profile... 😸</option>
                    {catProfiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name} {profile.breed && `(${profile.breed})`} {profile.age && `- ${profile.age}`}
                      </option>
                    ))}
                  </select>
                  
                  {/* Selected Profile Preview */}
                  {selectedProfile && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200 rounded-2xl">
                      <div className="flex items-center">
                        {selectedProfile.profile_picture && (
                          <img
                            src={selectedProfile.profile_picture}
                            alt={selectedProfile.name}
                            className="w-12 h-12 object-cover rounded-full mr-3 border-2 border-white shadow-lg"
                          />
                        )}
                        <div>
                          <p className="font-bold text-cute-primary flex items-center">
                            <span className="mr-1">😻</span>
                            {selectedProfile.name}
                          </p>
                          {(selectedProfile.breed || selectedProfile.age) && (
                            <p className="text-sm text-cute-secondary">
                              {selectedProfile.breed} {selectedProfile.age && `• ${selectedProfile.age}`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="input-cute bg-gray-50 text-cute-secondary">
                  No cat profiles available. Create one first to upload photos. 😿
                </div>
              )}
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-cute-primary mb-3 flex items-center">
                <span className="mr-2">📸</span>
                Photo *
              </label>
              
              {!imagePreview ? (
                <div className="border-2 border-dashed border-pink-300 rounded-2xl p-8 text-center hover:border-pink-400 transition-colors bg-gradient-to-br from-pink-50 to-purple-50">
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
                    <div className="text-6xl mb-4">📷</div>
                    <span className="text-lg font-medium text-cute-primary mb-2">
                      {isDemoMode ? 'Demo Mode - Upload Disabled 🎮' : 
                       catProfiles.length === 0 ? 'Create a cat profile first ⭐' : 
                       'Choose a photo 😸'}
                    </span>
                    <span className="text-sm text-cute-secondary">
                      PNG, JPG up to 5MB 📏
                    </span>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-2xl border-4 border-white shadow-lg"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg border-2 border-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 border border-pink-200">
                    <span className="text-sm font-medium text-cute-primary">Looking great! 😻</span>
                  </div>
                </div>
              )}
            </div>

            {/* Photo Caption */}
            <div>
              <label htmlFor="caption" className="block text-sm font-medium text-cute-primary mb-3 flex items-center">
                <span className="mr-2">💬</span>
                Photo Caption (Optional)
              </label>
              <textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                className="input-cute w-full resize-none"
                placeholder="Add a cute caption for this photo... 😸💕"
                maxLength={125}
                disabled={isDemoMode}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-cute-secondary flex items-center">
                  <span className="mr-1">💡</span>
                  Describe what's happening in this photo
                </p>
                <p className={`text-sm ${caption.length > 100 ? 'text-orange-600 font-medium' : 'text-cute-secondary'}`}>
                  {caption.length}/125
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading || !image || !selectedProfileId || isDemoMode || catProfiles.length === 0}
              className="btn-cute w-full py-4 text-lg font-medium"
            >
              {uploading ? (
                <div className="flex items-center justify-center">
                  <div className="loading-paw text-2xl mr-2">🐾</div>
                  <span>Uploading...</span>
                </div>
              ) : isDemoMode ? (
                <div className="flex items-center justify-center">
                  <span>Demo Mode - Upload Disabled</span>
                  <span className="text-xl ml-2">🎮</span>
                </div>
              ) : catProfiles.length === 0 ? (
                <div className="flex items-center justify-center">
                  <span>Create a Cat Profile First</span>
                  <span className="text-xl ml-2">⭐</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Upload className="w-5 h-5 mr-2" />
                  <span>Upload Photo</span>
                  <span className="text-xl ml-2">📸</span>
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Guidelines */}
        <div className="mt-8 card-cute p-6 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">📋</span>
            <h3 className="font-bold text-cute-primary">Upload Guidelines</h3>
          </div>
          <ul className="text-sm text-cute-secondary space-y-2 leading-relaxed">
            <li className="flex items-center">
              <span className="mr-2">⭐</span>
              Select one of your existing cat profiles to link this photo
            </li>
            <li className="flex items-center">
              <span className="mr-2">📸</span>
              Use clear, high-quality photos of your cats
            </li>
            <li className="flex items-center">
              <span className="mr-2">💕</span>
              Keep captions family-friendly and descriptive
            </li>
            <li className="flex items-center">
              <span className="mr-2">✅</span>
              Only upload photos you own or have permission to use
            </li>
            <li className="flex items-center">
              <span className="mr-2">📱</span>
              Photos should be in portrait orientation for best results
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}