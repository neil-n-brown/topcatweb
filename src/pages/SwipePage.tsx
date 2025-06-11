import React, { useState, useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { RefreshCw, BarChart3, Info } from 'lucide-react'
import SwipeCard from '../components/SwipeCard'
import EmojiPicker from '../components/EmojiPicker'
import { swipeService, EnhancedCat, INTERACTION_TYPES } from '../lib/swipeService'
import { useAuth } from '../contexts/AuthContext'
import { isDemoMode } from '../lib/supabase'

export default function SwipePage() {
  const { user } = useAuth()
  const [cats, setCats] = useState<EnhancedCat[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [userStats, setUserStats] = useState<any>(null)
  const [priorityStats, setPriorityStats] = useState<any[]>([])
  const [showStats, setShowStats] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch cats with smart prioritization - ALWAYS gets exactly 20 photos
  const fetchCats = useCallback(async (refresh: boolean = false) => {
    if (!user) return

    try {
      setError(null)
      if (refresh) {
        setRefreshing(true)
        // Start new session for refresh
        await swipeService.startNewSession(user.id)
      }

      // Always request exactly 20 cats with smart prioritization
      const randomizedCats = await swipeService.getRandomizedCats(
        user.id,
        20, // Always get exactly 20 cats
        true  // Use smart prioritization
      )

      setCats(randomizedCats)
      setCurrentIndex(0)

      // Load user stats and priority breakdown
      const [stats, priorities] = await Promise.all([
        swipeService.getUserStats(user.id),
        swipeService.getPhotoPriorityStats(user.id)
      ])
      
      setUserStats(stats)
      setPriorityStats(priorities)

      console.log(`Loaded ${randomizedCats.length} cats with smart prioritization`)
      if (randomizedCats.length > 0) {
        console.log('Priority distribution:', randomizedCats.reduce((acc, cat) => {
          acc[cat.priority_level || 'unknown'] = (acc[cat.priority_level || 'unknown'] || 0) + 1
          return acc
        }, {} as Record<string, number>))
      }

    } catch (error: any) {
      console.error('Error fetching cats:', error)
      setError('Failed to load cats. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user])

  // Load more cats when running low (but maintain 20-cat batches)
  const loadMoreCats = useCallback(async () => {
    if (!user || currentIndex < cats.length - 5) return // Load when 5 cats remaining

    try {
      const moreCats = await swipeService.getRandomizedCats(
        user.id,
        20, // Always load 20 more cats
        true
      )

      if (moreCats.length > 0) {
        setCats(prev => [...prev, ...moreCats])
        console.log(`Loaded ${moreCats.length} more cats`)
      }
    } catch (error) {
      console.error('Error loading more cats:', error)
    }
  }, [user, currentIndex, cats.length])

  // Record view interaction when cat is shown
  const recordView = useCallback(async (catId: string) => {
    if (!user) return

    try {
      await swipeService.recordInteraction(
        user.id,
        catId,
        INTERACTION_TYPES.VIEW
      )
    } catch (error) {
      console.error('Error recording view:', error)
    }
  }, [user])

  // Handle swipe interactions
  const handleSwipe = async (direction: 'left' | 'right') => {
    const currentCat = cats[currentIndex]
    if (!currentCat || !user) return

    try {
      // Record the swipe interaction
      const interactionType = direction === 'right' 
        ? INTERACTION_TYPES.SWIPE_RIGHT 
        : INTERACTION_TYPES.SWIPE_LEFT

      await swipeService.recordInteraction(
        user.id,
        currentCat.id,
        interactionType
      )

      // Move to next cat
      setCurrentIndex(prev => prev + 1)

      // Load more cats if running low
      await loadMoreCats()

    } catch (error) {
      console.error('Error recording swipe:', error)
      // Still move to next cat even if recording fails
      setCurrentIndex(prev => prev + 1)
    }
  }

  // Handle emoji reactions
  const handleEmojiSelect = async (emoji: string) => {
    const currentCat = cats[currentIndex]
    if (!currentCat || !user) return

    try {
      await swipeService.recordInteraction(
        user.id,
        currentCat.id,
        INTERACTION_TYPES.EMOJI_REACTION,
        emoji
      )

      setShowEmojiPicker(false)
      setCurrentIndex(prev => prev + 1)

      // Load more cats if running low
      await loadMoreCats()

    } catch (error) {
      console.error('Error recording emoji reaction:', error)
      setShowEmojiPicker(false)
      setCurrentIndex(prev => prev + 1)
    }
  }

  // Handle report functionality
  const handleReport = async () => {
    const currentCat = cats[currentIndex]
    if (!currentCat || !user) return

    if (isDemoMode) {
      alert('Demo mode - reporting is not available 😸')
      setCurrentIndex(prev => prev + 1)
      return
    }

    try {
      await swipeService.recordInteraction(
        user.id,
        currentCat.id,
        INTERACTION_TYPES.REPORT
      )

      alert('Thank you for reporting! We will review this content. 🐱💕')
      setCurrentIndex(prev => prev + 1)

    } catch (error) {
      console.error('Error reporting cat:', error)
      alert('Failed to submit report. Please try again.')
    }
  }

  // Handle refresh - gets fresh 20 cats
  const handleRefresh = () => {
    fetchCats(true)
  }

  // Initial load
  useEffect(() => {
    if (user) {
      fetchCats()
    }
  }, [user, fetchCats])

  // Record view when current cat changes
  useEffect(() => {
    const currentCat = cats[currentIndex]
    if (currentCat && user) {
      recordView(currentCat.id)
    }
  }, [currentIndex, cats, recordView, user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen pb-20 md:pb-0 md:pl-72">
        <div className="text-center">
          <div className="text-6xl mb-4 loading-paw">🐾</div>
          <div className="text-lg text-cute-primary font-medium">Loading 20 perfect cats...</div>
          <div className="text-sm text-cute-secondary mt-2">Smart prioritization active! 😻</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center pb-20 md:pb-0 md:pl-72">
        <div className="card-cute p-8 max-w-md">
          <div className="text-8xl mb-6">😿</div>
          <h2 className="text-2xl font-bold text-cute-primary mb-4">Oops! Something went wrong</h2>
          <p className="text-cute-secondary mb-6 leading-relaxed">{error}</p>
          <button
            onClick={() => fetchCats(true)}
            className="btn-cute hover-bounce flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
            <span className="text-xl">🔄</span>
          </button>
        </div>
      </div>
    )
  }

  // When user reaches end of current batch, automatically load more
  if (currentIndex >= cats.length) {
    // Trigger loading more cats
    loadMoreCats()
    
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center pb-20 md:pb-0 md:pl-72">
        <div className="card-cute p-8 max-w-md">
          <div className="text-8xl mb-6 float-animation">🔄</div>
          <h2 className="text-2xl font-bold text-cute-primary mb-4">Loading more cats...</h2>
          <p className="text-cute-secondary mb-6 leading-relaxed">
            Getting your next batch of 20 cats with smart prioritization! 🎯😸
          </p>
          
          {userStats && (
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-4 mb-6">
              <h3 className="font-bold text-cute-primary mb-2">Your Session Stats 📊</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Cats viewed: {userStats.cats_viewed || 0}</div>
                <div>Reactions: {userStats.emoji_reactions || 0}</div>
                <div>Likes: {userStats.swipes_right || 0}</div>
                <div>Passes: {userStats.swipes_left || 0}</div>
              </div>
            </div>
          )}

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-cute hover-bounce flex items-center space-x-2 w-full justify-center"
          >
            {refreshing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Getting fresh cats...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Get Fresh 20 Cats</span>
                <span className="text-xl">🔄</span>
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  const currentCat = cats[currentIndex]

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0 md:pl-72">
      {/* Demo mode indicator */}
      {isDemoMode && (
        <div className="alert-cute-warning p-4 text-center border-b border-yellow-300">
          <p className="font-medium flex items-center justify-center">
            <span className="text-2xl mr-2">🎮</span>
            Demo Mode - Smart prioritization active! Always shows exactly 20 cats.
            <span className="text-2xl ml-2">😸</span>
          </p>
        </div>
      )}

      {/* Header with stats and refresh */}
      <div className="text-center py-4 relative z-10">
        <div className="flex items-center justify-between max-w-sm mx-auto px-4">
          <button
            onClick={() => setShowStats(!showStats)}
            className="p-2 text-cute-secondary hover:text-cute-primary transition-colors rounded-full hover:bg-white/30"
            title="View Stats"
          >
            <BarChart3 className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <span className="text-2xl">😻</span>
              <h1 className="text-xl font-bold text-cute-primary">Smart Swipe!</h1>
              <span className="text-2xl">💕</span>
            </div>
            <p className="text-sm text-cute-secondary">Always 20 cats</p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-cute-secondary hover:text-cute-primary transition-colors rounded-full hover:bg-white/30"
            title="Get Fresh 20 Cats"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Stats display */}
        {showStats && (
          <div className="mt-4 mx-4">
            <div className="card-cute p-4 max-w-sm mx-auto">
              <h3 className="font-bold text-cute-primary mb-3 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Your Stats
              </h3>
              
              {userStats && (
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">{userStats.cats_viewed || 0}</div>
                    <div className="text-cute-secondary">Viewed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-pink-600">{userStats.emoji_reactions || 0}</div>
                    <div className="text-cute-secondary">Reactions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{userStats.swipes_right || 0}</div>
                    <div className="text-cute-secondary">Likes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-600">{userStats.swipes_left || 0}</div>
                    <div className="text-cute-secondary">Passes</div>
                  </div>
                </div>
              )}

              {/* Priority breakdown */}
              {priorityStats.length > 0 && (
                <div className="border-t border-gray-200 pt-3">
                  <h4 className="text-xs font-medium text-cute-primary mb-2 flex items-center">
                    <Info className="w-3 h-3 mr-1" />
                    Available Photos
                  </h4>
                  {priorityStats.map((stat, index) => (
                    <div key={index} className="flex justify-between text-xs text-cute-secondary mb-1">
                      <span>{stat.description}:</span>
                      <span className="font-medium">{stat.photo_count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
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

      {/* Action Buttons */}
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
            {currentCat?.priority_level && (
              <span className="text-xs text-cute-secondary">
                (P{currentCat.priority_level})
              </span>
            )}
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