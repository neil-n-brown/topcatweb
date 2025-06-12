import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from the correct locations
console.log('🔍 Loading environment variables...')
console.log('Script directory:', __dirname)

// Try to load from scripts/.env first, then project root
const envPaths = [
  path.join(__dirname, '.env'),
  path.join(__dirname, '..', '.env')
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
  process.exit(1)
}

// Create Supabase client with SERVICE ROLE KEY - FIXED VERSION WITHOUT CUSTOM FETCH
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function safeDelete(tableName, deleteQuery, description, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 ${description}... (attempt ${attempt}/${maxRetries})`)
      
      if (attempt > 1) {
        const delay = 2000 * attempt
        console.log(`⏳ Waiting ${delay/1000} seconds before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
      
      const result = await deleteQuery
      
      if (result.error) {
        console.error(`❌ Database error ${description.toLowerCase()}: ${result.error.message}`)
        continue
      } else {
        console.log(`✅ ${description} completed successfully`)
        return true
      }
    } catch (error) {
      console.error(`❌ Error ${description.toLowerCase()}:`, error.message)
    }
  }
  
  console.error(`❌ Failed after ${maxRetries} attempts`)
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
    console.log('✅ Connection test successful:', data)
    return true
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
    return false
  }
}

async function cleanDemoData() {
  try {
    console.log('\n🧹 Starting demo data cleanup...')
    
    // Test connection
    const connectionOk = await testConnection()
    if (!connectionOk) {
      console.error('❌ Cannot proceed without a working connection to Supabase')
      process.exit(1)
    }
    
    // Get all demo users
    console.log('👥 Fetching demo users...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Could not fetch users:', authError.message)
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
    
    // Clean up user interactions
    await safeDelete(
      'user_interactions',
      supabase.from('user_interactions').delete().in('user_id', demoUserIds),
      'Cleaning user interactions'
    )
    
    // Clean up swipe sessions
    await safeDelete(
      'swipe_sessions',
      supabase.from('swipe_sessions').delete().in('user_id', demoUserIds),
      'Cleaning swipe sessions'
    )
    
    // Get demo cats
    console.log('\n📸 Finding demo user cats...')
    const { data: demoCats, error: catsError } = await supabase
      .from('cats')
      .select('id')
      .in('user_id', demoUserIds)
    
    if (catsError) {
      console.error('❌ Error fetching cats:', catsError.message)
    } else {
      console.log(`Found ${demoCats.length} cats to clean up`)
      
      const demoCatIds = demoCats.map(cat => cat.id)
      
      // Clean up reactions TO demo cats
      await safeDelete(
        'reactions',
        supabase.from('reactions').delete().in('cat_id', demoCatIds),
        'Cleaning reactions to demo cats'
      )
      
      // Clean up reports
      await safeDelete(
        'reports',
        supabase.from('reports').delete().in('cat_id', demoCatIds),
        'Cleaning cat reports'
      )
    }
    
    // Clean up reactions made BY demo users
    await safeDelete(
      'reactions',
      supabase.from('reactions').delete().in('user_id', demoUserIds),
      'Cleaning demo user reactions'
    )
    
    // Clean up storage files
    console.log('\n🗂️ Cleaning up storage files...')
    try {
      const { data: files, error: listError } = await supabase.storage.from('cat-photos').list()
      
      if (!listError && files && files.length > 0) {
        const demoFiles = files.filter(file => 
          demoUserIds.some(userId => file.name.startsWith(userId))
        )
        
        if (demoFiles.length > 0) {
          console.log(`Found ${demoFiles.length} demo files to delete`)
          
          const fileNames = demoFiles.map(file => file.name)
          const { error: removeError } = await supabase.storage.from('cat-photos').remove(fileNames)
          
          if (removeError) {
            console.warn('Warning: Could not remove files:', removeError.message)
          } else {
            console.log('✅ Removed files successfully')
          }
        }
      }
    } catch (storageError) {
      console.warn('Warning: Storage cleanup failed:', storageError.message)
    }
    
    // Delete database records
    console.log('\n🗄️ Deleting database records...')
    
    // Clean up cat profiles
    await safeDelete(
      'cat_profiles',
      supabase.from('cat_profiles').delete().in('user_id', demoUserIds),
      'Cleaning cat profiles'
    )
    
    // Clean up cat photos
    await safeDelete(
      'cats',
      supabase.from('cats').delete().in('user_id', demoUserIds),
      'Cleaning cat photos'
    )
    
    // Delete demo user accounts
    console.log('\n👥 Deleting demo user accounts...')
    
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
      } catch (error) {
        console.error(`❌ Error deleting user ${user.email}:`, error.message)
      }
      
      // Small delay between user deletions
      await new Promise(resolve => setTimeout(resolve, 1000))
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
    
  } catch (error) {
    console.error('❌ Unexpected error during cleanup:', error)
  }
}

cleanDemoData()
