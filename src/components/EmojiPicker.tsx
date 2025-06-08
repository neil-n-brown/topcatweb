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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-2xl p-6 max-w-sm w-full max-h-96 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          React with an emoji!
        </h3>
        
        <div className="grid grid-cols-6 gap-3">
          {catEmojis.map((emoji, index) => (
            <button
              key={index}
              onClick={() => onEmojiSelect(emoji)}
              className="text-2xl p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
        
        <button
          onClick={onClose}
          className="w-full mt-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Cancel
        </button>
      </motion.div>
    </motion.div>
  )
}