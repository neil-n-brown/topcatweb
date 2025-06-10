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
      alert('Demo mode - reporting is not available 😸')
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

      alert('Thank you for reporting! We will review this content. 🐱💕')
      setCurrentIndex(prev => prev + 1)
    } catch (error) {
      console.error('Error reporting cat:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen pb-20 md:pb-0 md:pl-72">
        <div className="text-center">
          <div className="text-6xl mb-4 loading-paw">🐾</div>
          <div className="text-lg text-cute-primary font-medium">Finding adorable cats...</div>
          <div className="text-sm text-cute-secondary mt-2">Preparing the cuteness! 😻</div>
        </div>
      </div>
    )
  }

  if (cats.length === 0 || currentIndex >= cats.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center pb-20 md:pb-0 md:pl-72">
        <div className="card-cute p-8 max-w-md">
          <div className="text-8xl mb-6 float-animation">😿</div>
          <h2 className="text-2xl font-bold text-cute-primary mb-4">No more cats!</h2>
          <p className="text-cute-secondary mb-6 leading-relaxed">
            {isDemo ? 'This is demo mode. Connect to Supabase to see real cats! 🚀😸' : 'Check back later for more adorable cats to rate. 🐱💕'}
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
            className="btn-cute hover-bounce flex items-center space-x-2"
          >
            <span>{isDemo ? 'Restart Demo' : 'Refresh'}</span>
            <span className="text-xl">🔄</span>
          </button>
        </div>
      </div>
    )
  }

  const currentCat = cats[currentIndex]

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0 md:pl-72">
      {/* Demo mode indicator */}
      {isDemo && (
        <div className="alert-cute-warning p-4 text-center border-b border-yellow-300">
          <p className="font-medium flex items-center justify-center">
            <span className="text-2xl mr-2">🎮</span>
            Demo Mode - Connect to Supabase to use the full app!
            <span className="text-2xl ml-2">😸</span>
          </p>
        </div>
      )}

      {/* Cute Header */}
      <div className="text-center py-6 relative z-10">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <span className="text-2xl">😻</span>
          <h1 className="text-2xl font-bold text-cute-primary">Rate This Cutie!</h1>
          <span className="text-2xl">💕</span>
        </div>
        <p className="text-cute-secondary">Swipe or use buttons to rate</p>
      </div>

      {/* Mobile-optimized container */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
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

      {/* Cute Action Buttons */}
      <div className="fixed bottom-32 md:bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 z-20">
        {/* Pass Button */}
        <button
          onClick={() => handleSwipe('left')}
          className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-600 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all duration-300 border-2 border-white"
          title="Pass"
        >
          <span className="text-2xl">😐</span>
        </button>

        {/* Emoji Reaction Button */}
        <button
          onClick={() => setShowEmojiPicker(true)}
          className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all duration-300 border-4 border-white hover-bounce"
          title="React with Emoji"
        >
          <span className="text-3xl">😸</span>
        </button>

        {/* Love Button */}
        <button
          onClick={() => handleSwipe('right')}
          className="w-16 h-16 bg-gradient-to-r from-pink-400 to-red-400 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all duration-300 border-2 border-white"
          title="Love it!"
        >
          <span className="text-2xl">💕</span>
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-20 md:left-80 md:transform-none">
        <div className="bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 border border-pink-200">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-cute-primary">
              {currentIndex + 1} of {cats.length}
            </span>
            <span className="text-lg">🐱</span>
          </div>
        </div>
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