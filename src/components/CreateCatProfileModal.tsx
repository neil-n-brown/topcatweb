import React, { useState } from 'react'
import { X, Camera, Upload } from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface CreateCatProfileModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function CreateCatProfileModal({ onClose, onSuccess }: CreateCatProfileModalProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    date_of_birth: '',
    age: '',
    breed: '',
    sex: '',
    personality: '',
    favourite_person: '',
    favourite_treat: '',
    favourite_toy: '',
    favourite_word: '',
    play_time_preference: ''
  })
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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

      setProfilePicture(file)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfilePicturePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setProfilePicture(null)
    setProfilePicturePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !formData.name.trim()) {
      alert('Please enter a name for your cat')
      return
    }

    if (isDemoMode) {
      alert('Demo mode - profile creation not available')
      return
    }

    setLoading(true)

    try {
      let profilePictureUrl = null

      // Upload profile picture if provided
      if (profilePicture) {
        const fileExt = profilePicture.name.split('.').pop()
        const fileName = `profile-${user.id}-${Date.now()}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('cat-photos')
          .upload(fileName, profilePicture)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('cat-photos')
          .getPublicUrl(fileName)

        profilePictureUrl = publicUrl
      }

      // Create cat profile
      const profileData = {
        user_id: user.id,
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
        .insert([profileData])

      if (error) throw error

      onSuccess()
    } catch (error) {
      console.error('Error creating cat profile:', error)
      alert('Failed to create cat profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Create Cat Profile</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Profile Picture */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Picture (Optional)
            </label>
            
            {!profilePicturePreview ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="profile-picture-upload"
                />
                <label
                  htmlFor="profile-picture-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Camera className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Upload Profile Picture</span>
                  <span className="text-xs text-gray-600">PNG, JPG up to 5MB</span>
                </label>
              </div>
            ) : (
              <div className="relative w-32 h-32">
                <img
                  src={profilePicturePreview}
                  alt="Profile preview"
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Cat Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter cat's name"
                required
                maxLength={50}
              />
            </div>

            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                Age
              </label>
              <input
                type="text"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="e.g., 3 years, 6 months"
                maxLength={20}
              />
            </div>

            <div>
              <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                id="date_of_birth"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="sex" className="block text-sm font-medium text-gray-700 mb-2">
                Sex
              </label>
              <select
                id="sex"
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
              <label htmlFor="breed" className="block text-sm font-medium text-gray-700 mb-2">
                Breed
              </label>
              <input
                type="text"
                id="breed"
                name="breed"
                value={formData.breed}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="e.g., Persian, Maine Coon"
                maxLength={50}
              />
            </div>

            <div>
              <label htmlFor="favourite_person" className="block text-sm font-medium text-gray-700 mb-2">
                Favourite Person
              </label>
              <input
                type="text"
                id="favourite_person"
                name="favourite_person"
                value={formData.favourite_person}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="e.g., Mom, Dad, Sarah"
                maxLength={50}
              />
            </div>
          </div>

          {/* Personality */}
          <div>
            <label htmlFor="personality" className="block text-sm font-medium text-gray-700 mb-2">
              Personality
            </label>
            <textarea
              id="personality"
              name="personality"
              value={formData.personality}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              placeholder="Describe your cat's personality..."
              maxLength={200}
            />
          </div>

          {/* Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="favourite_treat" className="block text-sm font-medium text-gray-700 mb-2">
                Favourite Treat
              </label>
              <input
                type="text"
                id="favourite_treat"
                name="favourite_treat"
                value={formData.favourite_treat}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="e.g., Tuna, Chicken treats"
                maxLength={50}
              />
            </div>

            <div>
              <label htmlFor="favourite_toy" className="block text-sm font-medium text-gray-700 mb-2">
                Favourite Toy
              </label>
              <input
                type="text"
                id="favourite_toy"
                name="favourite_toy"
                value={formData.favourite_toy}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="e.g., Feather wand, Laser pointer"
                maxLength={50}
              />
            </div>

            <div>
              <label htmlFor="favourite_word" className="block text-sm font-medium text-gray-700 mb-2">
                Favourite Word/Phrase
              </label>
              <input
                type="text"
                id="favourite_word"
                name="favourite_word"
                value={formData.favourite_word}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="e.g., Treats, Outside"
                maxLength={50}
              />
            </div>

            <div>
              <label htmlFor="play_time_preference" className="block text-sm font-medium text-gray-700 mb-2">
                Play Time Preference
              </label>
              <input
                type="text"
                id="play_time_preference"
                name="play_time_preference"
                value={formData.play_time_preference}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="e.g., Morning, Evening"
                maxLength={50}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Create Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}