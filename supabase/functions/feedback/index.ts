import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header provided')
      throw new Error('No authorization header')
    }

    // Log the auth header (without the token for security)
    console.log('Auth header present:', !!authHeader)

    // Create Supabase client to verify JWT
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Verify the JWT token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError) {
      console.error('Auth error:', authError)
      throw new Error(`Authentication error: ${authError.message}`)
    }
    if (!user) {
      console.error('No user found in session')
      throw new Error('No user found in session')
    }

    console.log('User authenticated:', user.email)

    const { feedback, suggestFeature, technicalIssue } = await req.json()

    // Validate input
    if (!feedback) {
      throw new Error('Feedback is required')
    }

    // Prepare email content
    const subject = 'New Feedback from Top Cat Website'
    const content = `
      New feedback received from user ${user.email}:
      
      Feedback: ${feedback}
      Suggests Feature: ${suggestFeature ? 'Yes' : 'No'}
      Technical Issue: ${technicalIssue ? 'Yes' : 'No'}
      
      Timestamp: ${new Date().toISOString()}
    `

    // Send email using Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Top Cat <feedback@topcat.com>',
        to: 'knollybwai@gmail.com',
        subject,
        text: content,
        html: content.replace(/\n/g, '<br>'),
      }),
    })

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json()
      console.error('Resend API error:', errorData)
      throw new Error(`Failed to send email: ${errorData.message || 'Unknown error'}`)
    }

    return new Response(
      JSON.stringify({ message: 'Feedback sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 