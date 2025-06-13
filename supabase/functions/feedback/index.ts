import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SmtpClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts'

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
      throw new Error('No authorization header')
    }

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
    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    const { feedback, suggestFeature, technicalIssue } = await req.json()

    // Validate input
    if (!feedback) {
      throw new Error('Feedback is required')
    }

    // Log SMTP configuration (without sensitive data)
    console.log('SMTP Configuration:', {
      hostname: Deno.env.get('SMTP_HOSTNAME'),
      port: Deno.env.get('SMTP_PORT'),
      from: Deno.env.get('SMTP_FROM'),
      hasUsername: !!Deno.env.get('SMTP_USERNAME'),
      hasPassword: !!Deno.env.get('SMTP_PASSWORD'),
    })

    // Create SMTP client
    const client = new SmtpClient()
    try {
      await client.connectTLS({
        hostname: Deno.env.get('SMTP_HOSTNAME') || '',
        port: parseInt(Deno.env.get('SMTP_PORT') || '587'),
        username: Deno.env.get('SMTP_USERNAME') || '',
        password: Deno.env.get('SMTP_PASSWORD') || '',
      })

      // Prepare email content
      const subject = 'New Feedback from Top Cat Website'
      const content = `
        New feedback received from user ${user.email}:
        
        Feedback: ${feedback}
        Suggests Feature: ${suggestFeature ? 'Yes' : 'No'}
        Technical Issue: ${technicalIssue ? 'Yes' : 'No'}
        
        Timestamp: ${new Date().toISOString()}
      `

      // Send email
      await client.send({
        from: Deno.env.get('SMTP_FROM') || '',
        to: 'knollybwai@gmail.com',
        subject,
        content,
      })

      await client.close()

      return new Response(
        JSON.stringify({ message: 'Feedback sent successfully' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } catch (smtpError) {
      console.error('SMTP Error:', smtpError)
      throw new Error(`Failed to send email: ${smtpError.message}`)
    }
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