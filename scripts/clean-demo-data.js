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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('\n🔍 Environment variable check:')
console.log('VITE_SUPABASE_URL exists:', !!supabaseUrl)
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!supabaseServiceKey)

if (supabaseUrl) {
  console.log('VITE_SUPABASE_URL preview:', supabaseUrl.substring(0, 30) + '...')
}
if (supabaseServiceKey) {
  console.log('SUPABASE_SERVICE_ROLE_KEY preview:', supabaseServiceKey.substring(0, 20) + '...')
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\n❌ Missing Supabase configuration.')
  console.error('Please ensure you have a .env file with:')
  console.error('VITE_SUPABASE_URL=your_supabase_url')
  console.error('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
  console.error('')
  console.error('The .env file should be in one of these locations:')
  envPaths.forEach((envPath, index) => {
    console.error(`  ${index + 1}. ${envPath}`)
  })
  console.error('')
  console.error('Note: You need the SERVICE ROLE KEY, not the anon key!')
  process.exit(1)
}

if (supabaseServiceKey === 'your_service_role_key_here') {
  console.error('❌ Please replace "your_service_role_key_here" with your actual Supabase service role key.')
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

// Create Supabase client with proper configuration
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Enhanced retry function with exponential backoff
async function safeDelete(tableName, deleteQuery, description, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 ${description}... (attempt ${attempt}/${maxRetries})`)
      
      // Add a small delay before each attempt
      if (attempt > 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000) // Exponential backoff, max 5s
        console.log(`⏳ Waiting ${delay/1000} seconds before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
      
      const result = await deleteQuery
      
      if (result.error) {
        console.error(`❌ Database error ${description.toLowerCase()}: ${result.error.message}`)
        if (result.error.details) {
          console.error('Details:', result.error.details)
        }
        
        // If it's a network error, retry
        if (result.error.message.includes('fetch failed') || 
            result.error.message.includes('network') ||
            result.error.message.includes('timeout')) {
          if (attempt < maxRetries) {
            continue
          }
        }
        return false
      } else {
        console.log(`✅ ${description} completed successfully`)
        return true
      }
    } catch (error) {
      console.error(`❌ Network error ${description.toLowerCase()}:`, error.message)
      
      // For network errors, always retry if we have attempts left
      if (attempt < maxRetries) {
        continue
      }
      
      return false
    }
  }
  return false
}

