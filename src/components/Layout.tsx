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
    { name: 'Swipe', href: '/swipe', icon: Heart },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { name: 'Upload', href: '/upload', icon: Upload },
    { name: 'Cat Profiles', href: '/cat-profiles', icon: Star },
    { name: 'Profile', href: '/profile', icon: User },
  ]

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/swipe" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Top Cat</span>
            </Link>
            
            {user && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Hi, {user.username}!</span>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Bottom Navigation - Mobile */}
      {user && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
          <div className="grid grid-cols-5 h-16">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex flex-col items-center justify-center space-y-1 ${
                    isActive
                      ? 'text-orange-500'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      )}

      {/* Desktop Sidebar */}
      {user && (
        <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:flex md:w-64 md:flex-col">
          <div className="flex flex-col flex-grow pt-5 bg-white overflow-y-auto border-r border-gray-200">
            <div className="flex items-center flex-shrink-0 px-4">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">Top Cat</span>
            </div>
            <div className="mt-8 flex-grow flex flex-col">
              <nav className="flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? 'bg-orange-100 text-orange-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="mr-3 flex-shrink-0 h-6 w-6" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        </aside>
      )}
    </div>
  )
}