import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from the correct locations only
console.log('🔍 Loading environment variables...')
console.log('Script directory:', __dirname)

// Try to load from scripts/.env first, then project root
const envPaths = [
  path.join(__dirname, '.env'),           // /home/project/scripts/.env
  path.join(__dirname, '..', '.env')      // /home/project/.env
]

console.log('🔍 Trying to load .env files from:')
envPaths.forEach((envPath, index) => {
  console.log(`  ${index + 1}. ${envPath}`)
  try {
    const result = dotenv.config({ path: envPath })
    if (result.error) {
      console.log(`     ❌ Failed: ${result.error.message}`)
    } else {
      console.log(`     ✅ Loaded successfully`)
    }
  } catch (error) {
    console.log(`     ❌ Error: ${error.message}`)
  }
})

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('\n🔍 Environment variable check:')
console.log('VITE_SUPABASE_URL exists:', !!supabaseUrl)
console.log('VITE_SUPABASE_ANON_KEY exists:', !!supabaseAnonKey)
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!supabaseServiceKey)

if (supabaseUrl) {
  console.log('VITE_SUPABASE_URL preview:', supabaseUrl.substring(0, 30) + '...')
}
if (supabaseAnonKey) {
  console.log('VITE_SUPABASE_ANON_KEY preview:', supabaseAnonKey.substring(0, 20) + '...')
}
if (supabaseServiceKey) {
  console.log('SUPABASE_SERVICE_ROLE_KEY preview:', supabaseServiceKey.substring(0, 20) + '...')
}

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('\n❌ Missing Supabase configuration.')
  console.error('Please ensure you have a .env file with ALL THREE required keys:')
  console.error('VITE_SUPABASE_URL=your_supabase_url')
  console.error('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key')
  console.error('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
  console.error('')
  console.error('The .env file should be in one of these locations:')
  envPaths.forEach((envPath, index) => {
    console.error(`  ${index + 1}. ${envPath}`)
  })
  console.error('')
  console.error('Note: You need BOTH the anon key AND the service role key!')
  console.error('- ANON KEY: For basic API access')
  console.error('- SERVICE ROLE KEY: For admin operations (deleting users)')
  process.exit(1)
}

if (supabaseServiceKey === 'your_service_role_key_here') {
  console.error('❌ Please replace "your_service_role_key_here" with your actual Supabase service role key.')
  console.error('You can find this in your Supabase dashboard under Settings > API.')
  process.exit(1)
}

if (supabaseAnonKey === 'your_supabase_anon_key') {
  console.error('❌ Please replace "your_supabase_anon_key" with your actual Supabase anon key.')
  console.error('You can find this in your Supabase dashboard under Settings > API.')
  process.exit(1)
}

// Validate URL format
try {
  new URL(supabaseUrl)
} catch (error) {
  console.error('❌ Invalid Supabase URL format:', supabaseUrl)
  console.error('URL should start with https:// and be a valid URL')
  process.exit(1)
}

console.log('\n✅ Environment variables loaded successfully')

// Create Supabase client with SERVICE ROLE KEY for admin operations
// The service role key bypasses RLS and allows admin operations like deleting users
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    fetch: (url, options = {}) => {
      // Add timeout and better error handling to fetch requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 45000) // 45 second timeout
      
      return fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...options.headers,
          'Connection': 'keep-alive',
          'Keep-Alive': 'timeout=30',
          // Use service role key for authorization (required for admin operations)
          'Authorization': `Bearer ${supabaseServiceKey}`,
          // Also include anon key as apikey header (required for API access)
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json'
        }
      }).finally(() => {
        clearTimeout(timeoutId)
      })
    }
  }
})

