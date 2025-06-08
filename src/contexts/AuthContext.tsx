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

// Error boundary component for auth-related errors
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
    
    // Clean up corrupted sessions when auth errors occur
    authHelpers.cleanupCorruptedSessions()
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

  // Session refresh interval
  useEffect(() => {
    if (isDemoMode) return

    const interval = setInterval(async () => {
      try {
        const session = await authHelpers.validateSession(supabase)
        if (!session && user) {
          console.log('Session expired, signing out user')
          await handleSignOut(false) // Don't call supabase.auth.signOut() as session is already invalid
        }
      } catch (error) {
        console.error('Session validation error:', error)
      }
    }, 5 * 60 * 1000) // Check every 5 minutes

    return () => clearInterval(interval)
  }, [user])

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

    // Initialize auth with improved error handling
    const initializeAuth = async () => {
      try {
        console.log('Initializing Supabase auth...')
        
        // Clean up any corrupted sessions first
        authHelpers.cleanupCorruptedSessions()
        
        const session = await authHelpers.retryAuthOperation(async () => {
          const { data: { session }, error } = await supabase.auth.getSession()
          if (error) throw error
          return session
        })
        
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
        setError('Failed to initialize authentication. Please refresh the page.')
        
        // Clean up corrupted data
        authHelpers.cleanupCorruptedSessions()
        
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes with better error handling
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
            } catch (error) {
              console.error('Error fetching profile after auth change:', error)
              setError('Failed to load user profile')
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
      setError('Failed to set up authentication listener')
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
      
      const { data, error } = await authHelpers.retryAuthOperation(async () => {
        return await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()
      })

      if (error) {
        console.error('Error fetching user profile:', error)
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
      setUser(null)
      setError('Failed to load user profile')
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
    
    const { data, error } = await authHelpers.retryAuthOperation(async () => {
      return await supabase.auth.signUp({
        email,
        password,
      })
    })

    if (error) {
      console.error('Sign up error:', error)
      setError(error.message)
      throw error
    }

    console.log('Sign up successful, creating profile...')

    if (data.user) {
      // Create user profile
      const { error: profileError } = await authHelpers.retryAuthOperation(async () => {
        return await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email: data.user.email!,
              username,
            },
          ])
      })

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

    const { error } = await authHelpers.retryAuthOperation(async () => {
      return await supabase.auth.signInWithPassword({
        email,
        password,
      })
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
    
    // Clean up any corrupted session data
    authHelpers.cleanupCorruptedSessions()
    
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
    
    const { error } = await authHelpers.retryAuthOperation(async () => {
      return await supabase.auth.resetPasswordForEmail(email)
    })
    
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
        setError('Session expired. Please sign in again.')
        await handleSignOut(false)
        return
      }
      
      if (data.session?.user) {
        await fetchUserProfile(data.session.user.id)
      }
      
      console.log('Session refreshed successfully')
    } catch (error: any) {
      console.error('Session refresh failed:', error)
      setError('Failed to refresh session')
      await handleSignOut(false)
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