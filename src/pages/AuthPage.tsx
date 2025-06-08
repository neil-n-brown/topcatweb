import React, { useState, useEffect } from 'react'
import { Heart, Mail, Lock, User, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { isDemoMode, authHelpers } from '../lib/supabase'

export default function AuthPage() {
  const { signUp, signIn, resetPassword, error, clearError, refreshSession } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Clear errors when switching modes
  useEffect(() => {
    clearError()
    setMessage('')
  }, [mode, clearError])

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isDemoMode) {
      setMessage('Demo mode - Supabase authentication is not configured. You can still browse the app interface!')
      return
    }
    
    setLoading(true)
    setMessage('')
    clearError()

    try {
      if (mode === 'signup') {
        if (!username.trim()) {
          throw new Error('Username is required')
        }
        await signUp(email, password, username.trim())
        setMessage('Account created successfully! Please check your email to verify your account.')
      } else if (mode === 'signin') {
        await signIn(email, password)
      } else if (mode === 'reset') {
        await resetPassword(email)
        setMessage('Password reset email sent! Check your inbox.')
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      let errorMessage = error.message || 'An error occurred. Please try again.'
      
      if (error.message.includes('Demo mode')) {
        errorMessage = 'Demo mode - Supabase authentication is not configured. You can still browse the landing page!'
      } else if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.'
      } else if (error.message.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Please sign in instead.'
      } else if (error.message.includes('Password should be at least 6 characters')) {
        errorMessage = 'Password must be at least 6 characters long.'
      } else if (error.message.includes('session') || error.message.includes('token')) {
        errorMessage = 'Session error detected. Cleaning up and retrying...'
        // Clean up corrupted sessions and retry
        authHelpers.cleanupCorruptedSessions()
        setTimeout(() => {
          setLoading(false)
          setMessage('Session cleaned up. Please try again.')
        }, 1000)
        return
      }
      
      setMessage(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshSession = async () => {
    setLoading(true)
    try {
      await refreshSession()
      setMessage('Session refreshed successfully!')
    } catch (error) {
      setMessage('Failed to refresh session. Please try signing in again.')
    } finally {
      setLoading(false)
    }
  }

  const displayMessage = message || error

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Top Cat</h1>
          <p className="text-gray-600 mt-2">Rate the cutest cats in the world</p>
        </div>

        {/* Auth Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 text-center">
              {mode === 'signin' && 'Welcome Back'}
              {mode === 'signup' && 'Join Top Cat'}
              {mode === 'reset' && 'Reset Password'}
            </h2>
            <p className="text-gray-600 text-center mt-2">
              {mode === 'signin' && 'Sign in to start rating cats'}
              {mode === 'signup' && 'Create your account to get started'}
              {mode === 'reset' && 'Enter your email to reset your password'}
            </p>
          </div>

          {/* Demo Mode Warning */}
          {isDemoMode && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg mb-6">
              <p className="font-medium">Demo Mode Active</p>
              <p className="text-sm">Supabase is not configured. Authentication is disabled, but you can explore the app interface.</p>
            </div>
          )}

          {/* Error/Message Display */}
          {displayMessage && (
            <div className={`p-4 rounded-lg mb-6 ${
              displayMessage.includes('error') || 
              displayMessage.includes('Error') || 
              displayMessage.includes('Demo mode') || 
              displayMessage.includes('Invalid') ||
              displayMessage.includes('Failed')
                ? 'bg-red-100 text-red-700 border border-red-200'
                : 'bg-green-100 text-green-700 border border-green-200'
            }`}>
              <div className="flex items-start">
                <div className="flex-1">
                  {displayMessage}
                </div>
                {displayMessage.includes('Session') && (
                  <button
                    onClick={handleRefreshSession}
                    disabled={loading}
                    className="ml-2 p-1 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                    title="Refresh Session"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label htmlFor="username\" className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Choose a username"
                    required={mode === 'signup'}
                    disabled={isDemoMode || loading}
                    maxLength={30}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter your email"
                  required
                  disabled={isDemoMode || loading}
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter your password"
                    required
                    minLength={6}
                    disabled={isDemoMode || loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                    disabled={isDemoMode || loading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || isDemoMode}
              className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Loading...
                </div>
              ) : isDemoMode ? (
                'Demo Mode - Authentication Disabled'
              ) : (
                <>
                  {mode === 'signin' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'reset' && 'Send Reset Email'}
                </>
              )}
            </button>
          </form>

          {/* Mode Switcher */}
          {!isDemoMode && (
            <div className="mt-6 text-center space-y-2">
              {mode === 'signin' && (
                <>
                  <p className="text-gray-600">
                    Don't have an account?{' '}
                    <button
                      onClick={() => setMode('signup')}
                      className="text-orange-500 hover:text-orange-600 font-medium"
                      disabled={loading}
                    >
                      Sign up
                    </button>
                  </p>
                  <button
                    onClick={() => setMode('reset')}
                    className="text-sm text-gray-500 hover:text-gray-700"
                    disabled={loading}
                  >
                    Forgot your password?
                  </button>
                </>
              )}

              {mode === 'signup' && (
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <button
                    onClick={() => setMode('signin')}
                    className="text-orange-500 hover:text-orange-600 font-medium"
                    disabled={loading}
                  >
                    Sign in
                  </button>
                </p>
              )}

              {mode === 'reset' && (
                <p className="text-gray-600">
                  Remember your password?{' '}
                  <button
                    onClick={() => setMode('signin')}
                    className="text-orange-500 hover:text-orange-600 font-medium"
                    disabled={loading}
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          )}

          {/* Demo Mode Notice */}
          {isDemoMode && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 text-center">
                <strong>Demo Mode:</strong> To enable authentication, configure your Supabase environment variables.
              </p>
            </div>
          )}
        </div>

        {/* Sample Cats Preview */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            {isDemoMode ? 'Explore the demo interface!' : 'Join thousands of cat lovers!'}
          </p>
          <div className="flex justify-center space-x-2">
            {[
              'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=150',
              'https://images.pexels.com/photos/416160/pexels-photo-416160.jpeg?auto=compress&cs=tinysrgb&w=150',
              'https://images.pexels.com/photos/1170986/pexels-photo-1170986.jpeg?auto=compress&cs=tinysrgb&w=150',
            ].map((src, index) => (
              <img
                key={index}
                src={src}
                alt="Sample cat"
                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = `https://via.placeholder.com/48x48/ff6b35/ffffff?text=Cat${index + 1}`
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}