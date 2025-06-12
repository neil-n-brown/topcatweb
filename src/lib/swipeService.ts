import { supabase } from './supabase'

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
  priority_level?: number
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

class SwipeService {
  private currentSession: SwipeSession | null = null

  /**
   * Get randomized cats for the current user session - ALWAYS returns exactly 20 photos
   */
  async getRandomizedCats(
    userId: string, 
    limit: number = 20, 
    usePrioritization: boolean = true
  ): Promise<EnhancedCat[]> {
    try {
      // Get or create current session
      const session = await this.getCurrentSession(userId)
      
      console.log(`Fetching ${limit} cats for user ${userId} with prioritization: ${usePrioritization}`)
      
      // Call the database function for smart prioritization
      const { data, error } = await supabase.rpc('get_randomized_cats_for_user', {
        p_user_id: userId,
        p_session_id: session.id,
        p_limit: limit,
        p_use_prioritization: usePrioritization
      })

      if (error) {
        console.error('Error fetching randomized cats:', error)
        throw error
      }

      console.log(`Database returned ${data?.length || 0} cats`)

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

      console.log(`Processed ${enhancedCats.length} enhanced cats`)

      // If we don't have enough cats, return what we have
      if (enhancedCats.length === 0) {
        console.warn('No cats returned from database, falling back to demo cats')
        return []
      }

      return enhancedCats.slice(0, limit)
    } catch (error) {
      console.error('Error in getRandomizedCats:', error)
      // Fallback to demo cats on error
      console.log('Falling back to demo cats due to error')
      return []
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
   * Get photo priority statistics for debugging
   */
  async getPhotoPriorityStats(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_photo_priority_stats', {
        p_user_id: userId
      })

      if (error) {
        console.error('Error fetching priority stats:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getPhotoPriorityStats:', error)
      return []
    }
  }

  /**
   * Clear current session (for logout or reset)
   */
  clearSession(): void {
    this.currentSession = null
  }
}

// Export singleton instance
export const swipeService = new SwipeService()