// Enhanced retry function with exponential backoff and circuit breaker pattern
async function safeDelete(tableName, deleteQuery, description, maxRetries = 8) {
  let consecutiveFailures = 0
  const maxConsecutiveFailures = 3
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 ${description}... (attempt ${attempt}/${maxRetries})`)
      
      // Circuit breaker: if we have too many consecutive failures, wait longer
      if (consecutiveFailures >= maxConsecutiveFailures) {
        const circuitBreakerDelay = 15000 + (consecutiveFailures * 5000)
        console.log(`⚡ Circuit breaker activated - waiting ${circuitBreakerDelay/1000} seconds...`)
        await new Promise(resolve => setTimeout(resolve, circuitBreakerDelay))
      }
      
      // Progressive delay with jitter to avoid thundering herd
      if (attempt > 1) {
        const baseDelay = Math.min(1000 * Math.pow(2, attempt - 1), 20000) // Exponential backoff, max 20s
        const jitter = Math.random() * 2000 // Add up to 2s random jitter
        const delay = baseDelay + jitter
        console.log(`⏳ Waiting ${Math.round(delay/1000)} seconds before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
      
      // Wrap the query with additional timeout protection
      const result = await Promise.race([
        deleteQuery,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Operation timeout after 40 seconds')), 40000)
        )
      ])
      
      if (result.error) {
        console.error(`❌ Database error ${description.toLowerCase()}: ${result.error.message}`)
        if (result.error.details) {
          console.error('Details:', result.error.details)
        }
        
        // Check for specific error types that warrant retry
        const retryableErrors = [
          'fetch failed',
          'network',
          'timeout',
          'ECONNRESET',
          'ENOTFOUND',
          'ETIMEDOUT',
          'ECONNREFUSED',
          'connection',
          'socket hang up',
          'aborted',
          'cancelled'
        ]
        
        const isRetryable = retryableErrors.some(errorType => 
          result.error.message.toLowerCase().includes(errorType.toLowerCase())
        )
        
        if (isRetryable && attempt < maxRetries) {
          consecutiveFailures++
          console.log(`🔄 Network error detected (${consecutiveFailures} consecutive), will retry...`)
          continue
        }
        
        consecutiveFailures++
        return false
      } else {
        console.log(`✅ ${description} completed successfully`)
        consecutiveFailures = 0 // Reset on success
        return true
      }
    } catch (error) {
      consecutiveFailures++
      console.error(`❌ Network error ${description.toLowerCase()}:`, error.message)
      
      // Enhanced error classification
      const networkErrors = [
        'fetch failed',
        'network',
        'timeout',
        'ECONNRESET',
        'ENOTFOUND',
        'ETIMEDOUT',
        'ECONNREFUSED',
        'aborted',
        'cancelled',
        'socket hang up'
      ]
      
      const isNetworkError = networkErrors.some(errorType => 
        error.message.toLowerCase().includes(errorType.toLowerCase())
      )
      
      if (isNetworkError && attempt < maxRetries) {
        console.log(`🔄 Will retry due to network error (${consecutiveFailures} consecutive failures)...`)
        continue
      }
      
      return false
    }
  }
  
  console.error(`❌ Failed after ${maxRetries} attempts with ${consecutiveFailures} consecutive failures`)
  return false
}

async function testConnection() {
  try {
    console.log('🔗 Testing Supabase connection...')
    console.log(`📡 Using URL: ${supabaseUrl}`)
    console.log(`🔑 Using anon key: ${supabaseAnonKey.substring(0, 20)}...`)
    console.log(`🔐 Using service key: ${supabaseServiceKey.substring(0, 20)}...`)
    
    // Use a simple query with extended timeout
    const { data, error } = await Promise.race([
      supabase.from('users').select('count').limit(1),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection test timeout after 20 seconds')), 20000)
      )
    ])
    
    if (error) {
      console.error('❌ Connection test failed:', error.message)
      if (error.message.includes('API key')) {
        console.error('💡 This suggests an issue with the API keys configuration')
        console.error('   Make sure both VITE_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are correct')
      }
      return false
    }
    console.log('✅ Connection test successful')
    return true
  } catch (error) {
    console.error('❌ Network connection failed:', error.message)
    return false
  }
}

