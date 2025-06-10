import React from 'react'
import { motion } from 'framer-motion'

const catEmojis = [
  '😻', '😸', '😹', '😺', '😽', '🙀', '😿', '😾',
  '🐱', '🐈', '🐈‍⬛', '🦁', '🐯', '🐅', '🐆',
  '❤️', '💕', '💖', '💗', '💘', '💝', '💞', '💟',
  '🥰', '😍', '🤩', '😘', '😗', '😙', '😚',
  '👑', '⭐', '✨', '💫', '🌟', '🔥', '💯', '🎉'
]

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
  onClose: () => void
}

export default function EmojiPicker({ onEmojiSelect, onClose }: EmojiPickerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        className="card-cute p-8 max-w-sm w-full max-h-96 overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        exit={{ y: 50 }}
      >
        {/* Cute Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">😸</div>
          <h3 className="text-xl font-bold text-cute-primary mb-2">
            React with an emoji!
          </h3>
          <p className="text-cute-secondary text-sm">
            Show this kitty some love 💕
          </p>
        </div>
        
        {/* Emoji Grid */}
        <div className="grid grid-cols-6 gap-3 mb-6">
          {catEmojis.map((emoji, index) => (
            <motion.button
              key={index}
              onClick={() => onEmojiSelect(emoji)}
              className="text-3xl p-3 rounded-2xl hover:bg-pink-100 transition-all duration-300 transform hover:scale-110 active:scale-95"
              whileHover={{ rotate: [0, -5, 5, 0] }}
              whileTap={{ scale: 0.9 }}
            >
              {emoji}
            </motion.button>
          ))}
        </div>
        
        {/* Cancel Button */}
        <button
          onClick={onClose}
          className="w-full py-3 text-cute-secondary hover:text-cute-primary transition-colors font-medium rounded-2xl hover:bg-pink-50"
        >
          Cancel 🐾
        </button>

        {/* Decorative Elements */}
        <div className="absolute -top-2 -right-2 text-2xl opacity-60 float-animation">
          💕
        </div>
        <div className="absolute -bottom-2 -left-2 text-xl opacity-40 float-animation" style={{ animationDelay: '1s' }}>
          🐾
        </div>
      </motion.div>
    </motion.div>
  )
}