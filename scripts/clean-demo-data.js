import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables from the scripts directory
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration.')
  console.error('Please ensure you have a .env file in the scripts directory with:')
  console.error('VITE_SUPABASE_URL=your_supabase_url')
  console.error('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
  console.error('')
  console.error('Note: You need the SERVICE ROLE KEY, not the anon key!')
  process.exit(1)
}

if (supabaseServiceKey === 'your_service_role_key_here') {
  console.error('❌ Please replace "your_service_role_key_here" with your actual Supabase service role key.')
  console.error('You can find this in your Supabase dashboard under Settings > API.')
  process.exit(1)
}

// Test connection first
console.log('🔗 Testing Supabase connection...')
console.log(`URL: ${supabaseUrl}`)
console.log(`Service Key: ${supabaseServiceKey.substring(0, 20)}...`)

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Helper function to handle database operations with better error reporting
async function safeDelete(tableName, deleteQuery, description) {
  try {
    console.log(`🔄 ${description}...`)
    const result = await deleteQuery
    
    if (result.error) {
      console.error(`❌ Error ${description.toLowerCase()}: ${result.error.message}`)
      console.error('Full error:', result.error)
      return false
    } else {
      console.log(`✅ ${description} completed successfully`)
      return true
    }
  } catch (error) {
    console.error(`❌ Network error ${description.toLowerCase()}:`, error.message)
    if (error.cause) {
      console.error('Cause:', error.cause)
    }
    return false
  }
}

async function testConnection() {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1)
    if (error) {
      console.error('❌ Connection test failed:', error.message)
      return false
    }
    console.log('✅ Connection test successful')
    return true
  } catch (error) {
    console.error('❌ Network connection failed:', error.message)
    console.error('Please check:')
    console.error('1. Your internet connection')
    console.error('2. Supabase URL is correct')
    console.error('3. Service role key is valid')
    console.error('4. No firewall blocking the connection')
    return false
  }
}

async function cleanOrphanedPhotos() {
  try {
    console.log('🔍 Checking for orphaned cat photos...')
    
    // Find cats that reference non-existent users
    const { data: orphanedByUser, error: orphanedUserError } = await supabase
      .from('cats')
      .select('id, user_id, name, image_url')
      .not('user_id', 'in', `(SELECT id FROM users)`)
    
    if (orphanedUserError) {
      console.warn('Warning: Could not check for user-orphaned cats:', orphanedUserError.message)
    } else if (orphanedByUser && orphanedByUser.length > 0) {
      console.log(`Found ${orphanedByUser.length} cat photos with non-existent users`)
      
      const orphanedCatIds = orphanedByUser.map(cat => cat.id)
      
      // Clean up related data for orphaned cats
      await safeDelete(
        'reactions',
        supabase.from('reactions').delete().in('cat_id', orphanedCatIds),
        'Cleaning reactions for orphaned cats'
      )
      
      await safeDelete(
        'photo_exposure',
        supabase.from('photo_exposure').delete().in('cat_id', orphanedCatIds),
        'Cleaning exposure records for orphaned cats'
      )
      
      await safeDelete(
        'user_interactions',
        supabase.from('user_interactions').delete().in('cat_id', orphanedCatIds),
        'Cleaning interactions for orphaned cats'
      )
      
      await safeDelete(
        'reports',
        supabase.from('reports').delete().in('cat_id', orphanedCatIds),
        'Cleaning reports for orphaned cats'
      )
      
      // Delete the orphaned cat records
      await safeDelete(
        'cats',
        supabase.from('cats').delete().in('id', orphanedCatIds),
        'Removing orphaned cat photos from database'
      )
    }
    
    // Find cats that reference non-existent cat profiles (if cat_profile_id is set)
    const { data: orphanedByProfile, error: orphanedProfileError } = await supabase
      .from('cats')
      .select('id, cat_profile_id, name, image_url')
      .not('cat_profile_id', 'is', null)
      .not('cat_profile_id', 'in', `(SELECT id FROM cat_profiles)`)
    
    if (orphanedProfileError) {
      console.warn('Warning: Could not check for profile-orphaned cats:', orphanedProfileError.message)
    } else if (orphanedByProfile && orphanedByProfile.length > 0) {
      console.log(`Found ${orphanedByProfile.length} cat photos with non-existent cat profiles`)
      
      // For these, we'll just clear the cat_profile_id instead of deleting the photos
      // since the user might still exist
      const { error: updateError } = await supabase
        .from('cats')
        .update({ cat_profile_id: null })
        .in('id', orphanedByProfile.map(cat => cat.id))
      
      if (updateError) {
        console.warn('Warning: Could not clear orphaned cat_profile_id references:', updateError.message)
      } else {
        console.log(`✅ Cleared ${orphanedByProfile.length} orphaned cat profile references`)
      }
    }
    
    // Find and clean up orphaned storage files
    console.log('🗂️ Checking for orphaned storage files...')
    
    try {
      const { data: files, error: listError } = await supabase.storage
        .from('cat-photos')
        .list()
      
      if (!listError && files && files.length > 0) {
        // Get all valid image URLs from the cats table
        const { data: validCats, error: catsError } = await supabase
          .from('cats')
          .select('image_url')
        
        if (!catsError && validCats) {
          const validImageUrls = new Set(validCats.map(cat => cat.image_url))
          
          // Find files that are not referenced by any cat
          const orphanedFiles = []
          
          for (const file of files) {
            const { data: { publicUrl } } = supabase.storage
              .from('cat-photos')
              .getPublicUrl(file.name)
            
            if (!validImageUrls.has(publicUrl)) {
              orphanedFiles.push(file.name)
            }
          }
          
          if (orphanedFiles.length > 0) {
            console.log(`Found ${orphanedFiles.length} orphaned storage files`)
            
            const { error: removeError } = await supabase.storage
              .from('cat-photos')
              .remove(orphanedFiles)
            
            if (removeError) {
              console.warn('Warning: Could not remove some orphaned storage files:', removeError.message)
            } else {
              console.log(`✅ Removed ${orphanedFiles.length} orphaned storage files`)
            }
          } else {
            console.log('ℹ️ No orphaned storage files found')
          }
        }
      }
    } catch (storageError) {
      console.warn('Warning: Storage orphan cleanup failed:', storageError.message)
    }
    
  } catch (error) {
    console.error('❌ Error during orphaned photo cleanup:', error.message)
  }
}

