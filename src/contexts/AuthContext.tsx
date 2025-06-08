import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase, User, isDemoMode, authHelpers } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  supabaseUser: SupabaseUser | null
  loading: boolean
  error: string | null
  signUp: (email: string, password: string, username: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  refreshSession: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Export the hook as a named export to ensure Fast Refresh compatibility
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Simplified error boundary component for auth-related errors
class AuthErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (error: Error) => void },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Auth error boundary caught error:', error, errorInfo)
    this.props.onError(error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
          <div className="text-center p-8 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Authentication Error</h2>
            <p className="text-gray-600 mb-4">
              There was an issue with authentication. Please try refreshing the page.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false })
                window.location.reload()
              }}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    // If we're in demo mode, create a demo user and skip auth initialization
    if (isDemoMode) {
      console.log('Demo mode detected, creating demo user')
      if (mounted) {
        const demoUser: User = {
          id: 'demo-user-id',
          email: 'demo@topcat.com',
          username: 'demo_user',
          created_at: new Date().toISOString()
        }
        setUser(demoUser)
        setLoading(false)
      }
      return
    }

    // Test storage access before initializing auth
    const storageInfo = authHelpers.getStorageInfo()
    console.log('Storage info:', storageInfo)
    
    if (!authHelpers.testStorageAccess()) {
      console.warn('Storage access limited, authentication may not persist between sessions')
    }

    // Initialize auth with enhanced error handling
    const initializeAuth = async () => {
      try {
        console.log('Initializing Supabase auth...')
        
        // Wrap session retrieval in try-catch to handle storage errors
        let session = null
        let sessionError = null
        
        try {
          const { data: sessionData, error } = await supabase.auth.getSession()
          session = sessionData?.session
          sessionError = error
        } catch (storageError: any) {
          console.warn('Storage error during session retrieval:', storageError)
          
          // If it's a storage access error, continue without session
          if (storageError.message?.includes('storage') || 
              storageError.message?.includes('Access to storage is not allowed')) {
            console.log('Continuing without stored session due to storage restrictions')
            session = null
            sessionError = null
          } else {
            throw storageError
          }
        }
        
        if (sessionError) {
          console.error('Error getting session:', sessionError)
          
          // Check if the error is related to invalid refresh token
          if (sessionError.message?.includes('Refresh Token Not Found') || 
              sessionError.message?.includes('Invalid Refresh Token') ||
              sessionError.message?.includes('refresh_token_not_found')) {
            console.log('Invalid refresh token detected, clearing session...')
            
            // Clear the corrupted session data
            try {
              await supabase.auth.signOut()
              console.log('Corrupted session cleared successfully')
            } catch (signOutError) {
              console.error('Error clearing corrupted session:', signOutError)
            }
            
            // Reset state to logged out
            if (mounted) {
              setUser(null)
              setSupabaseUser(null)
              setError('Your session has expired. Please sign in again.')
              setLoading(false)
            }
            return
          }
          
          // For other errors, don't throw but continue with initialization
          console.warn('Session error (continuing):', sessionError.message)
        }
        
        console.log('Session retrieved:', !!session)

        if (mounted) {
          setSupabaseUser(session?.user ?? null)
          if (session?.user) {
            console.log('User found, fetching profile...')
            await fetchUserProfile(session.user.id)
          } else {
            console.log('No user session found')
            setLoading(false)
          }
        }
      } catch (error: any) {
        console.error('Error initializing auth:', error)
        
        // Handle storage-related errors gracefully
        if (error.message?.includes('storage') || 
            error.message?.includes('Access to storage is not allowed')) {
          console.warn('Storage access blocked, continuing with limited functionality')
          if (mounted) {
            setUser(null)
            setSupabaseUser(null)
            setError('Storage access is limited. Authentication may not persist between sessions.')
            setLoading(false)
          }
          return
        }
        
        // Check if this is a refresh token error
        if (error.message?.includes('Refresh Token Not Found') || 
            error.message?.includes('Invalid Refresh Token') ||
            error.message?.includes('refresh_token_not_found')) {
          console.log('Refresh token error during initialization, clearing session...')
          
          try {
            await supabase.auth.signOut()
          } catch (signOutError) {
            console.error('Error clearing session after refresh token error:', signOutError)
          }
          
          if (mounted) {
            setUser(null)
            setSupabaseUser(null)
            setError('Your session has expired. Please sign in again.')
            setLoading(false)
          }
        } else {
          setError('Failed to initialize authentication. Please refresh the page.')
          if (mounted) {
            setLoading(false)
          }
        }
      }
    }

    initializeAuth()

    // Listen for auth changes with improved error handling
    let subscription: any
    try {
      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event, !!session)
          if (!mounted) return

          // Clear any previous errors on successful auth state change
          if (session) {
            setError(null)
          }

          setSupabaseUser(session?.user ?? null)
          
          if (session?.user) {
            try {
              await fetchUserProfile(session.user.id)
            } catch (error: any) {
              console.error('Error fetching profile after auth change:', error)
              
              // Handle refresh token errors in profile fetching
              if (error.message?.includes('Refresh Token Not Found') || 
                  error.message?.includes('Invalid Refresh Token')) {
                console.log('Refresh token error during profile fetch, signing out...')
                await handleSignOut(true)
                setError('Your session has expired. Please sign in again.')
              } else if (error.message?.includes('storage')) {
                console.warn('Storage error during profile fetch, continuing with limited functionality')
                setError('Storage access is limited. Some features may not work properly.')
              } else {
                setError('Failed to load user profile')
              }
            }
          } else {
            setUser(null)
            setLoading(false)
          }
        }
      )
      subscription = data.subscription
    } catch (error: any) {
      console.error('Error setting up auth listener:', error)
      if (error.message?.includes('storage')) {
        setError('Storage access is limited. Authentication may not work properly.')
      } else {
        setError('Failed to set up authentication listener')
      }
      if (mounted) {
        setLoading(false)
      }
    }

    return () => {
      mounted = false
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching user profile for:', userId)
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        
        // Check for refresh token errors in database queries
        if (error.message?.includes('Refresh Token Not Found') || 
            error.message?.includes('Invalid Refresh Token')) {
          throw new Error('Invalid Refresh Token')
        }
        
        // If user profile doesn't exist, they might need to complete registration
        setUser(null)
        setError('User profile not found. Please complete registration.')
      } else {
        console.log('User profile fetched successfully')
        setUser(data)
        setError(null)
      }
    } catch (error: any) {
      console.error('Error fetching user profile:', error)
      
      // Re-throw refresh token errors to be handled by caller
      if (error.message?.includes('Invalid Refresh Token') ||
          error.message?.includes('Refresh Token Not Found')) {
        throw error
      }
      
      // Handle storage errors gracefully
      if (error.message?.includes('storage')) {
        setUser(null)
        setError('Storage access is limited. Profile data may not load properly.')
      } else {
        setUser(null)
        setError('Failed to load user profile')
      }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, username: string) => {
    if (isDemoMode) {
      throw new Error('Demo mode - Supabase not configured')
    }

    setError(null)
    console.log('Attempting to sign up user...')
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      console.error('Sign up error:', error)
      setError(error.message)
      throw error
    }

    console.log('Sign up successful, creating profile...')

    if (data.user) {
      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: data.user.id,
            email: data.user.email!,
            username,
          },
        ])

      if (profileError) {
        console.error('Profile creation error:', profileError)
        setError('Failed to create user profile')
        throw profileError
      }
      
      console.log('Profile created successfully')
    }
  }

  const signIn = async (email: string, password: string) => {
    if (isDemoMode) {
      throw new Error('Demo mode - Supabase not configured')
    }

    setError(null)
    console.log('Attempting to sign in user...')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Sign in error:', error)
      setError(error.message)
      throw error
    }
    
    console.log('Sign in successful')
  }

  const handleSignOut = async (callSupabaseSignOut = true) => {
    console.log('Signing out user...')
    
    if (callSupabaseSignOut && !isDemoMode) {
      try {
        const { error } = await supabase.auth.signOut()
        if (error) {
          console.error('Sign out error:', error)
          // Don't throw error, still clean up local state
        }
      } catch (error) {
        console.error('Sign out error:', error)
      }
    }
    
    // Always clean up local state
    setUser(null)
    setSupabaseUser(null)
    setError(null)
    
    console.log('Sign out completed')
  }

  const signOut = async () => {
    await handleSignOut(true)
  }

  const resetPassword = async (email: string) => {
    if (isDemoMode) {
      throw new Error('Demo mode - Supabase not configured')
    }

    setError(null)
    console.log('Sending password reset email...')
    
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    
    if (error) {
      console.error('Password reset error:', error)
      setError(error.message)
      throw error
    }
    console.log('Password reset email sent')
  }

  const refreshSession = async () => {
    if (isDemoMode) return

    try {
      console.log('Refreshing session...')
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('Session refresh error:', error)
        
        // Handle refresh token errors specifically
        if (error.message?.includes('Refresh Token Not Found') || 
            error.message?.includes('Invalid Refresh Token') ||
            error.message?.includes('refresh_token_not_found')) {
          console.log('Invalid refresh token during manual refresh, signing out...')
          await handleSignOut(true)
          setError('Your session has expired. Please sign in again.')
        } else if (error.message?.includes('storage')) {
          console.warn('Storage error during session refresh')
          setError('Storage access is limited. Session refresh may not work properly.')
        } else {
          setError('Session expired. Please sign in again.')
          await handleSignOut(false)
        }
        return
      }
      
      if (data.session?.user) {
        try {
          await fetchUserProfile(data.session.user.id)
        } catch (profileError: any) {
          if (profileError.message?.includes('Invalid Refresh Token')) {
            console.log('Refresh token error during profile fetch after refresh, signing out...')
            await handleSignOut(true)
            setError('Your session has expired. Please sign in again.')
          } else {
            throw profileError
          }
        }
      }
      
      console.log('Session refreshed successfully')
    } catch (error: any) {
      console.error('Session refresh failed:', error)
      
      if (error.message?.includes('Invalid Refresh Token') ||
          error.message?.includes('Refresh Token Not Found')) {
        await handleSignOut(true)
        setError('Your session has expired. Please sign in again.')
      } else if (error.message?.includes('storage')) {
        setError('Storage access is limited. Session refresh may not work properly.')
      } else {
        setError('Failed to refresh session')
        await handleSignOut(false)
      }
    }
  }

  const clearError = () => {
    setError(null)
  }

  const value = {
    user,
    supabaseUser,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    resetPassword,
    refreshSession,
    clearError,
  }

  return (
    <AuthErrorBoundary onError={(error) => setError(error.message)}>
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    </AuthErrorBoundary>
  )
}