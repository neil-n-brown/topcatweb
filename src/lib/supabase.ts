import { createClient } from '@supabase/supabase-js'

// Simple memory storage fallback
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

  clear(): void {
    this.storage = {}
  }

  get length(): number {
    return Object.keys(this.storage).length
  }

  key(index: number): string | null {
    const keys = Object.keys(this.storage)
    return keys[index] || null
  }
}

// Simplified storage with caching
class SafeStorage {
  private storage: Storage | MemoryStorage
  private isLocalStorageAvailable: boolean | null = null

  constructor() {
    this.storage = this.selectBestStorage()
  }

  private checkLocalStorageAvailability(): boolean {
    if (this.isLocalStorageAvailable !== null) {
      return this.isLocalStorageAvailable
    }

    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        this.isLocalStorageAvailable = false
        return false
      }
      
      const test = '__storage_test__'
      window.localStorage.setItem(test, test)
      window.localStorage.removeItem(test)
      this.isLocalStorageAvailable = true
      return true
    } catch (error) {
      this.isLocalStorageAvailable = false
      return false
    }
  }

  private selectBestStorage(): Storage | MemoryStorage {
    if (this.checkLocalStorageAvailability()) {
      return window.localStorage
    } else {
      console.warn('Using memory storage fallback')
      return new MemoryStorage()
    }
  }

  getItem(key: string): string | null {
    try {
      return this.storage.getItem(key)
    } catch (error) {
      console.warn('Error reading from storage:', error)
      return null
    }
  }

  setItem(key: string, value: string): void {
    try {
      this.storage.setItem(key, value)
    } catch (error) {
      console.warn('Error writing to storage:', error)
    }
  }

  removeItem(key: string): void {
    try {
      this.storage.removeItem(key)
    } catch (error) {
      console.warn('Error removing from storage:', error)
    }
  }

  get isAvailable(): boolean {
    return this.isLocalStorageAvailable ?? false
  }

  get storageType(): string {
    return this.isAvailable ? 'localStorage' : 'memory'
  }
}

// Create safe storage instance
const safeStorage = new SafeStorage()

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

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

if (isDemoMode) {
  console.warn('Supabase environment variables not found. Using mock client.')
  
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
  } catch (error) {
    console.error('Error creating Supabase client:', error)
    throw error
  }
}

// Simplified auth helpers
export const authHelpers = {
  getStorageInfo: () => ({
    type: safeStorage.storageType,
    available: safeStorage.isAvailable
  }),
  testStorageAccess: () => {
    try {
      const testKey = '__storage_access_test__'
      const testValue = Date.now().toString()
      
      safeStorage.setItem(testKey, testValue)
      const retrieved = safeStorage.getItem(testKey)
      safeStorage.removeItem(testKey)
      
      return retrieved === testValue
    } catch (error) {
      return false
    }
  },
  cleanupCorruptedSessions: () => {
    // Only attempt cleanup if we're using actual localStorage
    if (safeStorage.storageType !== 'localStorage') {
      console.log('Skipping session cleanup - not using localStorage')
      return
    }

    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return
      }

      const keysToRemove: string[] = []
      
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i)
        if (key && key.includes('supabase') && key.includes('auth')) {
          try {
            const data = window.localStorage.getItem(key)
            if (!data || data.trim() === '' || data === 'null' || data === 'undefined') {
              keysToRemove.push(key)
            }
          } catch (error) {
            keysToRemove.push(key)
          }
        }
      }
      
      keysToRemove.forEach(key => {
        try {
          window.localStorage.removeItem(key)
        } catch (error) {
          console.warn('Error removing corrupted key:', key)
        }
      })
    } catch (error) {
      console.warn('Error during session cleanup:', error)
    }
  }
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