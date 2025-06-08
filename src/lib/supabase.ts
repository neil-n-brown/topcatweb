import { createClient } from '@supabase/supabase-js'

// Storage fallback for when localStorage is blocked
class MemoryStorage {
  private storage: { [key: string]: string } = {}

  getItem(key: string): string | null {
    return this.storage[key] || null
  }

  setItem(key: string, value: string): void {
    this.storage[key] = value
  }

  removeItem(key: string): void {
    delete this.storage[key]
  }
}

// Simplified safe storage without aggressive validation
class SafeStorage {
  private storage: Storage | MemoryStorage
  private isLocalStorageAvailable: boolean

  constructor() {
    this.isLocalStorageAvailable = this.checkLocalStorageAvailability()
    this.storage = this.isLocalStorageAvailable ? window.localStorage : new MemoryStorage()
  }

  private checkLocalStorageAvailability(): boolean {
    try {
      const test = '__storage_test__'
      window.localStorage.setItem(test, test)
      window.localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

  getItem(key: string): string | null {
    try {
      return this.storage.getItem(key)
    } catch (error) {
      console.error('Error reading from storage:', error)
      return null
    }
  }

  setItem(key: string, value: string): void {
    try {
      this.storage.setItem(key, value)
    } catch (error) {
      console.error('Error writing to storage:', error)
    }
  }

  removeItem(key: string): void {
    try {
      this.storage.removeItem(key)
    } catch (error) {
      console.error('Error removing from storage:', error)
    }
  }

  // Much more conservative cleanup - only remove obviously corrupted data
  cleanupCorruptedSessions(): void {
    if (!this.isLocalStorageAvailable) return

    try {
      const keysToRemove: string[] = []
      
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i)
        if (key && key.includes('supabase') && key.includes('auth')) {
          const data = window.localStorage.getItem(key)
          // Only remove if data is clearly corrupted (null, empty, or not JSON)
          if (!data || data.trim() === '' || data === 'null' || data === 'undefined') {
            keysToRemove.push(key)
          } else {
            try {
              JSON.parse(data)
              // If it parses as JSON, leave it alone - don't validate structure
            } catch {
              // Only remove if it's not valid JSON at all
              keysToRemove.push(key)
            }
          }
        }
      }
      
      if (keysToRemove.length > 0) {
        console.log(`Cleaning up ${keysToRemove.length} clearly corrupted session entries`)
        keysToRemove.forEach(key => {
          window.localStorage.removeItem(key)
        })
      }
    } catch (error) {
      console.error('Error during session cleanup:', error)
    }
  }

  get isAvailable(): boolean {
    return this.isLocalStorageAvailable
  }
}

// Create safe storage instance
const safeStorage = new SafeStorage()

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug logging to see what environment variables are available
console.log('Environment check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  url: supabaseUrl ? `${supabaseUrl.substring(0, 50)}...` : 'undefined',
  key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 50)}...` : 'undefined',
  nodeEnv: import.meta.env.MODE,
  storageAvailable: safeStorage.isAvailable
})

// Check if environment variables are properly configured
const isDemoMode = !supabaseUrl || 
                   !supabaseAnonKey || 
                   supabaseUrl === 'undefined' || 
                   supabaseAnonKey === 'undefined' ||
                   supabaseUrl.trim() === '' ||
                   supabaseAnonKey.trim() === '' ||
                   supabaseUrl === 'your-supabase-url' ||
                   supabaseAnonKey === 'your-supabase-anon-key'

let supabase: any

// Simple session validation - only check if session exists, don't validate structure
const validateSession = async (client: any) => {
  try {
    const { data: { session }, error } = await client.auth.getSession()
    
    if (error) {
      console.error('Session validation error:', error)
      return null
    }
    
    return session
  } catch (error) {
    console.error('Session validation failed:', error)
    return null
  }
}

// Simplified retry helper - less aggressive
const retryAuthOperation = async (operation: () => Promise<any>, maxRetries = 2): Promise<any> => {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation()
      return result
    } catch (error: any) {
      lastError = error
      console.warn(`Auth operation attempt ${attempt} failed:`, error)
      
      // Wait before retrying (shorter wait)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }
  
  throw lastError
}

if (isDemoMode) {
  console.warn('Supabase environment variables not found or invalid. Using mock client for preview.')
  
  // Create a mock Supabase client for preview purposes
  supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signUp: () => Promise.resolve({ data: null, error: new Error('Demo mode - Supabase not configured') }),
      signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Demo mode - Supabase not configured') }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ error: null }),
      refreshSession: () => Promise.resolve({ data: { session: null }, error: new Error('Demo mode') })
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: new Error('Demo mode') }),
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: null })
          })
        }),
        order: () => ({
          limit: () => Promise.resolve({ data: [], error: null }),
          ascending: () => ({
            limit: () => Promise.resolve({ data: [], error: null })
          })
        }),
        gte: () => ({
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: null })
          })
        }),
        neq: () => ({
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: null })
          })
        }),
        count: 'exact',
        head: true
      }),
      insert: () => Promise.resolve({ data: null, error: new Error('Demo mode') }),
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: new Error('Demo mode') })
      })
    }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: new Error('Demo mode') }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://via.placeholder.com/400x400/ff6b35/ffffff?text=Demo+Cat' } })
      })
    }
  }
} else {
  console.log('Supabase configured successfully')
  
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: safeStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    })
    
    console.log('Supabase client created successfully')
    
  } catch (error) {
    console.error('Error creating Supabase client:', error)
    throw error
  }
}

// Simplified auth helpers
export const authHelpers = {
  validateSession,
  retryAuthOperation,
  cleanupCorruptedSessions: () => safeStorage.cleanupCorruptedSessions()
}

export { supabase, isDemoMode, safeStorage }

// Database types
export interface User {
  id: string
  email: string
  username: string
  profile_pic?: string
  created_at: string
}

export interface Cat {
  id: string
  user_id: string
  name: string
  description?: string
  image_url: string
  upload_date: string
  cat_profile_id?: string
  user?: User
}

export interface Reaction {
  id: string
  user_id: string
  cat_id: string
  emoji_type: string
  created_at: string
}

export interface Report {
  id: string
  reporter_id: string
  cat_id: string
  reason: string
  status: 'pending' | 'resolved' | 'dismissed'
  created_at: string
}