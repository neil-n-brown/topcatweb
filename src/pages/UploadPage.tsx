import React, { useState } from 'react'
import { Upload, Camera, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function UploadPage() {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)

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
    
    if (!user || !image || !name.trim()) {
      alert('Please fill in all required fields')
      return
    }

    // Basic profanity filter
    const profanityWords = ['bad', 'inappropriate', 'offensive'] // Add more as needed
    const containsProfanity = profanityWords.some(word => 
      name.toLowerCase().includes(word) || description.toLowerCase().includes(word)
    )

    if (containsProfanity) {
      alert('Please use appropriate language in your cat\'s name and description')
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

      // Save cat data to database
      const { error: dbError } = await supabase
        .from('cats')
        .insert([
          {
            user_id: user.id,
            name: name.trim(),
            description: description.trim() || null,
            image_url: publicUrl,
          },
        ])

      if (dbError) throw dbError

      setSuccess(true)
      setName('')
      setDescription('')
      setImage(null)
      setImagePreview(null)

      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Error uploading cat:', error)
      alert('Failed to upload cat. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 pb-20 md:pb-0 md:pl-64">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Your Cat</h1>
          <p className="text-gray-600">Share your adorable cat with the community</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">
            🎉 Your cat has been uploaded successfully! It will appear in the swipe feed soon.
          </div>
        )}

        {/* Upload Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cat Photo *
              </label>
              
              {!imagePreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Camera className="w-12 h-12 text-gray-400 mb-4" />
                    <span className="text-lg font-medium text-gray-900 mb-2">
                      Choose a photo
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

            {/* Cat Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Cat Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="What's your cat's name?"
                maxLength={50}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                placeholder="Tell us something special about your cat..."
                maxLength={200}
              />
              <p className="text-sm text-gray-500 mt-1">
                {description.length}/200 characters
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading || !image || !name.trim()}
              className="w-full bg-orange-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Cat
                </>
              )}
            </button>
          </form>
        </div>

        {/* Guidelines */}
        <div className="mt-8 bg-blue-50 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Upload Guidelines</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use clear, high-quality photos of cats</li>
            <li>• Keep names and descriptions family-friendly</li>
            <li>• Only upload photos you own or have permission to use</li>
            <li>• Photos should be in portrait orientation for best results</li>
          </ul>
        </div>
      </div>
    </div>
  )
}