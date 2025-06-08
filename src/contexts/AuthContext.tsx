import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase, User, isDemoMode } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  supabaseUser: SupabaseUser | null
  loading: boolean
  signUp: (email: string, password: string, username: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)

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
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          if (mounted) {
            setLoading(false)
          }
          return
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
      } catch (error) {
        console.error('Error initializing auth:', error)
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

          setSupabaseUser(session?.user ?? null)
          if (session?.user) {
            await fetchUserProfile(session.user.id)
          } else {
            setUser(null)
            setLoading(false)
          }
        }
      )
      subscription = data.subscription
    } catch (error) {
      console.error('Error setting up auth listener:', error)
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
        // If user profile doesn't exist, they might need to complete registration
        setUser(null)
      } else {
        console.log('User profile fetched successfully')
        setUser(data)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, username: string) => {
    if (isDemoMode) {
      throw new Error('Demo mode - Supabase not configured')
    }

    console.log('Attempting to sign up user...')
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      console.error('Sign up error:', error)
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
        throw profileError
      }
      
      console.log('Profile created successfully')
    }
  }

  const signIn = async (email: string, password: string) => {
    if (isDemoMode) {
      throw new Error('Demo mode - Supabase not configured')
    }

    console.log('Attempting to sign in user...')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Sign in error:', error)
      throw error
    }
    
    console.log('Sign in successful')
  }

  const signOut = async () => {
    if (isDemoMode) {
      // In demo mode, just clear the demo user
      setUser(null)
      return
    }

    console.log('Signing out user...')
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Sign out error:', error)
      throw error
    }
    console.log('Sign out successful')
  }

  const resetPassword = async (email: string) => {
    if (isDemoMode) {
      throw new Error('Demo mode - Supabase not configured')
    }

    console.log('Sending password reset email...')
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) {
      console.error('Password reset error:', error)
      throw error
    }
    console.log('Password reset email sent')
  }

  const value = {
    user,
    supabaseUser,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}