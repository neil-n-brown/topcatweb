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

// Check if localStorage is available
function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

const storage = isStorageAvailable() ? localStorage : new MemoryStorage()

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug logging to see what environment variables are available
console.log('Environment check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  url: supabaseUrl ? `${supabaseUrl.substring(0, 50)}...` : 'undefined',
  key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 50)}...` : 'undefined',
  nodeEnv: import.meta.env.MODE
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
      resetPasswordForEmail: () => Promise.resolve({ error: null })
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
        storage: storage,
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

export { supabase, isDemoMode }

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