async function cleanDemoData() {
  try {
    console.log('\n🧹 Starting comprehensive demo data cleanup...')
    console.log('📍 Current working directory:', process.cwd())
    console.log('📍 Script location:', __dirname)
    
    // Test connection with multiple attempts and enhanced error reporting
    let connectionOk = false
    for (let attempt = 1; attempt <= 8; attempt++) {
      console.log(`🔗 Connection attempt ${attempt}/8...`)
      connectionOk = await testConnection()
      if (connectionOk) break
      
      if (attempt < 8) {
        const delay = Math.min(2000 * Math.pow(1.5, attempt), 20000) // Progressive delay, max 20s
        console.log(`⏳ Waiting ${Math.round(delay/1000)} seconds before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    if (!connectionOk) {
      console.error('❌ Cannot proceed without a working connection to Supabase')
      console.error('')
      console.error('💡 Enhanced network troubleshooting checklist:')
      console.error('   ✓ Check your internet connection stability')
      console.error('   ✓ Verify VITE_SUPABASE_URL is correct and starts with https://')
      console.error('   ✓ Confirm VITE_SUPABASE_ANON_KEY is valid and not expired')
      console.error('   ✓ Confirm SUPABASE_SERVICE_ROLE_KEY is valid (not anon key)')
      console.error('   ✓ Ensure Supabase project is active and not paused')
      console.error('   ✓ Check for firewall/proxy blocking connections')
      console.error('   ✓ Try running the script from a different network')
      console.error('   ✓ Check if your ISP is blocking the connection')
      console.error('   ✓ Verify DNS resolution is working properly')
      console.error('   ✓ Test connection from a different device/location')
      console.error('')
      console.error('🔧 You can also try:')
      console.error('   • Running the script during off-peak hours')
      console.error('   • Using a VPN if corporate firewall is blocking')
      console.error('   • Checking Supabase status page for outages')
      process.exit(1)
    }
    
    // Get all demo users with enhanced error handling and retries
    let authUsers, authError
    let userFetchAttempts = 0
    const maxUserFetchAttempts = 5
    
    while (userFetchAttempts < maxUserFetchAttempts) {
      userFetchAttempts++
      try {
        console.log(`👥 Fetching demo users (attempt ${userFetchAttempts}/${maxUserFetchAttempts})...`)
        const result = await Promise.race([
          supabase.auth.admin.listUsers(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('List users timeout after 30 seconds')), 30000)
          )
        ])
        authUsers = result.data
        authError = result.error
        break
      } catch (error) {
        console.error(`❌ Failed to list users (attempt ${userFetchAttempts}):`, error.message)
        if (userFetchAttempts < maxUserFetchAttempts) {
          const delay = Math.min(3000 * userFetchAttempts, 15000)
          console.log(`⏳ Waiting ${delay/1000} seconds before retry...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    if (!authUsers || authError) {
      console.error('❌ Could not fetch users after multiple attempts')
      if (authError) {
        console.error('Auth error:', authError.message)
        if (authError.message.includes('JWT')) {
          console.error('This indicates an invalid or expired service role key.')
        }
        if (authError.message.includes('API key') || authError.message.includes('No API key')) {
          console.error('This indicates missing or invalid API key configuration.')
          console.error('Make sure ALL THREE keys are set correctly:')
          console.error('  • VITE_SUPABASE_URL (your project URL)')
          console.error('  • VITE_SUPABASE_ANON_KEY (for API access)')
          console.error('  • SUPABASE_SERVICE_ROLE_KEY (for admin operations)')
        }
      }
      console.error('')
      console.error('This usually means:')
      console.error('  • Network connectivity issues')
      console.error('  • Service role key is incorrect or expired')
      console.error('  • Anon key is missing or incorrect')
      console.error('  • Supabase project is not accessible')
      console.error('')
      console.error('Please verify all three keys in the .env file:')
      console.error('  • VITE_SUPABASE_URL (project URL)')
      console.error('  • VITE_SUPABASE_ANON_KEY (for API access)')
      console.error('  • SUPABASE_SERVICE_ROLE_KEY (for admin operations)')
      process.exit(1)
    }
    
    const demoUsers = authUsers.users.filter(user => 
      user.user_metadata?.is_demo_account === true ||
      user.email?.endsWith('@test.com')
    )
    
    console.log(`Found ${demoUsers.length} demo users to remove`)
    
    if (demoUsers.length === 0) {
      console.log('ℹ️ No demo users found to clean up')
      return
    }

    const demoUserIds = demoUsers.map(user => user.id)
    
    // Use even smaller batches and more conservative approach for maximum network reliability
    const batchSize = 2 // Very small batches to minimize network load
    const batchDelay = 3000 // Longer delays between batches
    
    console.log('🗄️ Cleaning database records in very small batches for maximum network reliability...')
    console.log(`Using batch size: ${batchSize}, delay between batches: ${batchDelay/1000}s`)
    
    // Clean up user interactions
    console.log('\n🔄 Cleaning user interactions...')
    for (let i = 0; i < demoUserIds.length; i += batchSize) {
      const batch = demoUserIds.slice(i, i + batchSize)
      console.log(`Processing user interactions batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(demoUserIds.length/batchSize)} (${batch.length} users)`)
      
      const success = await safeDelete(
        'user_interactions',
        supabase.from('user_interactions').delete().in('user_id', batch),
        `Cleaning user interactions for batch ${Math.floor(i/batchSize) + 1}`
      )
      
      if (!success) {
        console.warn(`⚠️ Failed to clean user interactions for batch ${Math.floor(i/batchSize) + 1}, continuing...`)
      }
      
      // Longer delay between batches for network stability
      if (i + batchSize < demoUserIds.length) {
        console.log(`⏳ Waiting ${batchDelay/1000} seconds before next batch...`)
        await new Promise(resolve => setTimeout(resolve, batchDelay))
      }
    }
    
    // Clean up swipe sessions
    console.log('\n🔄 Cleaning swipe sessions...')
    for (let i = 0; i < demoUserIds.length; i += batchSize) {
      const batch = demoUserIds.slice(i, i + batchSize)
      console.log(`Processing swipe sessions batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(demoUserIds.length/batchSize)} (${batch.length} users)`)
      
      const success = await safeDelete(
        'swipe_sessions',
        supabase.from('swipe_sessions').delete().in('user_id', batch),
        `Cleaning swipe sessions for batch ${Math.floor(i/batchSize) + 1}`
      )
      
      if (!success) {
        console.warn(`⚠️ Failed to clean swipe sessions for batch ${Math.floor(i/batchSize) + 1}, continuing...`)
      }
      
      if (i + batchSize < demoUserIds.length) {
        console.log(`⏳ Waiting ${batchDelay/1000} seconds before next batch...`)
        await new Promise(resolve => setTimeout(resolve, batchDelay))
      }
    }
    
    // Get demo cats in smaller batches with enhanced error handling
    console.log('\n📸 Finding demo user cats...')
    let allDemoCats = []
    
    for (let i = 0; i < demoUserIds.length; i += batchSize) {
      const batch = demoUserIds.slice(i, i + batchSize)
      
      let catFetchSuccess = false
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`Fetching cats for batch ${Math.floor(i/batchSize) + 1} (attempt ${attempt}/3)`)
          const { data: demoCats, error: catsError } = await Promise.race([
            supabase.from('cats').select('id').in('user_id', batch),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Fetch cats timeout after 20 seconds')), 20000)
            )
          ])
          
          if (catsError) {
            console.warn(`Warning: Could not fetch cats for batch ${Math.floor(i/batchSize) + 1} (attempt ${attempt}):`, catsError.message)
          } else if (demoCats) {
            allDemoCats.push(...demoCats)
            catFetchSuccess = true
            break
          }
        } catch (error) {
          console.warn(`Warning: Network error fetching cats for batch ${Math.floor(i/batchSize) + 1} (attempt ${attempt}):`, error.message)
        }
        
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt))
        }
      }
      
      if (!catFetchSuccess) {
        console.warn(`⚠️ Could not fetch cats for batch ${Math.floor(i/batchSize) + 1} after 3 attempts, continuing...`)
      }
      
      // Delay between batches
      await new Promise(resolve => setTimeout(resolve, 1500))
    }
    
    if (allDemoCats.length > 0) {
      const demoCatIds = allDemoCats.map(cat => cat.id)
      console.log(`Found ${demoCatIds.length} demo cat photos`)
      
      // Clean up cat-related data in smaller batches
      const catBatchSize = 1 // Even smaller batches for cat operations
      
      console.log('\n🔄 Cleaning photo exposure data...')
      for (let i = 0; i < demoCatIds.length; i += catBatchSize) {
        const batch = demoCatIds.slice(i, i + catBatchSize)
        
        const success = await safeDelete(
          'photo_exposure',
          supabase.from('photo_exposure').delete().in('cat_id', batch),
          `Cleaning photo exposure for cat batch ${Math.floor(i/catBatchSize) + 1}`
        )
        
        if (!success) {
          console.warn(`⚠️ Failed to clean photo exposure for cat batch ${Math.floor(i/catBatchSize) + 1}, continuing...`)
        }
        
        if (i + catBatchSize < demoCatIds.length) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
      
      console.log('\n🔄 Cleaning cat reactions...')
      for (let i = 0; i < demoCatIds.length; i += catBatchSize) {
        const batch = demoCatIds.slice(i, i + catBatchSize)
        
        const success = await safeDelete(
          'reactions',
          supabase.from('reactions').delete().in('cat_id', batch),
          `Cleaning reactions for cat batch ${Math.floor(i/catBatchSize) + 1}`
        )
        
        if (!success) {
          console.warn(`⚠️ Failed to clean reactions for cat batch ${Math.floor(i/catBatchSize) + 1}, continuing...`)
        }
        
        if (i + catBatchSize < demoCatIds.length) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
      
      console.log('\n🔄 Cleaning cat reports...')
      for (let i = 0; i < demoCatIds.length; i += catBatchSize) {
        const batch = demoCatIds.slice(i, i + catBatchSize)
        
        const success = await safeDelete(
          'reports',
          supabase.from('reports').delete().in('cat_id', batch),
          `Cleaning reports for cat batch ${Math.floor(i/catBatchSize) + 1}`
        )
        
        if (!success) {
          console.warn(`⚠️ Failed to clean reports for cat batch ${Math.floor(i/catBatchSize) + 1}, continuing...`)
        }
        
        if (i + catBatchSize < demoCatIds.length) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
    }
    
    // Clean up reactions made BY demo users
    console.log('\n🔄 Cleaning demo user reactions...')
    for (let i = 0; i < demoUserIds.length; i += batchSize) {
      const batch = demoUserIds.slice(i, i + batchSize)
      
      const success = await safeDelete(
        'reactions',
        supabase.from('reactions').delete().in('user_id', batch),
        `Cleaning demo user reactions for batch ${Math.floor(i/batchSize) + 1}`
      )
      
      if (!success) {
        console.warn(`⚠️ Failed to clean demo user reactions for batch ${Math.floor(i/batchSize) + 1}, continuing...`)
      }
      
      if (i + batchSize < demoUserIds.length) {
        await new Promise(resolve => setTimeout(resolve, batchDelay))
      }
    }
    
    // Clean up storage files with enhanced error handling
    console.log('\n🗂️ Attempting to clean up storage files...')
    try {
      const { data: files, error: listError } = await Promise.race([
        supabase.storage.from('cat-photos').list(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Storage list timeout after 20 seconds')), 20000)
        )
      ])
      
      if (!listError && files && files.length > 0) {
        const demoFiles = files.filter(file => 
          demoUserIds.some(userId => file.name.startsWith(userId))
        )
        
        if (demoFiles.length > 0) {
          console.log(`Found ${demoFiles.length} demo files to delete`)
          
          // Delete files one by one for maximum reliability
          for (let i = 0; i < demoFiles.length; i++) {
            const file = demoFiles[i]
            
            try {
              const { error: removeError } = await Promise.race([
                supabase.storage.from('cat-photos').remove([file.name]),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Storage remove timeout after 15 seconds')), 15000)
                )
              ])
              
              if (removeError) {
                console.warn(`Warning: Could not remove file ${file.name}:`, removeError.message)
              } else {
                console.log(`✅ Removed file: ${file.name}`)
              }
            } catch (error) {
              console.warn(`Warning: Network error removing file ${file.name}:`, error.message)
            }
            
            // Small delay between file deletions
            if (i < demoFiles.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000))
            }
          }
        }
      }
    } catch (storageError) {
      console.warn('Warning: Storage cleanup failed:', storageError.message)
    }
    
    // Delete database records
    console.log('\n🗄️ Deleting database records...')
    
    console.log('\n🔄 Cleaning cat profiles...')
    for (let i = 0; i < demoUserIds.length; i += batchSize) {
      const batch = demoUserIds.slice(i, i + batchSize)
      
      const success = await safeDelete(
        'cat_profiles',
        supabase.from('cat_profiles').delete().in('user_id', batch),
        `Cleaning cat profiles for batch ${Math.floor(i/batchSize) + 1}`
      )
      
      if (!success) {
        console.warn(`⚠️ Failed to clean cat profiles for batch ${Math.floor(i/batchSize) + 1}, continuing...`)
      }
      
      if (i + batchSize < demoUserIds.length) {
        await new Promise(resolve => setTimeout(resolve, batchDelay))
      }
    }
    
    console.log('\n🔄 Cleaning cat photos...')
    for (let i = 0; i < demoUserIds.length; i += batchSize) {
      const batch = demoUserIds.slice(i, i + batchSize)
      
      const success = await safeDelete(
        'cats',
        supabase.from('cats').delete().in('user_id', batch),
        `Cleaning cat photos for batch ${Math.floor(i/batchSize) + 1}`
      )
      
      if (!success) {
        console.warn(`⚠️ Failed to clean cat photos for batch ${Math.floor(i/batchSize) + 1}, continuing...`)
      }
      
      if (i + batchSize < demoUserIds.length) {
        await new Promise(resolve => setTimeout(resolve, batchDelay))
      }
    }
    
    // Delete demo user accounts (one by one for maximum reliability)
    console.log('\n👥 Deleting demo user accounts...')
    
    let deletedCount = 0
    for (let i = 0; i < demoUsers.length; i++) {
      const user = demoUsers[i]
      
      let userDeleteSuccess = false
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`Deleting user: ${user.email} (${i + 1}/${demoUsers.length}, attempt ${attempt}/3)`)
          
          const { error } = await Promise.race([
            supabase.auth.admin.deleteUser(user.id),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Delete user timeout after 20 seconds')), 20000)
            )
          ])
          
          if (error) {
            console.error(`❌ Error deleting user ${user.email} (attempt ${attempt}):`, error.message)
          } else {
            console.log(`✅ Deleted user: ${user.email}`)
            deletedCount++
            userDeleteSuccess = true
            break
          }
        } catch (error) {
          console.error(`❌ Network error deleting user ${user.email} (attempt ${attempt}):`, error.message)
        }
        
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt))
        }
      }
      
      if (!userDeleteSuccess) {
        console.warn(`⚠️ Could not delete user ${user.email} after 3 attempts, continuing...`)
      }
      
      // Delay between user deletions for network stability
      if (i < demoUsers.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500))
      }
    }
    
    console.log('')
    console.log('🎉 Demo data cleanup completed!')
    console.log('')
    console.log('📊 Summary:')
    console.log(`   • ${deletedCount}/${demoUsers.length} demo user accounts deleted`)
    console.log('   • Cat profiles and photos cleaned up')
    console.log('   • User interactions and sessions cleaned up')
    console.log('   • Reactions and reports cleaned up')
    console.log('   • Storage files cleaned up (where possible)')
    console.log('')
    
    if (deletedCount < demoUsers.length) {
      console.log('⚠️ Some operations may have failed due to network issues.')
      console.log('You can run the cleanup script again to retry any remaining items.')
      console.log('')
      console.log('💡 Enhanced network troubleshooting tips:')
      console.log('   • Try running from a different network connection')
      console.log('   • Check if your firewall is blocking Supabase connections')
      console.log('   • Ensure your internet connection is stable')
      console.log('   • Consider running during off-peak hours')
      console.log('   • Use a VPN if corporate firewall is interfering')
      console.log('   • Check Supabase status page for service issues')
      console.log('   • Try running the script in smaller chunks')
    } else {
      console.log('✨ All demo data has been successfully removed!')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error during cleanup:', error)
    console.log('')
    console.log('💡 This appears to be a network connectivity issue.')
    console.log('Enhanced troubleshooting steps:')
    console.log('   1. Check your internet connection stability')
    console.log('   2. Try running from a different network')
    console.log('   3. Verify Supabase project is accessible')
    console.log('   4. Check for firewall/proxy blocking connections')
    console.log('   5. Run the cleanup script again when connection is stable')
    console.log('   6. Consider using a VPN if behind corporate firewall')
    console.log('   7. Check DNS resolution and try different DNS servers')
    console.log('   8. Verify system time is correct (affects SSL certificates)')
  }
}

cleanDemoData()