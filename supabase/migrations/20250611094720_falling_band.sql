/*
  # Smart Swipe System - Fair Randomization and User Interaction Tracking

  1. New Tables
    - `user_interactions` - Track all user interactions with cat photos
    - `photo_exposure` - Track exposure metrics for fair distribution
    - `swipe_sessions` - Manage user swipe sessions

  2. Enhanced Features
    - Fair exposure algorithm
    - User interaction history
    - Session-based randomization
    - Performance optimization indexes

  3. Security
    - Enable RLS on all new tables
    - Proper user access controls
    - Privacy protection for user interactions
*/

-- User interactions table - tracks all user interactions with cat photos
CREATE TABLE IF NOT EXISTS user_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  cat_id uuid REFERENCES cats(id) ON DELETE CASCADE NOT NULL,
  interaction_type text NOT NULL CHECK (interaction_type IN ('view', 'swipe_left', 'swipe_right', 'emoji_reaction', 'report')),
  emoji_type text, -- Only used for emoji_reaction type
  session_id uuid, -- Groups interactions by session
  created_at timestamptz DEFAULT now(),
  
  -- Prevent duplicate interactions of same type in same session
  UNIQUE(user_id, cat_id, interaction_type, session_id)
);

-- Photo exposure tracking - ensures fair distribution
CREATE TABLE IF NOT EXISTS photo_exposure (
  cat_id uuid PRIMARY KEY REFERENCES cats(id) ON DELETE CASCADE,
  total_views bigint DEFAULT 0,
  total_interactions bigint DEFAULT 0,
  last_shown timestamptz DEFAULT now(),
  exposure_score decimal DEFAULT 0, -- Calculated score for fair distribution
  updated_at timestamptz DEFAULT now()
);

-- Swipe sessions - manages user swipe sessions
CREATE TABLE IF NOT EXISTS swipe_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  started_at timestamptz DEFAULT now(),
  last_activity timestamptz DEFAULT now(),
  photos_shown integer DEFAULT 0,
  is_active boolean DEFAULT true,
  session_type text DEFAULT 'swipe' CHECK (session_type IN ('swipe', 'browse'))
);

-- Enable RLS on all new tables
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_exposure ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipe_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_interactions
CREATE POLICY "Users can read own interactions"
  ON user_interactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interactions"
  ON user_interactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interactions"
  ON user_interactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for photo_exposure (read-only for users, system manages updates)
