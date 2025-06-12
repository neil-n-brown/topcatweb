-- Update record_user_interaction to count swipe_right as a reaction
DROP FUNCTION IF EXISTS record_user_interaction(uuid, uuid, text, uuid, text);

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

  -- Insert into reactions for emoji_reaction or swipe_right
  IF p_interaction_type = 'emoji_reaction' AND p_emoji_type IS NOT NULL THEN
    INSERT INTO reactions (user_id, cat_id, emoji_type)
    VALUES (p_user_id, p_cat_id, p_emoji_type)
    ON CONFLICT (user_id, cat_id) DO UPDATE SET
      emoji_type = EXCLUDED.emoji_type,
      created_at = now();
  ELSIF p_interaction_type = 'swipe_right' THEN
    INSERT INTO reactions (user_id, cat_id, emoji_type)
    VALUES (p_user_id, p_cat_id, '❤️')
    ON CONFLICT (user_id, cat_id) DO UPDATE SET
      -- Only update to heart if not already an emoji (i.e., only if previous is heart or null)
      emoji_type = CASE WHEN reactions.emoji_type IS NULL OR reactions.emoji_type = '❤️' THEN '❤️' ELSE reactions.emoji_type END,
      created_at = now();
  END IF;

  RETURN v_interaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION record_user_interaction(uuid, uuid, text, uuid, text) TO authenticated; 