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
  console.error('Please ensure you have a .env file with:')
  console.error('VITE_SUPABASE_URL=your_supabase_url')
  console.error('VITE_SUPABASE_ANON_KEY=your_anon_key')
  console.error('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
  console.error('')
  console.error('The .env file should be in either:')
  console.error('- scripts/.env (current directory)')
  console.error('- .env (project root)')
  process.exit(1)
}

// Create Supabase client with SERVICE ROLE KEY for admin operations
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
      if (error.details) {
        console.error('Details:', error.details)
      }
      if (error.hint) {
        console.error('Hint:', error.hint)
      }
      return false
    }
    
    console.log('✅ Connection test successful')
    return true
  } catch (error) {
    console.error('❌ Network connection failed:', error.message)
    console.error('Please check:')
    console.error('  ✓ Check your internet connection')
    console.error('  ✓ Verify VITE_SUPABASE_URL is correct and starts with https://')
    console.error('  ✓ Confirm SUPABASE_SERVICE_ROLE_KEY is valid (not anon key)')
    console.error('  ✓ Ensure Supabase project is active and accessible')
    console.error('  ✓ Check for firewall/proxy blocking the connection')
    console.error('  ✓ Verify .env file exists in scripts/ or project root')
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
      console.error('')
      console.error('Troubleshooting checklist:')
      console.error('  ✓ Check your internet connection')
      console.error('  ✓ Verify VITE_SUPABASE_URL is correct and starts with https://')
      console.error('  ✓ Confirm SUPABASE_SERVICE_ROLE_KEY is valid (not anon key)')
      console.error('  ✓ Ensure Supabase project is active')
      console.error('  ✓ Check for firewall/proxy blocking connections')
      console.error('  ✓ Verify .env file exists in scripts/ or project root')
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
      console.log('ℹ️  No demo users found to clean up')
      console.log('✅ Database is already clean!')
      return
    }

    const demoUserIds = demoUsers.map(user => user.id)

    // Clean up user interactions (swipe data)
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
      
      if (demoCats.length > 0) {
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
    }

    // Clean up reactions made BY demo users
    await safeDelete(
      'reactions',
      supabase.from('reactions').delete().in('user_id', demoUserIds),
      'Cleaning demo user reactions'
    )

    // Clean up storage files
    console.log('\n🗂️  Cleaning up storage files...')
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
          const fileNames = demoFiles.map(file => file.name)
          
          const { error: removeError } = await supabase.storage
            .from('cat-photos')
            .remove(fileNames)

          if (removeError) {
            console.warn('⚠️  Warning: Could not remove files:', removeError.message)
          } else {
            console.log('✅ Removed files successfully')
          }
        } else {
          console.log('ℹ️  No demo files found in storage')
        }
      } else {
        console.log('ℹ️  No files found in storage or error listing files')
      }
    } catch (storageError) {
      console.warn('⚠️  Warning: Storage cleanup failed:', storageError.message)
    }

    // Delete database records in correct order (respecting foreign key constraints)
    console.log('\n🗄️  Deleting database records...')

    // Clean up cat profiles
    await safeDelete(
      'cat_profiles',
      supabase.from('cat_profiles').delete().in('user_id', demoUserIds),
      'Cleaning cat profiles'
    )

    // Clean up cat photos (cats table)
    await safeDelete(
      'cats',
      supabase.from('cats').delete().in('user_id', demoUserIds),
      'Cleaning cat photos'
    )

    // Clean up user profiles from users table
    await safeDelete(
      'users',
      supabase.from('users').delete().in('id', demoUserIds),
      'Cleaning user profiles'
    )

    // Delete demo user accounts from auth
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

      // Small delay between user deletions to avoid rate limiting
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
    console.log('')
    console.log('✨ Your database is now clean and ready for fresh demo data!')

  } catch (error) {
    console.error('❌ Unexpected error during cleanup:', error)
    console.error('')
    console.error('If you continue to have issues, please check:')
    console.error('  ✓ Your Supabase service role key has admin permissions')
    console.error('  ✓ Your internet connection is stable')
    console.error('  ✓ Your Supabase project is active and accessible')
  }
}

cleanDemoData()