CREATE POLICY "Public can read photo exposure"
  ON photo_exposure
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- RLS Policies for swipe_sessions
CREATE POLICY "Users can manage own sessions"
  ON swipe_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_cat_id ON user_interactions(cat_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_session_id ON user_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON user_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_interactions_created_at ON user_interactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_photo_exposure_score ON photo_exposure(exposure_score ASC);
CREATE INDEX IF NOT EXISTS idx_photo_exposure_last_shown ON photo_exposure(last_shown ASC);

CREATE INDEX IF NOT EXISTS idx_swipe_sessions_user_id ON swipe_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_swipe_sessions_active ON swipe_sessions(is_active, last_activity DESC);

-- Function to update photo exposure metrics
CREATE OR REPLACE FUNCTION update_photo_exposure()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert photo exposure record
  INSERT INTO photo_exposure (cat_id, total_views, total_interactions, last_shown, updated_at)
  VALUES (
    NEW.cat_id,
    CASE WHEN NEW.interaction_type = 'view' THEN 1 ELSE 0 END,
    CASE WHEN NEW.interaction_type != 'view' THEN 1 ELSE 0 END,
    NEW.created_at,
    NEW.created_at
  )
  ON CONFLICT (cat_id) DO UPDATE SET
    total_views = photo_exposure.total_views + CASE WHEN NEW.interaction_type = 'view' THEN 1 ELSE 0 END,
    total_interactions = photo_exposure.total_interactions + CASE WHEN NEW.interaction_type != 'view' THEN 1 ELSE 0 END,
    last_shown = GREATEST(photo_exposure.last_shown, NEW.created_at),
    updated_at = NEW.created_at;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update photo exposure
CREATE TRIGGER update_photo_exposure_trigger
  AFTER INSERT ON user_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_photo_exposure();

-- Function to calculate exposure scores for fair distribution
CREATE OR REPLACE FUNCTION calculate_exposure_scores()
RETURNS void AS $$
BEGIN
  -- Update exposure scores based on views, interactions, and recency
  UPDATE photo_exposure SET
    exposure_score = (
      -- Base score: lower is better (less exposed)
      COALESCE(total_views, 0) * 1.0 +
      COALESCE(total_interactions, 0) * 0.5 +
      -- Time factor: older photos get slight boost
      EXTRACT(EPOCH FROM (now() - last_shown)) / 86400.0 * 0.1
    ),
    updated_at = now()
  WHERE updated_at < now() - INTERVAL '1 hour'; -- Only update if not recently updated
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get randomized cats for a user session
CREATE OR REPLACE FUNCTION get_randomized_cats_for_user(
  p_user_id uuid,
  p_session_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_exclude_interacted boolean DEFAULT true
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  name text,
  description text,
  caption text,
  image_url text,
  upload_date timestamptz,
  cat_profile_id uuid,
  username text,
  email text,
  exposure_score decimal
) AS $$
DECLARE
  v_session_id uuid;
BEGIN
  -- Create or get session ID
  IF p_session_id IS NULL THEN
    INSERT INTO swipe_sessions (user_id, session_type)
    VALUES (p_user_id, 'swipe')
    RETURNING swipe_sessions.id INTO v_session_id;
  ELSE
    v_session_id := p_session_id;
    -- Update session activity
    UPDATE swipe_sessions 
    SET last_activity = now(), is_active = true
    WHERE id = v_session_id AND user_id = p_user_id;
  END IF;

  -- Ensure all cats have exposure records
  INSERT INTO photo_exposure (cat_id, total_views, total_interactions, last_shown)
  SELECT c.id, 0, 0, c.upload_date
  FROM cats c
  LEFT JOIN photo_exposure pe ON c.id = pe.cat_id
  WHERE pe.cat_id IS NULL;

  -- Update exposure scores
  PERFORM calculate_exposure_scores();

  -- Return randomized cats with fair distribution
  RETURN QUERY
  SELECT 
    c.id,
    c.user_id,
    c.name,
    c.description,
    c.caption,
    c.image_url,
    c.upload_date,
    c.cat_profile_id,
    u.username,
    u.email,
    COALESCE(pe.exposure_score, 0) as exposure_score
  FROM cats c
  LEFT JOIN users u ON c.user_id = u.id
  LEFT JOIN photo_exposure pe ON c.id = pe.cat_id
  WHERE 
    -- Exclude user's own cats
    c.user_id != p_user_id
    AND (
      NOT p_exclude_interacted OR
      -- Exclude cats user has already interacted with in this session
      c.id NOT IN (
        SELECT ui.cat_id 
        FROM user_interactions ui 
        WHERE ui.user_id = p_user_id 
        AND ui.session_id = v_session_id
      )
    )
  ORDER BY 
    -- Weighted randomization: combine exposure score with randomness
    (COALESCE(pe.exposure_score, 0) * 0.7 + random() * 0.3),
    random()
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record user interaction
CREATE OR REPLACE FUNCTION record_user_interaction(
  p_user_id uuid,
  p_cat_id uuid,
  p_interaction_type text,
  p_session_id uuid DEFAULT NULL,
  p_emoji_type text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_session_id uuid;
  v_interaction_id uuid;
BEGIN
  -- Get or create active session
  IF p_session_id IS NULL THEN
    SELECT id INTO v_session_id
    FROM swipe_sessions
    WHERE user_id = p_user_id AND is_active = true
    ORDER BY last_activity DESC
    LIMIT 1;
    
    IF v_session_id IS NULL THEN
      INSERT INTO swipe_sessions (user_id, session_type)
      VALUES (p_user_id, 'swipe')
      RETURNING id INTO v_session_id;
    END IF;
  ELSE
    v_session_id := p_session_id;
  END IF;

  -- Record the interaction
  INSERT INTO user_interactions (
    user_id, cat_id, interaction_type, emoji_type, session_id
  )
  VALUES (
    p_user_id, p_cat_id, p_interaction_type, p_emoji_type, v_session_id
  )
  ON CONFLICT (user_id, cat_id, interaction_type, session_id) DO UPDATE SET
    created_at = now(),
    emoji_type = COALESCE(EXCLUDED.emoji_type, user_interactions.emoji_type)
  RETURNING id INTO v_interaction_id;

  -- Update session activity
  UPDATE swipe_sessions 
  SET 
    last_activity = now(),
    photos_shown = photos_shown + CASE WHEN p_interaction_type = 'view' THEN 1 ELSE 0 END
  WHERE id = v_session_id;

  -- For backward compatibility, also insert into reactions table for emoji reactions
  IF p_interaction_type = 'emoji_reaction' AND p_emoji_type IS NOT NULL THEN
    INSERT INTO reactions (user_id, cat_id, emoji_type)
    VALUES (p_user_id, p_cat_id, p_emoji_type)
    ON CONFLICT (user_id, cat_id) DO UPDATE SET
      emoji_type = EXCLUDED.emoji_type,
      created_at = now();
  END IF;

  RETURN v_interaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_randomized_cats_for_user(uuid, uuid, integer, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION record_user_interaction(uuid, uuid, text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_exposure_scores() TO authenticated;

-- Create view for user interaction analytics
CREATE OR REPLACE VIEW user_interaction_stats AS
SELECT 
  u.id as user_id,
  u.username,
  COUNT(DISTINCT ui.cat_id) as cats_viewed,
  COUNT(CASE WHEN ui.interaction_type = 'swipe_right' THEN 1 END) as swipes_right,
  COUNT(CASE WHEN ui.interaction_type = 'swipe_left' THEN 1 END) as swipes_left,
  COUNT(CASE WHEN ui.interaction_type = 'emoji_reaction' THEN 1 END) as emoji_reactions,
  COUNT(DISTINCT ui.session_id) as total_sessions,
  MAX(ui.created_at) as last_activity
FROM users u
LEFT JOIN user_interactions ui ON u.id = ui.user_id
GROUP BY u.id, u.username;

-- Grant access to the view
GRANT SELECT ON user_interaction_stats TO authenticated;

-- Initialize exposure records for existing cats
INSERT INTO photo_exposure (cat_id, total_views, total_interactions, last_shown)
SELECT id, 0, 0, upload_date
FROM cats
ON CONFLICT (cat_id) DO NOTHING;