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
      setMessage('Demo mode - Supabase authentication is not configured. You can still browse the app interface! 😸🎮')
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
        setMessage('Account created successfully! Please check your email to verify your account. 📧✨')
      } else if (mode === 'signin') {
        await signIn(email, password)
      } else if (mode === 'reset') {
        await resetPassword(email)
        setMessage('Password reset email sent! Check your inbox. 📬💕')
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      let errorMessage = error.message || 'An error occurred. Please try again.'
      
      if (error.message.includes('Demo mode')) {
        errorMessage = 'Demo mode - Supabase authentication is not configured. You can still browse the landing page! 🎮😸'
      } else if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again. 🔐'
      } else if (error.message.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Please sign in instead. 📧'
      } else if (error.message.includes('Password should be at least 6 characters')) {
        errorMessage = 'Password must be at least 6 characters long. 🔒'
      } else if (error.message.includes('session') || error.message.includes('token')) {
        errorMessage = 'Session error detected. Cleaning up and retrying... 🔄'
        // Clean up corrupted sessions and retry
        authHelpers.cleanupCorruptedSessions()
        setTimeout(() => {
          setLoading(false)
          setMessage('Session cleaned up. Please try again. ✨')
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
      setMessage('Session refreshed successfully! ✨')
    } catch (error) {
      setMessage('Failed to refresh session. Please try signing in again. 🔄')
    } finally {
      setLoading(false)
    }
  }

  const displayMessage = message || error

  return (
    <div className="min-h-screen bg-cute-gradient flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating Cat Decorations */}
      <div className="fixed top-20 right-20 text-6xl opacity-10 float-animation pointer-events-none">
        🐱
      </div>
      <div className="fixed bottom-32 left-16 text-4xl opacity-15 float-animation pointer-events-none" style={{ animationDelay: '1s' }}>
        🐾
      </div>
      <div className="fixed top-1/3 left-10 text-3xl opacity-10 float-animation pointer-events-none" style={{ animationDelay: '2s' }}>
        😻
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl bg-gradient-to-r from-pink-400 to-purple-400 shadow-lg hover-bounce">
            😺
          </div>
          <h1 className="text-4xl font-bold text-cute-primary bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            Top Cat
          </h1>
          <p className="text-cute-secondary mt-2 font-medium">Rate the cutest cats in the world 🌟</p>
        </div>

        {/* Auth Form */}
        <div className="card-cute p-8">
          <div className="mb-6 text-center">
            <div className="text-3xl mb-3">
              {mode === 'signin' && '😸'}
              {mode === 'signup' && '🎉'}
              {mode === 'reset' && '🔐'}
            </div>
            <h2 className="text-2xl font-bold text-cute-primary">
              {mode === 'signin' && 'Welcome Back!'}
              {mode === 'signup' && 'Join Top Cat'}
              {mode === 'reset' && 'Reset Password'}
            </h2>
            <p className="text-cute-secondary mt-2">
              {mode === 'signin' && 'Sign in to start rating cats 💕'}
              {mode === 'signup' && 'Create your account to get started 🚀'}
              {mode === 'reset' && 'Enter your email to reset your password 📧'}
            </p>
          </div>

          {/* Demo Mode Warning */}
          {isDemoMode && (
            <div className="alert-cute-warning mb-6">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🎮</span>
                <div>
                  <p className="font-medium">Demo Mode Active</p>
                  <p className="text-sm">Supabase is not configured. Authentication is disabled, but you can explore the app interface! 😸</p>
                </div>
              </div>
            </div>
          )}

          {/* Error/Message Display */}
          {displayMessage && (
            <div className={`p-4 rounded-2xl mb-6 border-2 ${
              displayMessage.includes('error') || 
              displayMessage.includes('Error') || 
              displayMessage.includes('Demo mode') || 
              displayMessage.includes('Invalid') ||
              displayMessage.includes('Failed')
                ? 'alert-cute-error'
                : 'alert-cute-success'
            }`}>
              <div className="flex items-start">
                <span className="text-xl mr-2">
                  {displayMessage.includes('success') || displayMessage.includes('sent') ? '✅' : '⚠️'}
                </span>
                <div className="flex-1">
                  {displayMessage}
                </div>
                {displayMessage.includes('Session') && (
                  <button
                    onClick={handleRefreshSession}
                    disabled={loading}
                    className="ml-2 p-1 text-blue-600 hover:text-blue-800 disabled:opacity-50 rounded-full hover:bg-blue-100"
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
                <label htmlFor="username\" className="block text-sm font-medium text-cute-primary mb-2">
                  Username 😸
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-400 w-5 h-5" />
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input-cute w-full pl-10 pr-4 py-3"
                    placeholder="Choose a cute username"
                    required={mode === 'signup'}
                    disabled={isDemoMode || loading}
                    maxLength={30}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-cute-primary mb-2">
                Email 📧
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-400 w-5 h-5" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-cute w-full pl-10 pr-4 py-3"
                  placeholder="Enter your email"
                  required
                  disabled={isDemoMode || loading}
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-cute-primary mb-2">
                  Password 🔒
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-cute w-full pl-10 pr-12 py-3"
                    placeholder="Enter your password"
                    required
                    minLength={6}
                    disabled={isDemoMode || loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-pink-400 hover:text-pink-600 disabled:cursor-not-allowed rounded-full p-1 hover:bg-pink-50"
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
              className="btn-cute w-full py-4 text-lg font-medium"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="loading-paw text-2xl mr-2">🐾</div>
                  Loading...
                </div>
              ) : isDemoMode ? (
                <div className="flex items-center justify-center">
                  <span>Demo Mode - Authentication Disabled</span>
                  <span className="text-xl ml-2">🎮</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span>
                    {mode === 'signin' && 'Sign In'}
                    {mode === 'signup' && 'Create Account'}
                    {mode === 'reset' && 'Send Reset Email'}
                  </span>
                  <span className="text-xl ml-2">
                    {mode === 'signin' && '😸'}
                    {mode === 'signup' && '🎉'}
                    {mode === 'reset' && '📧'}
                  </span>
                </div>
              )}
            </button>
          </form>

          {/* Mode Switcher */}
          {!isDemoMode && (
            <div className="mt-6 text-center space-y-3">
              {mode === 'signin' && (
                <>
                  <p className="text-cute-secondary">
                    Don't have an account?{' '}
                    <button
                      onClick={() => setMode('signup')}
                      className="text-pink-500 hover:text-pink-600 font-medium underline"
                      disabled={loading}
                    >
                      Sign up 🎉
                    </button>
                  </p>
                  <button
                    onClick={() => setMode('reset')}
                    className="text-sm text-cute-secondary hover:text-cute-primary underline"
                    disabled={loading}
                  >
                    Forgot your password? 🔐
                  </button>
                </>
              )}

              {mode === 'signup' && (
                <p className="text-cute-secondary">
                  Already have an account?{' '}
                  <button
                    onClick={() => setMode('signin')}
                    className="text-pink-500 hover:text-pink-600 font-medium underline"
                    disabled={loading}
                  >
                    Sign in 😸
                  </button>
                </p>
              )}

              {mode === 'reset' && (
                <p className="text-cute-secondary">
                  Remember your password?{' '}
                  <button
                    onClick={() => setMode('signin')}
                    className="text-pink-500 hover:text-pink-600 font-medium underline"
                    disabled={loading}
                  >
                    Sign in 😸
                  </button>
                </p>
              )}
            </div>
          )}

          {/* Demo Mode Notice */}
          {isDemoMode && (
            <div className="mt-6 p-4 bg-blue-50 rounded-2xl border-2 border-blue-200">
              <p className="text-sm text-blue-800 text-center">
                <span className="text-lg mr-2">💡</span>
                <strong>Demo Mode:</strong> To enable authentication, configure your Supabase environment variables.
              </p>
            </div>
          )}
        </div>

        {/* Sample Cats Preview */}
        <div className="mt-8 text-center">
          <p className="text-cute-secondary mb-4 font-medium">
            {isDemoMode ? 'Explore the demo interface! 🎮😸' : 'Join thousands of cat lovers! 🐱💕'}
          </p>
          <div className="flex justify-center space-x-3">
            {[
              'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=150',
              'https://images.pexels.com/photos/416160/pexels-photo-416160.jpeg?auto=compress&cs=tinysrgb&w=150',
              'https://images.pexels.com/photos/1170986/pexels-photo-1170986.jpeg?auto=compress&cs=tinysrgb&w=150',
            ].map((src, index) => (
              <div key={index} className="relative">
                <img
                  src={src}
                  alt="Sample cat"
                  className="w-14 h-14 rounded-full object-cover border-4 border-white shadow-lg hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = `https://via.placeholder.com/56x56/ff6b35/ffffff?text=😸`
                  }}
                />
                <div className="absolute -top-1 -right-1 text-lg">
                  {['🧡', '🖤', '🤍'][index]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}