async function testConnection() {
  try {
    console.log('🔗 Testing Supabase connection...')
    
    const { data, error } = await supabase.from('users').select('count').limit(1)
    if (error) {
      console.error('❌ Connection test failed:', error.message)
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
    
    // Test connection with multiple attempts
    let connectionOk = false
    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`🔗 Connection attempt ${attempt}/3...`)
      connectionOk = await testConnection()
      if (connectionOk) break
      
      if (attempt < 3) {
        console.log(`⏳ Waiting ${attempt * 2} seconds before retry...`)
        await new Promise(resolve => setTimeout(resolve, attempt * 2000))
      }
    }
    
    if (!connectionOk) {
      console.error('❌ Cannot proceed without a working connection to Supabase')
      console.error('')
      console.error('💡 Troubleshooting checklist:')
      console.error('   ✓ Check your internet connection')
      console.error('   ✓ Verify VITE_SUPABASE_URL is correct and starts with https://')
      console.error('   ✓ Confirm SUPABASE_SERVICE_ROLE_KEY is valid (not anon key)')
      console.error('   ✓ Ensure Supabase project is active')
      console.error('   ✓ Check for firewall/proxy blocking connections')
      process.exit(1)
    }
    
    // Get all demo users with better error handling
    let authUsers, authError
    try {
      console.log('👥 Fetching demo users...')
      const result = await supabase.auth.admin.listUsers()
      authUsers = result.data
      authError = result.error
    } catch (error) {
      console.error('❌ Failed to list users:', error.message)
      console.error('This usually means the service role key is incorrect or expired.')
      console.error('Please verify your SUPABASE_SERVICE_ROLE_KEY in the .env file.')
      process.exit(1)
    }
    
    if (authError) {
      console.error('❌ Auth error:', authError.message)
      if (authError.message.includes('JWT')) {
        console.error('This indicates an invalid or expired service role key.')
      }
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
    
    // Use a more efficient approach - delete in smaller batches
    const batchSize = 5 // Smaller batches to avoid timeouts
    
    console.log('🗄️ Cleaning database records in small batches...')
    
    for (let i = 0; i < demoUserIds.length; i += batchSize) {
      const batch = demoUserIds.slice(i, i + batchSize)
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(demoUserIds.length/batchSize)} (${batch.length} users)`)
      
      // Clean up user interactions for this batch
      await safeDelete(
        'user_interactions',
        supabase.from('user_interactions').delete().in('user_id', batch),
        `Cleaning user interactions for batch ${Math.floor(i/batchSize) + 1}`
      )
      
      // Clean up swipe sessions for this batch
      await safeDelete(
        'swipe_sessions',
        supabase.from('swipe_sessions').delete().in('user_id', batch),
        `Cleaning swipe sessions for batch ${Math.floor(i/batchSize) + 1}`
      )
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    // Get demo cats in batches
    console.log('📸 Finding demo user cats...')
    let allDemoCats = []
    
    for (let i = 0; i < demoUserIds.length; i += batchSize) {
      const batch = demoUserIds.slice(i, i + batchSize)
      
      try {
        const { data: demoCats, error: catsError } = await supabase
          .from('cats')
          .select('id')
          .in('user_id', batch)
        
        if (catsError) {
          console.warn(`Warning: Could not fetch cats for batch ${Math.floor(i/batchSize) + 1}:`, catsError.message)
        } else if (demoCats) {
          allDemoCats.push(...demoCats)
        }
      } catch (error) {
        console.warn(`Warning: Network error fetching cats for batch ${Math.floor(i/batchSize) + 1}:`, error.message)
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    if (allDemoCats.length > 0) {
      const demoCatIds = allDemoCats.map(cat => cat.id)
      console.log(`Found ${demoCatIds.length} demo cat photos`)
      
      // Clean up cat-related data in batches
      for (let i = 0; i < demoCatIds.length; i += batchSize) {
        const batch = demoCatIds.slice(i, i + batchSize)
        
        await safeDelete(
          'photo_exposure',
          supabase.from('photo_exposure').delete().in('cat_id', batch),
          `Cleaning photo exposure for cat batch ${Math.floor(i/batchSize) + 1}`
        )
        
        await safeDelete(
          'reactions',
          supabase.from('reactions').delete().in('cat_id', batch),
          `Cleaning reactions for cat batch ${Math.floor(i/batchSize) + 1}`
        )
        
        await safeDelete(
          'reports',
          supabase.from('reports').delete().in('cat_id', batch),
          `Cleaning reports for cat batch ${Math.floor(i/batchSize) + 1}`
        )
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    // Clean up reactions made BY demo users (in batches)
    for (let i = 0; i < demoUserIds.length; i += batchSize) {
      const batch = demoUserIds.slice(i, i + batchSize)
      
      await safeDelete(
        'reactions',
        supabase.from('reactions').delete().in('user_id', batch),
        `Cleaning demo user reactions for batch ${Math.floor(i/batchSize) + 1}`
      )
      
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    // Clean up storage files (skip if network issues)
    console.log('🗂️ Attempting to clean up storage files...')
    try {
      const { data: files, error: listError } = await supabase.storage
        .from('cat-photos')
        .list()
      
      if (!listError && files && files.length > 0) {
        const demoFiles = files.filter(file => 
          demoUserIds.some(userId => file.name.startsWith(userId))
        )
        
        if (demoFiles.length > 0) {
          console.log(`Found ${demoFiles.length} demo files to delete`)
          
          // Delete files in smaller batches
          const fileBatchSize = 3
          for (let i = 0; i < demoFiles.length; i += fileBatchSize) {
            const batch = demoFiles.slice(i, i + fileBatchSize)
            const filePaths = batch.map(file => file.name)
            
            try {
              const { error: removeError } = await supabase.storage
                .from('cat-photos')
                .remove(filePaths)
              
              if (removeError) {
                console.warn(`Warning: Could not remove file batch ${Math.floor(i/fileBatchSize) + 1}:`, removeError.message)
              } else {
                console.log(`✅ Removed file batch ${Math.floor(i/fileBatchSize) + 1} (${filePaths.length} files)`)
              }
            } catch (error) {
              console.warn(`Warning: Network error removing file batch ${Math.floor(i/fileBatchSize) + 1}:`, error.message)
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
      }
    } catch (storageError) {
      console.warn('Warning: Storage cleanup failed:', storageError.message)
    }
    
    // Delete database records (in batches)
    console.log('🗄️ Deleting database records...')
    
    for (let i = 0; i < demoUserIds.length; i += batchSize) {
      const batch = demoUserIds.slice(i, i + batchSize)
      
      await safeDelete(
        'cat_profiles',
        supabase.from('cat_profiles').delete().in('user_id', batch),
        `Cleaning cat profiles for batch ${Math.floor(i/batchSize) + 1}`
      )
      
      await safeDelete(
        'cats',
        supabase.from('cats').delete().in('user_id', batch),
        `Cleaning cat photos for batch ${Math.floor(i/batchSize) + 1}`
      )
      
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    // Delete demo user accounts (one by one for better reliability)
    console.log('👥 Deleting demo user accounts...')
    
    let deletedCount = 0
    for (const user of demoUsers) {
      try {
        console.log(`Deleting user: ${user.email}`)
        
        const { error } = await supabase.auth.admin.deleteUser(user.id)
        if (error) {
          console.error(`❌ Error deleting user ${user.email}:`, error.message)
        } else {
          console.log(`✅ Deleted user: ${user.email}`)
          deletedCount++
        }
        
        // Small delay between user deletions
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`❌ Network error deleting user ${user.email}:`, error.message)
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
    } else {
      console.log('✨ All demo data has been successfully removed!')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error during cleanup:', error)
    console.log('')
    console.log('💡 This appears to be a network connectivity issue.')
    console.log('You can try running the cleanup script again when the connection is more stable.')
  }
}

cleanDemoData()