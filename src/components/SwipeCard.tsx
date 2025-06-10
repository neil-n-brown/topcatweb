import React, { useState } from 'react'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { Heart, X, Flag } from 'lucide-react'

// Enhanced Cat interface with caption and profile info
interface EnhancedCat {
  id: string
  user_id: string
  name: string
  description?: string
  caption?: string
  image_url: string
  upload_date: string
  cat_profile_id?: string
  user?: {
    id: string
    email: string
    username: string
    created_at: string
  }
  cat_profile?: {
    id: string
    name: string
    profile_picture?: string
  }
}

interface SwipeCardProps {
  cat: EnhancedCat
  onSwipe: (direction: 'left' | 'right') => void
  onReport: () => void
}

export default function SwipeCard({ cat, onSwipe, onReport }: SwipeCardProps) {
  const [exitX, setExitX] = useState(0)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0])

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100
    
    if (info.offset.x > threshold) {
      setExitX(200)
      onSwipe('right')
    } else if (info.offset.x < -threshold) {
      setExitX(-200)
      onSwipe('left')
    }
  }

  // Use cat profile name if available, otherwise fall back to cat name
  const displayName = cat.cat_profile?.name || cat.name
  const ownerUsername = cat.user?.username || 'Unknown'

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={exitX !== 0 ? { x: exitX } : {}}
      transition={{ duration: 0.2 }}
    >
      <div className="w-full h-full card-cute overflow-hidden relative">
        {/* Image */}
        <div className="relative h-3/4">
          <img
            src={cat.image_url}
            alt={displayName}
            className="w-full h-full object-cover"
            draggable={false}
          />
          
          {/* Cute Swipe indicators */}
          <motion.div
            className="absolute top-8 left-8 px-6 py-3 rounded-2xl font-bold text-lg transform -rotate-12 border-4 border-white shadow-lg"
            style={{ 
              opacity: useTransform(x, [-150, -50], [1, 0]),
              background: 'linear-gradient(135deg, #ff6b6b, #ff8e8e)'
            }}
          >
            <div className="flex items-center space-x-2 text-white">
              <span className="text-2xl">😐</span>
              <span>PASS</span>
            </div>
          </motion.div>
          
          <motion.div
            className="absolute top-8 right-8 px-6 py-3 rounded-2xl font-bold text-lg transform rotate-12 border-4 border-white shadow-lg"
            style={{ 
              opacity: useTransform(x, [50, 150], [1, 0]),
              background: 'linear-gradient(135deg, #ff69b4, #ff1493)'
            }}
          >
            <div className="flex items-center space-x-2 text-white">
              <span className="text-2xl">💕</span>
              <span>LOVE!</span>
            </div>
          </motion.div>

          {/* Report button */}
          <button
            onClick={onReport}
            className="absolute top-4 right-4 p-3 bg-white/80 backdrop-blur-sm rounded-full text-gray-600 hover:bg-white hover:text-red-500 transition-all duration-300 shadow-lg border border-pink-200"
            title="Report"
          >
            <Flag className="w-4 h-4" />
          </button>

          {/* Caption overlay - only show if caption exists */}
          {cat.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-6">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-white/50">
                <p className="text-gray-800 font-medium leading-relaxed">
                  {cat.caption}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-6 h-1/4 flex flex-col justify-center bg-gradient-to-r from-pink-50 to-purple-50">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-2xl">😻</span>
            <h3 className="text-2xl font-bold text-cute-primary">{displayName}</h3>
          </div>
          
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-lg">👤</span>
            <p className="text-cute-secondary font-medium">by @{ownerUsername}</p>
          </div>
          
          {/* Show description only if no caption exists (backward compatibility) */}
          {!cat.caption && cat.description && (
            <div className="flex items-start space-x-2">
              <span className="text-sm mt-1">📝</span>
              <p className="text-cute-secondary text-sm line-clamp-2 leading-relaxed">{cat.description}</p>
            </div>
          )}
        </div>

        {/* Cute decorative elements */}
        <div className="absolute top-4 left-4 text-2xl opacity-60 float-animation">
          🐾
        </div>
        <div className="absolute bottom-4 right-4 text-xl opacity-40 float-animation" style={{ animationDelay: '1s' }}>
          💕
        </div>
      </div>
    </motion.div>
  )
}