import { supabase, isDemoMode } from './supabase'

export interface SwipeSession {
  id: string
  user_id: string
  started_at: string
  last_activity: string
  photos_shown: number
  is_active: boolean
}

export interface EnhancedCat {
  id: string
  user_id: string
  name: string
  description?: string
  caption?: string
  image_url: string
  upload_date: string
  cat_profile_id?: string
  username: string
  email?: string
  exposure_score?: number
  user?: {
    id: string
    email: string
    username: string
    created_at: string
  }
  cat_profile?: {
    id: string
    name: string
    profile_picture?: string
  }
}

export interface InteractionType {
  VIEW: 'view'
  SWIPE_LEFT: 'swipe_left'
  SWIPE_RIGHT: 'swipe_right'
  EMOJI_REACTION: 'emoji_reaction'
  REPORT: 'report'
}

export const INTERACTION_TYPES: InteractionType = {
  VIEW: 'view',
  SWIPE_LEFT: 'swipe_left',
  SWIPE_RIGHT: 'swipe_right',
  EMOJI_REACTION: 'emoji_reaction',
  REPORT: 'report'
}

// Demo cats for when Supabase is not configured
const demoCats: EnhancedCat[] = [
  {
    id: '1',
    user_id: 'demo',
    name: 'Whiskers',
    description: 'A fluffy orange tabby who loves to play',
    caption: 'Playing in the sunny garden 🌞',
    image_url: 'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=400',
    upload_date: new Date().toISOString(),
    username: 'demo_user',
    exposure_score: 0.5,
    user: { id: 'demo', email: 'demo@example.com', username: 'demo_user', created_at: new Date().toISOString() },
    cat_profile: { id: '1', name: 'Whiskers' }
  },
  {
    id: '2',
    user_id: 'demo',
    name: 'Luna',
    description: 'A beautiful black cat with green eyes',
    caption: 'Nap time in my favorite spot',
    image_url: 'https://images.pexels.com/photos/416160/pexels-photo-416160.jpeg?auto=compress&cs=tinysrgb&w=400',
    upload_date: new Date().toISOString(),
    username: 'cat_lover',
    exposure_score: 0.3,
    user: { id: 'demo', email: 'demo@example.com', username: 'cat_lover', created_at: new Date().toISOString() },
    cat_profile: { id: '2', name: 'Luna' }
  },
  {
    id: '3',
    user_id: 'demo',
    name: 'Mittens',
    description: 'Loves to sleep in sunny spots',
    image_url: 'https://images.pexels.com/photos/1170986/pexels-photo-1170986.jpeg?auto=compress&cs=tinysrgb&w=400',
    upload_date: new Date().toISOString(),
    username: 'kitty_fan',
    exposure_score: 0.8,
    user: { id: 'demo', email: 'demo@example.com', username: 'kitty_fan', created_at: new Date().toISOString() },
    cat_profile: { id: '3', name: 'Mittens' }
  },
  {
    id: '4',
    user_id: 'demo',
    name: 'Shadow',
    caption: 'Being mysterious as always 🖤',
    image_url: 'https://images.pexels.com/photos/2071882/pexels-photo-2071882.jpeg?auto=compress&cs=tinysrgb&w=400',
    upload_date: new Date().toISOString(),
    username: 'shadow_lover',
    exposure_score: 0.2,
    user: { id: 'demo', email: 'demo@example.com', username: 'shadow_lover', created_at: new Date().toISOString() },
    cat_profile: { id: '4', name: 'Shadow' }
  },
  {
    id: '5',
    user_id: 'demo',
    name: 'Fluffy',
    caption: 'Just had my grooming session! ✨',
    image_url: 'https://images.pexels.com/photos/1741205/pexels-photo-1741205.jpeg?auto=compress&cs=tinysrgb&w=400',
    upload_date: new Date().toISOString(),
    username: 'fluffy_mom',
    exposure_score: 0.6,
    user: { id: 'demo', email: 'demo@example.com', username: 'fluffy_mom', created_at: new Date().toISOString() },
    cat_profile: { id: '5', name: 'Fluffy' }
  }
]

class SwipeService {
  private currentSession: SwipeSession | null = null
  private demoInteractions: Set<string> = new Set()

  /**
   * Get randomized cats for the current user session
   */
  async getRandomizedCats(
    userId: string, 
    limit: number = 20, 
    excludeInteracted: boolean = true
  ): Promise<EnhancedCat[]> {
    try {
      if (isDemoMode) {
        return this.getDemoCats(limit, excludeInteracted)
      }

      // Get or create current session
      const session = await this.getCurrentSession(userId)
      
      // Call the database function for smart randomization
      const { data, error } = await supabase.rpc('get_randomized_cats_for_user', {
        p_user_id: userId,
        p_session_id: session.id,
        p_limit: limit,
        p_exclude_interacted: excludeInteracted
      })

      if (error) {
        console.error('Error fetching randomized cats:', error)
        throw error
      }

      // Transform the data to include user and cat_profile information
      const enhancedCats: EnhancedCat[] = (data || []).map((cat: any) => ({
        ...cat,
        user: {
          id: cat.user_id,
          email: cat.email,
          username: cat.username,
          created_at: cat.upload_date // Fallback
        },
        cat_profile: cat.cat_profile_id ? {
          id: cat.cat_profile_id,
          name: cat.name
        } : undefined
      }))

      return enhancedCats
    } catch (error) {
      console.error('Error in getRandomizedCats:', error)
      // Fallback to demo cats on error
      return this.getDemoCats(limit, excludeInteracted)
    }
  }

