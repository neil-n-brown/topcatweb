import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase, User, isDemoMode } from '../lib/supabase'

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

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    let authSubscription: any = null

    const initializeAuth = async () => {
      try {
        // Handle demo mode immediately
        if (isDemoMode) {
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

        // Get initial session without blocking
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.warn('Session error:', sessionError.message)
          // Don't block on session errors, just continue
        }

        if (mounted) {
          setSupabaseUser(session?.user ?? null)
          
          if (session?.user) {
            // Fetch user profile in background
            fetchUserProfile(session.user.id).catch(console.error)
          } else {
            setLoading(false)
          }
        }

        // Set up auth listener
        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mounted) return

          setSupabaseUser(session?.user ?? null)
          
          if (session?.user) {
            fetchUserProfile(session.user.id).catch(console.error)
          } else {
            setUser(null)
            setLoading(false)
          }
        })
        
        authSubscription = data.subscription

      } catch (error: any) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setError('Authentication initialization failed')
          setLoading(false)
        }
      }
    }

    initializeAuth()

    return () => {
      mounted = false
      if (authSubscription) {
        authSubscription.unsubscribe()
      }
    }
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        setUser(null)
        setError('User profile not found')
      } else {
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
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      throw error
    }

    if (data.user) {
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
        setError('Failed to create user profile')
        throw profileError
      }
    }
  }

  const signIn = async (email: string, password: string) => {
    if (isDemoMode) {
      throw new Error('Demo mode - Supabase not configured')
    }

    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        throw error
      }
    } finally {
      // Don't set loading to false here - let auth state change handle it
    }
  }

  const signOut = async () => {
    try {
      if (!isDemoMode) {
        const { error } = await supabase.auth.signOut()
        if (error) {
          console.error('Sign out error:', error)
        }
      }
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      // Always clean up local state
      setUser(null)
      setSupabaseUser(null)
      setError(null)
    }
  }

  const resetPassword = async (email: string) => {
    if (isDemoMode) {
      throw new Error('Demo mode - Supabase not configured')
    }

    setError(null)
    
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    
    if (error) {
      setError(error.message)
      throw error
    }
  }

  const refreshSession = async () => {
    if (isDemoMode) return

    try {
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('Session refresh error:', error)
        setError('Session expired. Please sign in again.')
        await signOut()
        return
      }
      
      if (data.session?.user) {
        await fetchUserProfile(data.session.user.id)
      }
    } catch (error: any) {
      console.error('Session refresh failed:', error)
      setError('Failed to refresh session')
      await signOut()
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
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}