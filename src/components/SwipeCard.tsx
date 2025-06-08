import React, { useState } from 'react'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { Heart, X, Flag } from 'lucide-react'
import { Cat } from '../lib/supabase'

interface SwipeCardProps {
  cat: Cat
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
      <div className="w-full h-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Image */}
        <div className="relative h-3/4">
          <img
            src={cat.image_url}
            alt={cat.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
          
          {/* Swipe indicators */}
          <motion.div
            className="absolute top-8 left-8 bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-lg transform -rotate-12"
            style={{ opacity: useTransform(x, [-150, -50], [1, 0]) }}
          >
            NOPE
          </motion.div>
          
          <motion.div
            className="absolute top-8 right-8 bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-lg transform rotate-12"
            style={{ opacity: useTransform(x, [50, 150], [1, 0]) }}
          >
            CUTE!
          </motion.div>

          {/* Report button */}
          <button
            onClick={onReport}
            className="absolute top-4 right-4 p-2 bg-black bg-opacity-20 rounded-full text-white hover:bg-opacity-30 transition-colors"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>

        {/* Info */}
        <div className="p-6 h-1/4 flex flex-col justify-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{cat.name}</h3>
          <p className="text-gray-600 mb-2">by @{cat.user?.username}</p>
          {cat.description && (
            <p className="text-gray-700 text-sm line-clamp-2">{cat.description}</p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-4">
        <button
          onClick={() => onSwipe('left')}
          className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <button
          onClick={() => onSwipe('right')}
          className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center text-green-500 hover:bg-green-50 transition-colors"
        >
          <Heart className="w-6 h-6" />
        </button>
      </div>
    </motion.div>
  )
}