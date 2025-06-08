import React, { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Smile } from 'lucide-react'
import SwipeCard from '../components/SwipeCard'
import EmojiPicker from '../components/EmojiPicker'
import { supabase, Cat } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// Enhanced Cat interface with caption and profile info
interface EnhancedCat extends Cat {
  caption?: string
  cat_profile?: {
    id: string
    name: string
    profile_picture?: string
  }
}

// Demo cats for when Supabase is not configured
const demoCats: EnhancedCat[] = [
  {
    id: '1',
    user_id: 'demo',
    name: 'Whiskers',
    description: 'A fluffy orange tabby who loves to play',
    caption: 'Playing in the sunny garden 🌞',
    image_url: 'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=400',
    upload_date: new Date().toISOString(),
    user: { id: 'demo', email: 'demo@example.com', username: 'demo_user', created_at: new Date().toISOString() },
    cat_profile: {
      id: '1',
      name: 'Whiskers',
      profile_picture: 'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=100'
    }
  },
  {
    id: '2',
    user_id: 'demo',
    name: 'Luna',
    description: 'A beautiful black cat with green eyes',
    caption: 'Nap time in my favorite spot',
    image_url: 'https://images.pexels.com/photos/416160/pexels-photo-416160.jpeg?auto=compress&cs=tinysrgb&w=400',
    upload_date: new Date().toISOString(),
    user: { id: 'demo', email: 'demo@example.com', username: 'cat_lover', created_at: new Date().toISOString() },
    cat_profile: {
      id: '2',
      name: 'Luna'
    }
  },
  {
    id: '3',
    user_id: 'demo',
    name: 'Mittens',
    description: 'Loves to sleep in sunny spots',
    image_url: 'https://images.pexels.com/photos/1170986/pexels-photo-1170986.jpeg?auto=compress&cs=tinysrgb&w=400',
    upload_date: new Date().toISOString(),
    user: { id: 'demo', email: 'demo@example.com', username: 'kitty_fan', created_at: new Date().toISOString() },
    cat_profile: {
      id: '3',
      name: 'Mittens'
    }
  }
]

export default function SwipePage() {
  const { user } = useAuth()
  const [cats, setCats] = useState<EnhancedCat[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    fetchCats()
  }, [])

  const fetchCats = async () => {
    try {
      // Enhanced query to include caption and cat profile information
      const { data, error } = await supabase
        .from('cats')
        .select(`
          *,
          user:users(*),
          cat_profile:cat_profiles(id, name, profile_picture)
        `)
        .neq('user_id', user?.id)
        .order('upload_date', { ascending: false })
        .limit(20)

      if (error && error.message.includes('Demo mode')) {
        // Use demo cats when Supabase is not configured
        setIsDemo(true)
        setCats(demoCats)
      } else if (error) {
        throw error
      } else {
        setCats(data || [])
      }
    } catch (error) {
      console.error('Error fetching cats:', error)
      // Fallback to demo cats
      setIsDemo(true)
      setCats(demoCats)
    } finally {
      setLoading(false)
    }
  }

  const handleSwipe = async (direction: 'left' | 'right') => {
    const currentCat = cats[currentIndex]
    if (!currentCat || !user) return

    // Record the swipe as a reaction (only if not in demo mode)
    if (direction === 'right' && !isDemo) {
      try {
        await supabase
          .from('reactions')
          .insert([
            {
              user_id: user.id,
              cat_id: currentCat.id,
              emoji_type: '❤️',
            },
          ])
      } catch (error) {
        console.error('Error recording reaction:', error)
      }
    }

    // Move to next cat
    setCurrentIndex(prev => prev + 1)

    // Load more cats if running low (only if not in demo mode)
    if (currentIndex >= cats.length - 3 && !isDemo) {
      fetchCats()
    }
  }

  const handleEmojiSelect = async (emoji: string) => {
    const currentCat = cats[currentIndex]
    if (!currentCat || !user) return

    // Record emoji reaction (only if not in demo mode)
    if (!isDemo) {
      try {
        await supabase
          .from('reactions')
          .insert([
            {
              user_id: user.id,
              cat_id: currentCat.id,
              emoji_type: emoji,
            },
          ])
      } catch (error) {
        console.error('Error recording emoji reaction:', error)
      }
    }

    setShowEmojiPicker(false)
    setCurrentIndex(prev => prev + 1)

    // Load more cats if running low (only if not in demo mode)
    if (currentIndex >= cats.length - 3 && !isDemo) {
      fetchCats()
    }
  }

  const handleReport = async () => {
    const currentCat = cats[currentIndex]
    if (!currentCat || !user) return

    if (isDemo) {
      alert('Demo mode - reporting is not available')
      return
    }

    try {
      await supabase
        .from('reports')
        .insert([
          {
            reporter_id: user.id,
            cat_id: currentCat.id,
            reason: 'inappropriate_content',
            status: 'pending',
          },
        ])

      alert('Thank you for reporting. We will review this content.')
      setCurrentIndex(prev => prev + 1)
    } catch (error) {
      console.error('Error reporting cat:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (cats.length === 0 || currentIndex >= cats.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <div className="text-6xl mb-4">😿</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No more cats!</h2>
        <p className="text-gray-600 mb-6">
          {isDemo ? 'This is demo mode. Connect to Supabase to see real cats!' : 'Check back later for more adorable cats to rate.'}
        </p>
        <button
          onClick={() => {
            setCurrentIndex(0)
            if (isDemo) {
              setCats([...demoCats])
            } else {
              fetchCats()
            }
          }}
          className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          {isDemo ? 'Restart Demo' : 'Refresh'}
        </button>
      </div>
    )
  }

  const currentCat = cats[currentIndex]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Demo mode indicator */}
      {isDemo && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 text-center">
          <p className="font-medium">Demo Mode - Connect to Supabase to use the full app!</p>
        </div>
      )}

      {/* Mobile-optimized container */}
      <div className="flex-1 flex items-center justify-center p-4 pb-20 md:pb-4">
        <div className="relative w-full max-w-sm h-[600px] md:h-[700px]">
          <AnimatePresence>
            {currentCat && (
              <SwipeCard
                key={currentCat.id}
                cat={currentCat}
                onSwipe={handleSwipe}
                onReport={handleReport}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Emoji reaction button */}
      <div className="fixed bottom-24 md:bottom-8 right-4">
        <button
          onClick={() => setShowEmojiPicker(true)}
          className="w-14 h-14 bg-orange-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-orange-600 transition-colors"
        >
          <Smile className="w-6 h-6" />
        </button>
      </div>

      {/* Emoji Picker Modal */}
      <AnimatePresence>
        {showEmojiPicker && (
          <EmojiPicker
            onEmojiSelect={handleEmojiSelect}
            onClose={() => setShowEmojiPicker(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}