  /**
   * Record a user interaction with a cat photo
   */
  async recordInteraction(
    userId: string,
    catId: string,
    interactionType: string,
    emojiType?: string
  ): Promise<string | null> {
    try {
      if (isDemoMode) {
        this.demoInteractions.add(`${userId}-${catId}-${interactionType}`)
        console.log(`Demo interaction recorded: ${interactionType} on cat ${catId}`)
        return `demo-${Date.now()}`
      }

      const session = await this.getCurrentSession(userId)

      const { data, error } = await supabase.rpc('record_user_interaction', {
        p_user_id: userId,
        p_cat_id: catId,
        p_interaction_type: interactionType,
        p_session_id: session.id,
        p_emoji_type: emojiType
      })

      if (error) {
        console.error('Error recording interaction:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in recordInteraction:', error)
      return null
    }
  }

  /**
   * Get or create the current active session for a user
   */
  async getCurrentSession(userId: string): Promise<SwipeSession> {
    if (this.currentSession && this.currentSession.user_id === userId) {
      return this.currentSession
    }

    try {
      // Try to get existing active session
      const { data: existingSessions, error: fetchError } = await supabase
        .from('swipe_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_activity', { ascending: false })
        .limit(1)

      if (fetchError) {
        console.error('Error fetching session:', fetchError)
        throw fetchError
      }

      if (existingSessions && existingSessions.length > 0) {
        this.currentSession = existingSessions[0]
        return this.currentSession
      }

      // Create new session
      const { data: newSession, error: createError } = await supabase
        .from('swipe_sessions')
        .insert([{
          user_id: userId,
          session_type: 'swipe'
        }])
        .select()
        .single()

      if (createError) {
        console.error('Error creating session:', createError)
        throw createError
      }

      this.currentSession = newSession
      return this.currentSession
    } catch (error) {
      console.error('Error in getCurrentSession:', error)
      // Return a mock session for error cases
      return {
        id: `mock-${Date.now()}`,
        user_id: userId,
        started_at: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        photos_shown: 0,
        is_active: true
      }
    }
  }

  /**
   * Start a new session (refresh functionality)
   */
  async startNewSession(userId: string): Promise<SwipeSession> {
    try {
      if (isDemoMode) {
        this.demoInteractions.clear()
        return {
          id: `demo-${Date.now()}`,
          user_id: userId,
          started_at: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          photos_shown: 0,
          is_active: true
        }
      }

      // Deactivate current session
      if (this.currentSession) {
        await supabase
          .from('swipe_sessions')
          .update({ is_active: false })
          .eq('id', this.currentSession.id)
      }

      // Create new session
      const { data: newSession, error } = await supabase
        .from('swipe_sessions')
        .insert([{
          user_id: userId,
          session_type: 'swipe'
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating new session:', error)
        throw error
      }

      this.currentSession = newSession
      return this.currentSession
    } catch (error) {
      console.error('Error in startNewSession:', error)
      throw error
    }
  }

  /**
   * Get user interaction statistics
   */
  async getUserStats(userId: string): Promise<any> {
    try {
      if (isDemoMode) {
        return {
          cats_viewed: this.demoInteractions.size,
          swipes_right: 0,
          swipes_left: 0,
          emoji_reactions: 0,
          total_sessions: 1,
          last_activity: new Date().toISOString()
        }
      }

      const { data, error } = await supabase
        .from('user_interaction_stats')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user stats:', error)
        throw error
      }

      return data || {
        cats_viewed: 0,
        swipes_right: 0,
        swipes_left: 0,
        emoji_reactions: 0,
        total_sessions: 0,
        last_activity: null
      }
    } catch (error) {
      console.error('Error in getUserStats:', error)
      return null
    }
  }

  /**
   * Demo mode cat randomization
   */
  private getDemoCats(limit: number, excludeInteracted: boolean): EnhancedCat[] {
    let availableCats = [...demoCats]

    if (excludeInteracted) {
      availableCats = availableCats.filter(cat => 
        !this.demoInteractions.has(`demo-${cat.id}-view`)
      )
    }

    // Shuffle array for randomization
    for (let i = availableCats.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableCats[i], availableCats[j]] = [availableCats[j], availableCats[i]]
    }

    return availableCats.slice(0, limit)
  }

  /**
   * Clear current session (for logout or reset)
   */
  clearSession(): void {
    this.currentSession = null
    this.demoInteractions.clear()
  }
}

// Export singleton instance
export const swipeService = new SwipeService()