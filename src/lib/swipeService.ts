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

// Clean demo cats for when Supabase is not configured - only high-quality, realistic entries
const demoCats: EnhancedCat[] = [
  {
    id: '1',
    user_id: 'demo',
    name: 'Whiskers',
    description: 'A fluffy orange tabby who loves to play',
    caption: 'Playing in the sunny garden 🌞',
    image_url: 'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=400',
    upload_date: new Date().toISOString(),
    username: 'sarah_catlover',
    exposure_score: 0.5,
    priority_level: 1,
    user: { id: 'demo', email: 'sarah@test.com', username: 'sarah_catlover', created_at: new Date().toISOString() },
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
    username: 'emma_kitty',
    exposure_score: 0.3,
    priority_level: 1,
    user: { id: 'demo', email: 'emma@test.com', username: 'emma_kitty', created_at: new Date().toISOString() },
    cat_profile: { id: '2', name: 'Luna' }
  },
  {
    id: '3',
    user_id: 'demo',
    name: 'Mittens',
    description: 'Loves to sleep in sunny spots',
    caption: 'Best nap spot ever found! 😴',
    image_url: 'https://images.pexels.com/photos/1170986/pexels-photo-1170986.jpeg?auto=compress&cs=tinysrgb&w=400',
    upload_date: new Date().toISOString(),
    username: 'mia_meow',
    exposure_score: 0.8,
    priority_level: 2,
    user: { id: 'demo', email: 'mia@test.com', username: 'mia_meow', created_at: new Date().toISOString() },
    cat_profile: { id: '3', name: 'Mittens' }
  },
  {
    id: '4',
    user_id: 'demo',
    name: 'Shadow',
    caption: 'Being mysterious as always 🖤',
    image_url: 'https://images.pexels.com/photos/2071882/pexels-photo-2071882.jpeg?auto=compress&cs=tinysrgb&w=400',
    upload_date: new Date().toISOString(),
    username: 'lily_pawsome',
    exposure_score: 0.2,
    priority_level: 1,
    user: { id: 'demo', email: 'lily@test.com', username: 'lily_pawsome', created_at: new Date().toISOString() },
    cat_profile: { id: '4', name: 'Shadow' }
  },
  {
    id: '5',
    user_id: 'demo',
    name: 'Fluffy',
    caption: 'Just had my grooming session! ✨',
    image_url: 'https://images.pexels.com/photos/1741205/pexels-photo-1741205.jpeg?auto=compress&cs=tinysrgb&w=400',
    upload_date: new Date().toISOString(),
    username: 'zoe_feline',
    exposure_score: 0.6,
    priority_level: 2,
    user: { id: 'demo', email: 'zoe@test.com', username: 'zoe_feline', created_at: new Date().toISOString() },
    cat_profile: { id: '5', name: 'Fluffy' }
  },
  {
    id: '6',
    user_id: 'demo',
    name: 'Oreo',
    caption: 'Black and white and cute all over! 🖤🤍',
    image_url: 'https://images.pexels.com/photos/1056251/pexels-photo-1056251.jpeg?auto=compress&cs=tinysrgb&w=400',
    upload_date: new Date().toISOString(),
    username: 'grace_whiskers',
    exposure_score: 0.4,
    priority_level: 1,
    user: { id: 'demo', email: 'grace@test.com', username: 'grace_whiskers', created_at: new Date().toISOString() },
    cat_profile: { id: '6', name: 'Oreo' }
  },
  {
    id: '7',
    user_id: 'demo',
    name: 'Ginger',
    caption: 'Orange you glad to see me? 🧡',
    image_url: 'https://images.pexels.com/photos/1643457/pexels-photo-1643457.jpeg?auto=compress&cs=tinysrgb&w=400',
    upload_date: new Date().toISOString(),
    username: 'ava_purr',
    exposure_score: 0.7,
    priority_level: 2,
    user: { id: 'demo', email: 'ava@test.com', username: 'ava_purr', created_at: new Date().toISOString() },
    cat_profile: { id: '7', name: 'Ginger' }
  },
  {
    id: '8',
    user_id: 'demo',
    name: 'Snowball',
    caption: 'Pure white fluffiness! ❄️',
    image_url: 'https://images.pexels.com/photos/2194261/pexels-photo-2194261.jpeg?auto=compress&cs=tinysrgb&w=400',
    upload_date: new Date().toISOString(),
    username: 'chloe_cats',
    exposure_score: 0.3,
    priority_level: 1,
    user: { id: 'demo', email: 'chloe@test.com', username: 'chloe_cats', created_at: new Date().toISOString() },
    cat_profile: { id: '8', name: 'Snowball' }
  },
  {
    id: '9',
    user_id: 'demo',
    name: 'Tiger',
    caption: 'Stripes and attitude! 🐅',
    image_url: 'https://images.pexels.com/photos/1276553/pexels-photo-1276553.jpeg?auto=compress&cs=tinysrgb&w=400',
    upload_date: new Date().toISOString(),
    username: 'maya_meows',
    exposure_score: 0.5,
    priority_level: 1,
    user: { id: 'demo', email: 'maya@test.com', username: 'maya_meows', created_at: new Date().toISOString() },
    cat_profile: { id: '9', name: 'Tiger' }
  },
  {
    id: '10',
    user_id: 'demo',
    name: 'Princess',
    caption: 'Royalty demands attention! 👑',
    image_url: 'https://images.pexels.com/photos/1404819/pexels-photo-1404819.jpeg?auto=compress&cs=tinysrgb&w=400',
    upload_date: new Date().toISOString(),
    username: 'ruby_furbaby',
    exposure_score: 0.6,
    priority_level: 2,
    user: { id: 'demo', email: 'ruby@test.com', username: 'ruby_furbaby', created_at: new Date().toISOString() },
    cat_profile: { id: '10', name: 'Princess' }
  },
  {
    id: '11',
    user_id: 'demo',
    name: 'Smokey',
    caption: 'Gray and gorgeous! 💨',
    image_url: 'https://images.pexels.com/photos/1314550/pexels-photo-1314550.jpeg?auto=compress&cs=tinysrgb&w=400',
    upload_date: new Date().toISOString(),
    username: 'sophia_kitties',
    exposure_score: 0.4,
    priority_level: 1,
    user: { id: 'demo', email: 'sophia@test.com', username: 'sophia_kitties', created_at: new Date().toISOString() },
    cat_profile: { id: '11', name: 'Smokey' }
  },
  {
    id: '12',
    user_id: 'demo',
    name: 'Patches',
    caption: 'Perfectly patched! 🎨',
    image_url: 'https://images.pexels.com/photos/1571076/pexels-photo-1571076.jpeg?auto=compress&cs=tinysrgb&w=400',
    upload_date: new Date().toISOString(),
    username: 'hannah_paws',
    exposure_score: 0.7,
    priority_level: 2,
    user: { id: 'demo', email: 'hannah@test.com', username: 'hannah_paws', created_at: new Date().toISOString() },
    cat_profile: { id: '12', name: 'Patches' }
  },
  {
    id: '13',
    user_id: 'demo',
    name: 'Coco',
    caption: 'Sweet like chocolate! 🍫',
    image_url: 'https://images.pexels.com/photos/1183434/pexels-photo-1183434.jpeg?auto=compress&cs=tinysrgb&w=400',
    upload_date: new Date().toISOString(),
    username: 'olivia_catmom',
    exposure_score: 0.5,
    priority_level: 1,
    user: { id: 'demo', email: 'olivia@test.com', username: 'olivia_catmom', created_at: new Date().toISOString() },
    cat_profile: { id: '13', name: 'Coco' }
  },
  {
    id: '14',
    user_id: 'demo',
    name: 'Daisy',
    caption: 'Fresh as a flower! 🌼',
    image_url: 'https://images.pexels.com/photos/1444321/pexels-photo-1444321.jpeg?auto=compress&cs=tinysrgb&w=400',
    upload_date: new Date().toISOString(),
    username: 'natalie_fluff',
    exposure_score: 0.3,
    priority_level: 1,
    user: { id: 'demo', email: 'natalie@test.com', username: 'natalie_fluff', created_at: new Date().toISOString() },
    cat_profile: { id: '14', name: 'Daisy' }
  },
  {
    id: '15',
    user_id: 'demo',
    name: 'Felix',
    caption: 'Classic black and white charm! 🎭',
    image_url: 'https://images.pexels.com/photos/1661535/pexels-photo-1661535.jpeg?auto=compress&cs=tinysrgb&w=400',
    upload_date: new Date().toISOString(),
    username: 'jessica_purrs',
    exposure_score: 0.6,
    priority_level: 2,
    user: { id: 'demo', email: 'jessica@test.com', username: 'jessica_purrs', created_at: new Date().toISOString() },
    cat_profile: { id: '15', name: 'Felix' }
  },
  {
    id: '16',
    user_id: 'demo',
    name: 'Jasper',
    caption: 'Handsome and he knows it! 😎',
    image_url: 'https://images.pexels.com/photos/1687831/pexels-photo-1687831.jpeg?auto=compress&cs=tinysrgb&w=400',
    upload_date: new Date().toISOString(),
    username: 'amanda_whiskers',
    exposure_score: 0.4,
    priority_level: 1,
    user: { id: 'demo', email: 'amanda@test.com', username: 'amanda_whiskers', created_at: new Date().toISOString() },
    cat_profile: { id: '16', name: 'Jasper' }
  },
  {
    id: '17',
    user_id: 'demo',
    name: 'Ruby',
    caption: 'Precious like a gem! 💎',
    image_url: 'https://images.pexels.com/photos/1741206/pexels-photo-1741206.jpeg?auto=compress&cs=tinysrgb&w=400',
    upload_date: new Date().toISOString(),
    username: 'rachel_kitty',
    exposure_score: 0.7,
    priority_level: 2,
    user: { id: 'demo', email: 'rachel@test.com', username: 'rachel_kitty', created_at: new Date().toISOString() },
    cat_profile: { id: '17', name: 'Ruby' }
  },
  {
    id: '18',
    user_id: 'demo',
    name: 'Oscar',
    caption: 'Award-winning cuteness! 🏆',
    image_url: 'https://images.pexels.com/photos/2061057/pexels-photo-2061057.jpeg?auto=compress&cs=tinysrgb&w=400',
    upload_date: new Date().toISOString(),
    username: 'kelly_feline',
    exposure_score: 0.5,
    priority_level: 1,
    user: { id: 'demo', email: 'kelly@test.com', username: 'kelly_feline', created_at: new Date().toISOString() },
    cat_profile: { id: '18', name: 'Oscar' }
  },
  {
    id: '19',
    user_id: 'demo',
    name: 'Rosie',
    caption: 'Pink nose, pink heart! 🌹',
    image_url: 'https://images.pexels.com/photos/2173872/pexels-photo-2173872.jpeg?auto=compress&cs=tinysrgb&w=400',
    upload_date: new Date().toISOString(),
    username: 'lauren_meow',
    exposure_score: 0.3,
    priority_level: 1,
    user: { id: 'demo', email: 'lauren@test.com', username: 'lauren_meow', created_at: new Date().toISOString() },
    cat_profile: { id: '19', name: 'Rosie' }
  },
  {
    id: '20',
    user_id: 'demo',
    name: 'Stella',
    caption: 'Shining bright like a star! ⭐',
    image_url: 'https://images.pexels.com/photos/2361952/pexels-photo-2361952.jpeg?auto=compress&cs=tinysrgb&w=400',
    upload_date: new Date().toISOString(),
    username: 'stephanie_paws',
    exposure_score: 0.6,
    priority_level: 2,
    user: { id: 'demo', email: 'stephanie@test.com', username: 'stephanie_paws', created_at: new Date().toISOString() },
    cat_profile: { id: '20', name: 'Stella' }
  }
]