async function cleanDemoData() {
  try {
    console.log('🧹 Starting comprehensive demo data cleanup...')
    
    // Test connection first
    const connectionOk = await testConnection()
    if (!connectionOk) {
      console.error('❌ Cannot proceed without a working connection to Supabase')
      process.exit(1)
    }
    
    // Get all demo users
    let authUsers, authError
    try {
      const result = await supabase.auth.admin.listUsers()
      authUsers = result.data
      authError = result.error
    } catch (error) {
      console.error('❌ Failed to list users:', error.message)
      console.error('This usually means the service role key is incorrect or expired.')
      process.exit(1)
    }
    
    if (authError) {
      console.error('❌ Auth error:', authError.message)
      process.exit(1)
    }
    
    const demoUsers = authUsers.users.filter(user => 
      user.user_metadata?.is_demo_account === true ||
      user.email?.endsWith('@test.com')
    )
    
    console.log(`Found ${demoUsers.length} demo users to remove`)
    
    if (demoUsers.length === 0) {
      console.log('ℹ️ No demo users found, but checking for orphaned photos...')
      // Still run orphaned photo cleanup even if no demo users
      await cleanOrphanedPhotos()
      console.log('✅ Orphaned photo cleanup completed!')
      return
    }

    const demoUserIds = demoUsers.map(user => user.id)
    
    // Step 1: Clean up swipe-related data first
    await safeDelete(
      'user_interactions',
      supabase.from('user_interactions').delete().in('user_id', demoUserIds),
      'Cleaning user interactions'
    )
    
    await safeDelete(
      'swipe_sessions',
      supabase.from('swipe_sessions').delete().in('user_id', demoUserIds),
      'Cleaning swipe sessions'
    )
    
    // Step 2: Get all cats owned by demo users (for photo exposure cleanup)
    console.log('📸 Finding demo user cats...')
    const { data: demoCats, error: catsError } = await supabase
      .from('cats')
      .select('id')
      .in('user_id', demoUserIds)
    
    if (catsError) {
      console.warn('Warning: Could not fetch demo cats:', catsError.message)
    } else if (demoCats && demoCats.length > 0) {
      const demoCatIds = demoCats.map(cat => cat.id)
      console.log(`Found ${demoCatIds.length} demo cat photos`)
      
      // Delete photo exposure records for demo cats
      await safeDelete(
        'photo_exposure',
        supabase.from('photo_exposure').delete().in('cat_id', demoCatIds),
        'Cleaning photo exposure records'
      )
      
      // Delete reactions to demo cats (from any user)
      await safeDelete(
        'reactions',
        supabase.from('reactions').delete().in('cat_id', demoCatIds),
        'Cleaning reactions to demo cats'
      )
      
      // Delete reports for demo cats
      await safeDelete(
        'reports',
        supabase.from('reports').delete().in('cat_id', demoCatIds),
        'Cleaning reports for demo cats'
      )
    }
    
    // Step 3: Delete reactions made BY demo users (to any cats)
    await safeDelete(
      'reactions',
      supabase.from('reactions').delete().in('user_id', demoUserIds),
      'Cleaning demo user reactions'
    )
    
    // Step 4: Clean up storage files BEFORE deleting database records
    console.log('🗂️ Cleaning up storage files...')
    
    try {
      const { data: files, error: listError } = await supabase.storage
        .from('cat-photos')
        .list()
      
      if (!listError && files && files.length > 0) {
        // Find files that belong to demo users (files are named with user ID prefix)
        const demoFiles = files.filter(file => 
          demoUserIds.some(userId => file.name.startsWith(userId))
        )
        
        if (demoFiles.length > 0) {
          console.log(`Found ${demoFiles.length} demo files to delete`)
          
          const filePaths = demoFiles.map(file => file.name)
          const { error: removeError } = await supabase.storage
            .from('cat-photos')
            .remove(filePaths)
          
          if (removeError) {
            console.warn('Warning: Could not remove some storage files:', removeError.message)
          } else {
            console.log(`✅ Removed ${filePaths.length} storage files`)
          }
        } else {
          console.log('ℹ️ No demo storage files found')
        }
      }
    } catch (storageError) {
      console.warn('Warning: Storage cleanup failed:', storageError.message)
    }
    
    // Step 5: Delete database records (this will cascade delete related data)
    console.log('🗄️ Deleting database records...')
    
    // Delete cat profiles (this will set cat_profile_id to NULL in cats table)
    await safeDelete(
      'cat_profiles',
      supabase.from('cat_profiles').delete().in('user_id', demoUserIds),
      'Cleaning cat profiles'
    )
    
    // Delete cats (this will cascade delete remaining reactions and reports)
    await safeDelete(
      'cats',
      supabase.from('cats').delete().in('user_id', demoUserIds),
      'Cleaning cat photos from database'
    )
    
    // Step 6: Delete demo user accounts (this will cascade delete users table records)
    console.log('👥 Deleting demo user accounts...')
    
    for (const user of demoUsers) {
      console.log(`Deleting user: ${user.email}`)
      
      try {
        const { error } = await supabase.auth.admin.deleteUser(user.id)
        if (error) {
          console.error(`❌ Error deleting user ${user.email}:`, error.message)
        } else {
          console.log(`✅ Deleted user: ${user.email}`)
        }
      } catch (error) {
        console.error(`❌ Network error deleting user ${user.email}:`, error.message)
      }
    }
    
    // Step 7: Clean up any orphaned records and photos
    console.log('🧽 Cleaning up orphaned records and photos...')
    await cleanOrphanedPhotos()
    
    try {
      // Clean up any remaining orphaned photo exposure records
      await safeDelete(
        'photo_exposure',
        supabase.from('photo_exposure').delete().not('cat_id', 'in', `(SELECT id FROM cats)`),
        'Cleaning remaining orphaned exposure records'
      )
      
      // Clean up any remaining orphaned user interactions
      await safeDelete(
        'user_interactions',
        supabase.from('user_interactions').delete().not('cat_id', 'in', `(SELECT id FROM cats)`),
        'Cleaning remaining orphaned interactions'
      )
      
      // Clean up any remaining orphaned reactions
      await safeDelete(
        'reactions',
        supabase.from('reactions').delete().not('cat_id', 'in', `(SELECT id FROM cats)`),
        'Cleaning remaining orphaned reactions'
      )
      
    } catch (cleanupError) {
      console.warn('Warning: Final orphaned record cleanup had issues:', cleanupError.message)
    }
    
    console.log('')
    console.log('🎉 Demo data cleanup completed!')
    console.log('')
    console.log('📊 What was cleaned:')
    console.log(`   • ${demoUsers.length} demo user accounts`)
    console.log('   • All cat profiles owned by demo users')
    console.log('   • All cat photos owned by demo users')
    console.log('   • All swipe interactions and sessions')
    console.log('   • All reactions (given and received by demo users)')
    console.log('   • All photo exposure tracking data')
    console.log('   • All storage files uploaded by demo users')
    console.log('   • All reports involving demo content')
    console.log('   • All orphaned photos without valid users/profiles')
    console.log('   • All orphaned storage files')
    console.log('')
    console.log('✨ Your database is now clean and ready for fresh demo data!')
    
  } catch (error) {
    console.error('❌ Unexpected error during cleanup:', error)
    console.log('')
    console.log('💡 Troubleshooting tips:')
    console.log('   • Ensure you are using the SERVICE_ROLE_KEY, not the ANON_KEY')
    console.log('   • Check your internet connection')
    console.log('   • Verify the Supabase URL is correct')
    console.log('   • Make sure the service role key is not expired')
    console.log('   • Check if any firewall is blocking the connection')
  }
}

cleanDemoData()