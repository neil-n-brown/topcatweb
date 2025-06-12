// test-supabase.js
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('URL:', supabaseUrl)
console.log('Key exists:', !!supabaseKey)

// Create a minimal client without custom fetch
const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('Testing connection...')
    const { data, error } = await supabase.from('users').select('count')
    
    if (error) {
      console.error('Supabase error:', error)
    } else {
      console.log('Connection successful:', data)
    }
  } catch (err) {
    console.error('Catch error:', err.message)
    console.error('Error type:', err.constructor.name)
    if (err.cause) console.error('Cause:', err.cause)
  }
}

testConnection()
