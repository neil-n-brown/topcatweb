import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Heart, Trophy, User, Upload, LogOut, Star } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth()
  const location = useLocation()

  const navigation = [
    { name: 'Swipe', href: '/swipe', icon: Heart, emoji: '💕' },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy, emoji: '👑' },
    { name: 'Upload', href: '/upload', icon: Upload, emoji: '📸' },
    { name: 'Cat Profiles', href: '/cat-profiles', icon: Star, emoji: '⭐' },
    { name: 'Profile', href: '/profile', icon: User, emoji: '😸' },
  ]

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="min-h-screen bg-cute-gradient">
      {/* Floating Cat Decorations */}
      <div className="fixed top-10 right-10 text-4xl opacity-20 float-animation pointer-events-none z-0">
        🐱
      </div>
      <div className="fixed bottom-20 left-10 text-3xl opacity-15 float-animation pointer-events-none z-0" style={{ animationDelay: '1s' }}>
        🐾
      </div>
      <div className="fixed top-1/2 right-5 text-2xl opacity-10 float-animation pointer-events-none z-0" style={{ animationDelay: '2s' }}>
        😻
      </div>

      {/* Header */}
      <header className="nav-cute border-b border-pink-200/50 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/swipe" className="flex items-center space-x-3 hover-bounce">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-2xl bg-gradient-to-r from-pink-400 to-purple-400 shadow-lg">
                😺
              </div>
              <div>
                <span className="text-2xl font-bold text-cute-primary bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                  Top Cat
                </span>
                <div className="text-xs text-cute-secondary">Meow-velous!</div>
              </div>
            </Link>
            
            {user && (
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center space-x-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-sm border border-pink-200">
                  <span className="text-lg">😸</span>
                  <span className="text-sm font-medium text-cute-primary">Hi, {user.username}!</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-pink-400 hover:text-pink-600 transition-colors rounded-full hover:bg-white/30"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10">
        {children}
      </main>

      {/* Bottom Navigation - Mobile */}
      {user && (
        <nav className="fixed bottom-0 left-0 right-0 nav-cute border-t border-pink-200/50 md:hidden z-20">
          <div className="grid grid-cols-5 h-20">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex flex-col items-center justify-center space-y-1 transition-all duration-300 ${
                    isActive
                      ? 'text-pink-500 scale-110'
                      : 'text-gray-400 hover:text-pink-400'
                  }`}
                >
                  <div className={`relative ${isActive ? 'animate-bounce' : ''}`}>
                    <span className="text-lg">{item.emoji}</span>
                    {isActive && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <span className="text-xs font-medium">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      )}

      {/* Desktop Sidebar */}
      {user && (
        <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:flex md:w-72 md:flex-col z-20">
          <div className="flex flex-col flex-grow pt-5 nav-cute overflow-y-auto border-r border-pink-200/50">
            <div className="flex items-center flex-shrink-0 px-6 mb-8">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-3xl bg-gradient-to-r from-pink-400 to-purple-400 shadow-lg hover-bounce">
                😺
              </div>
              <div className="ml-3">
                <span className="text-2xl font-bold text-cute-primary bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                  Top Cat
                </span>
                <div className="text-xs text-cute-secondary">Purrfect ratings!</div>
              </div>
            </div>
            
            <div className="mt-4 flex-grow flex flex-col">
              <nav className="flex-1 px-4 space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center px-4 py-3 text-sm font-medium rounded-2xl transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 shadow-lg scale-105'
                          : 'text-gray-600 hover:bg-white/50 hover:text-pink-600 hover:scale-102'
                      }`}
                    >
                      <span className="text-xl mr-3">{item.emoji}</span>
                      <Icon className="mr-3 flex-shrink-0 h-5 w-5" />
                      {item.name}
                      {isActive && (
                        <div className="ml-auto">
                          <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </Link>
                  )
                })}
              </nav>
              
              {/* Cute User Info in Sidebar */}
              <div className="p-4 m-4 rounded-2xl bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                    {user.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-cute-primary truncate">
                      @{user.username}
                    </p>
                    <p className="text-xs text-cute-secondary">Cat lover 😻</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      )}
    </div>
  )
}