import { createClient } from '@supabase/supabase-js'

// Enhanced storage fallback for when localStorage is blocked or restricted
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

// Robust safe storage with comprehensive error handling
class SafeStorage {
  private storage: Storage | MemoryStorage
  private isLocalStorageAvailable: boolean
  private hasStorageAccess: boolean = false

  constructor() {
    this.isLocalStorageAvailable = this.checkLocalStorageAvailability()
    this.hasStorageAccess = this.checkStorageAccess()
    this.storage = this.selectBestStorage()
  }

  private checkLocalStorageAvailability(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false
      }
      
      const test = '__storage_test__'
      window.localStorage.setItem(test, test)
      window.localStorage.removeItem(test)
      return true
    } catch (error) {
      console.warn('localStorage not available:', error)
      return false
    }
  }

  private checkStorageAccess(): boolean {
    if (!this.isLocalStorageAvailable) return false
    
    try {
      // Test actual read/write operations
      const testKey = '__access_test__'
      const testValue = 'test'
      
      window.localStorage.setItem(testKey, testValue)
      const retrieved = window.localStorage.getItem(testKey)
      window.localStorage.removeItem(testKey)
      
      return retrieved === testValue
    } catch (error) {
      console.warn('Storage access blocked:', error)
      return false
    }
  }

  private selectBestStorage(): Storage | MemoryStorage {
    if (this.hasStorageAccess) {
      return window.localStorage
    } else {
      console.warn('Using memory storage fallback due to storage restrictions')
      return new MemoryStorage()
    }
  }

  getItem(key: string): string | null {
    try {
      return this.storage.getItem(key)
    } catch (error) {
      console.warn('Error reading from storage:', error)
      // If storage fails, try to switch to memory storage
      if (this.storage !== this.memoryFallback) {
        this.storage = this.memoryFallback
        return this.storage.getItem(key)
      }
      return null
    }
  }

  setItem(key: string, value: string): void {
    try {
      this.storage.setItem(key, value)
    } catch (error) {
      console.warn('Error writing to storage:', error)
      // If storage fails, switch to memory storage and try again
      if (this.storage !== this.memoryFallback) {
        this.storage = this.memoryFallback
        try {
          this.storage.setItem(key, value)
        } catch (memoryError) {
          console.error('Failed to write to memory storage:', memoryError)
        }
      }
    }
  }

  removeItem(key: string): void {
    try {
      this.storage.removeItem(key)
    } catch (error) {
      console.warn('Error removing from storage:', error)
      // If storage fails, try memory storage
      if (this.storage !== this.memoryFallback) {
        this.storage = this.memoryFallback
        try {
          this.storage.removeItem(key)
        } catch (memoryError) {
          console.error('Failed to remove from memory storage:', memoryError)
        }
      }
    }
  }

  private memoryFallback = new MemoryStorage()

  // Conservative cleanup - only remove obviously corrupted data
  cleanupCorruptedSessions(): void {
    if (!this.hasStorageAccess) {
      console.log('Storage access blocked, skipping cleanup')
      return
    }

    try {
      const keysToRemove: string[] = []
      
      // Only check localStorage if we have access
      if (this.isLocalStorageAvailable && this.hasStorageAccess) {
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i)
          if (key && key.includes('supabase') && key.includes('auth')) {
            try {
              const data = window.localStorage.getItem(key)
              // Only remove if data is clearly corrupted (null, empty, or not JSON)
              if (!data || data.trim() === '' || data === 'null' || data === 'undefined') {
                keysToRemove.push(key)
              } else {
                try {
                  JSON.parse(data)
                  // If it parses as JSON, leave it alone
                } catch {
                  // Only remove if it's not valid JSON at all
                  keysToRemove.push(key)
                }
              }
            } catch (error) {
              console.warn('Error checking storage key:', key, error)
            }
          }
        }
        
        if (keysToRemove.length > 0) {
          console.log(`Cleaning up ${keysToRemove.length} clearly corrupted session entries`)
          keysToRemove.forEach(key => {
            try {
              window.localStorage.removeItem(key)
            } catch (error) {
              console.warn('Error removing corrupted key:', key, error)
            }
          })
        }
      }
    } catch (error) {
      console.warn('Error during session cleanup:', error)
    }
  }

  get isAvailable(): boolean {
    return this.hasStorageAccess
  }

  get storageType(): string {
    return this.hasStorageAccess ? 'localStorage' : 'memory'
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
  storageType: safeStorage.storageType,
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

// Retry helper for auth operations
const retryAuthOperation = async (operation: () => Promise<any>, maxRetries = 2): Promise<any> => {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation()
      return result
    } catch (error: any) {
      lastError = error
      console.warn(`Auth operation attempt ${attempt} failed:`, error)
      
      // Wait before retrying
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
        flowType: 'pkce',
        // Add additional error handling for storage issues
        storageKey: 'sb-auth-token',
        // Reduce token refresh frequency to avoid storage conflicts
        refreshTokenRotationEnabled: true,
        // Add debug logging for auth events
        debug: import.meta.env.DEV
      },
      // Add global error handling
      global: {
        headers: {
          'X-Client-Info': 'top-cat-web'
        }
      }
    })
    
    console.log('Supabase client created successfully with storage type:', safeStorage.storageType)
    
    // Add error event listener for storage issues
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key && e.key.includes('supabase')) {
          console.log('Storage event detected:', e.key, e.newValue ? 'updated' : 'removed')
        }
      })
      
      // Handle storage quota exceeded errors
      window.addEventListener('error', (e) => {
        if (e.message && e.message.includes('storage')) {
          console.warn('Storage error detected:', e.message)
          // Could trigger a storage cleanup here if needed
        }
      })
    }
    
  } catch (error) {
    console.error('Error creating Supabase client:', error)
    throw error
  }
}

// Enhanced auth helpers with better error handling
export const authHelpers = {
  validateSession,
  retryAuthOperation,
  cleanupCorruptedSessions: () => {
    try {
      safeStorage.cleanupCorruptedSessions()
    } catch (error) {
      console.warn('Error during session cleanup:', error)
    }
  },
  getStorageInfo: () => ({
    type: safeStorage.storageType,
    available: safeStorage.isAvailable
  }),
  // Test storage access
  testStorageAccess: () => {
    try {
      const testKey = '__storage_access_test__'
      const testValue = Date.now().toString()
      
      safeStorage.setItem(testKey, testValue)
      const retrieved = safeStorage.getItem(testKey)
      safeStorage.removeItem(testKey)
      
      return retrieved === testValue
    } catch (error) {
      console.warn('Storage access test failed:', error)
      return false
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