class SwipeService {
  private currentSession: SwipeSession | null = null
  private demoInteractions: Map<string, Set<string>> = new Map() // userId -> Set of catIds
  private demoSessionCounter = 0

  /**
   * Get randomized cats for the current user session - ALWAYS returns exactly 20 photos
   */
  async getRandomizedCats(
    userId: string, 
    limit: number = 20, 
    usePrioritization: boolean = true
  ): Promise<EnhancedCat[]> {
    try {
      if (isDemoMode) {
        return this.getDemoCats(userId, limit, usePrioritization)
      }

      // Get or create current session
      const session = await this.getCurrentSession(userId)
      
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

      // Filter out any cats that don't have valid users or have dummy usernames
      const validCats = enhancedCats.filter(cat => {
        // Ensure the cat has a valid username and it's not a dummy pattern
        const username = cat.username || cat.user?.username
        if (!username) return false
        
        // Filter out dummy usernames like user_1, user_2, etc.
        if (username.match(/^user_\d+$/)) return false
        
        // Ensure the cat has a valid user_id
        if (!cat.user_id || cat.user_id === 'demo') return false
        
        // Ensure the cat has an image URL
        if (!cat.image_url) return false
        
        return true
      })

      // If we don't have enough valid cats, fall back to demo cats
      if (validCats.length < limit) {
        console.warn(`Only ${validCats.length} valid cats available, supplementing with demo cats`)
        const demoSuplement = this.getDemoCats(userId, limit - validCats.length, usePrioritization)
        return [...validCats, ...demoSuplement]
      }

      return validCats.slice(0, limit)
    } catch (error) {
      console.error('Error in getRandomizedCats:', error)
      // Fallback to demo cats on error
      return this.getDemoCats(userId, limit, usePrioritization)
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
      // Handle demo mode first, before any Supabase operations
      if (isDemoMode) {
        if (!this.demoInteractions.has(userId)) {
          this.demoInteractions.set(userId, new Set())
        }
        this.demoInteractions.get(userId)!.add(`${catId}-${interactionType}`)
        console.log(`Demo interaction recorded: ${interactionType} on cat ${catId}`)
        return `demo-${Date.now()}`
      }

      // Validate that catId is a proper UUID format for non-demo mode
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(catId)) {
        console.warn(`Invalid cat ID format: ${catId}, skipping interaction`)
        return null
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
        this.demoSessionCounter++
        // Don't clear interactions completely, just start fresh session
        return {
          id: `demo-session-${this.demoSessionCounter}`,
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
        const userInteractions = this.demoInteractions.get(userId) || new Set()
        return {
          cats_viewed: userInteractions.size,
          swipes_right: Array.from(userInteractions).filter(i => i.includes('swipe_right')).length,
          swipes_left: Array.from(userInteractions).filter(i => i.includes('swipe_left')).length,
          emoji_reactions: Array.from(userInteractions).filter(i => i.includes('emoji_reaction')).length,
          total_sessions: this.demoSessionCounter,
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
   * Get photo priority statistics for debugging
   */
  async getPhotoPriorityStats(userId: string): Promise<any> {
    try {
      if (isDemoMode) {
        return [
          { priority_level: 1, photo_count: 15, description: 'Never seen' },
          { priority_level: 2, photo_count: 3, description: 'Seen but no interaction' },
          { priority_level: 3, photo_count: 2, description: 'Previously interacted' }
        ]
      }

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
   * Demo mode cat selection with smart prioritization - ALWAYS returns exactly 20 cats
   */
  private getDemoCats(userId: string, limit: number, usePrioritization: boolean): EnhancedCat[] {
    const userInteractions = this.demoInteractions.get(userId) || new Set()
    
    if (!usePrioritization) {
      // Simple randomization
      const shuffled = [...demoCats].sort(() => Math.random() - 0.5)
      return shuffled.slice(0, Math.min(limit, shuffled.length))
    }

    // Smart prioritization for demo mode
    const categorizedCats = {
      neverSeen: [] as EnhancedCat[],
      seenButNoInteraction: [] as EnhancedCat[],
      previouslyInteracted: [] as EnhancedCat[]
    }

    demoCats.forEach(cat => {
      const hasAnyInteraction = Array.from(userInteractions).some(interaction => 
        interaction.startsWith(cat.id)
      )
      const hasNonViewInteraction = Array.from(userInteractions).some(interaction => 
        interaction.startsWith(cat.id) && !interaction.includes('view')
      )

      if (!hasAnyInteraction) {
        categorizedCats.neverSeen.push({ ...cat, priority_level: 1 })
      } else if (!hasNonViewInteraction) {
        categorizedCats.seenButNoInteraction.push({ ...cat, priority_level: 2 })
      } else {
        categorizedCats.previouslyInteracted.push({ ...cat, priority_level: 3 })
      }
    })

    // Shuffle each category
    Object.values(categorizedCats).forEach(category => {
      category.sort(() => Math.random() - 0.5)
    })

    // Fill the limit with priority order
    const result: EnhancedCat[] = []
    
    // Priority 1: Never seen
    result.push(...categorizedCats.neverSeen.slice(0, limit - result.length))
    
    // Priority 2: Seen but no interaction
    if (result.length < limit) {
      result.push(...categorizedCats.seenButNoInteraction.slice(0, limit - result.length))
    }
    
    // Priority 3: Previously interacted
    if (result.length < limit) {
      result.push(...categorizedCats.previouslyInteracted.slice(0, limit - result.length))
    }

    // If we still don't have enough, cycle through all cats again
    if (result.length < limit) {
      const remaining = [...demoCats].filter(cat => 
        !result.some(r => r.id === cat.id)
      )
      remaining.sort(() => Math.random() - 0.5)
      result.push(...remaining.slice(0, limit - result.length))
    }

    return result.slice(0, limit)
  }

  /**
   * Clear current session (for logout or reset)
   */
  clearSession(): void {
    this.currentSession = null
    this.demoInteractions.clear()
    this.demoSessionCounter = 0
  }
}

// Export singleton instance
export const swipeService = new SwipeService()