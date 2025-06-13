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
    const { feedback, suggestFeature, technicalIssue } = await req.json()

    // Validate input
    if (!feedback) {
      throw new Error('Feedback is required')
    }

    // Create SMTP client
    const client = new SmtpClient()
    await client.connectTLS({
      hostname: Deno.env.get('SMTP_HOSTNAME') || '',
      port: parseInt(Deno.env.get('SMTP_PORT') || '587'),
      username: Deno.env.get('SMTP_USERNAME') || '',
      password: Deno.env.get('SMTP_PASSWORD') || '',
    })

    // Prepare email content
    const subject = 'New Feedback from Top Cat Website'
    const content = `
      New feedback received:
      
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
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 