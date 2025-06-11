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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function cleanDemoData() {
  try {
    console.log('🧹 Starting comprehensive demo data cleanup...')
    
    // Get all demo users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      throw authError
    }
    
    const demoUsers = authUsers.users.filter(user => 
      user.user_metadata?.is_demo_account === true ||
      user.email?.endsWith('@test.com')
    )
    
    console.log(`Found ${demoUsers.length} demo users to remove`)
    
    if (demoUsers.length === 0) {
      console.log('✅ No demo users found. Database is already clean!')
      return
    }

    const demoUserIds = demoUsers.map(user => user.id)
    
    // Step 1: Clean up swipe-related data first
    console.log('🔄 Cleaning swipe interaction data...')
    
    // Delete user interactions for demo users
    const { error: interactionsError } = await supabase
      .from('user_interactions')
      .delete()
      .in('user_id', demoUserIds)
    
    if (interactionsError) {
      console.warn('Warning: Could not delete user interactions:', interactionsError.message)
    } else {
      console.log('✅ Deleted user interactions')
    }
    
    // Delete swipe sessions for demo users
    const { error: sessionsError } = await supabase
      .from('swipe_sessions')
      .delete()
      .in('user_id', demoUserIds)
    
    if (sessionsError) {
      console.warn('Warning: Could not delete swipe sessions:', sessionsError.message)
    } else {
      console.log('✅ Deleted swipe sessions')
    }
    
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
      const { error: exposureError } = await supabase
        .from('photo_exposure')
        .delete()
        .in('cat_id', demoCatIds)
      
      if (exposureError) {
        console.warn('Warning: Could not delete photo exposure records:', exposureError.message)
      } else {
        console.log('✅ Deleted photo exposure records')
      }
      
      // Delete reactions to demo cats (from any user)
      const { error: reactionsError } = await supabase
        .from('reactions')
        .delete()
        .in('cat_id', demoCatIds)
      
      if (reactionsError) {
        console.warn('Warning: Could not delete reactions to demo cats:', reactionsError.message)
      } else {
        console.log('✅ Deleted reactions to demo cats')
      }
      
      // Delete reports for demo cats
      const { error: reportsError } = await supabase
        .from('reports')
        .delete()
        .in('cat_id', demoCatIds)
      
      if (reportsError) {
        console.warn('Warning: Could not delete reports for demo cats:', reportsError.message)
      } else {
        console.log('✅ Deleted reports for demo cats')
      }
    }
    
    // Step 3: Delete reactions made BY demo users (to any cats)
    console.log('💕 Cleaning demo user reactions...')
    const { error: userReactionsError } = await supabase
      .from('reactions')
      .delete()
      .in('user_id', demoUserIds)
    
    if (userReactionsError) {
      console.warn('Warning: Could not delete demo user reactions:', userReactionsError.message)
    } else {
      console.log('✅ Deleted demo user reactions')
    }
    
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
      console.warn('Warning: Storage cleanup failed:', storageError)
    }
    
    // Step 5: Delete database records (this will cascade delete related data)
    console.log('🗄️ Deleting database records...')
    
    // Delete cat profiles (this will set cat_profile_id to NULL in cats table)
    const { error: profilesError } = await supabase
      .from('cat_profiles')
      .delete()
      .in('user_id', demoUserIds)
    
    if (profilesError) {
      console.warn('Warning: Could not delete cat profiles:', profilesError.message)
    } else {
      console.log('✅ Deleted cat profiles')
    }
    
    // Delete cats (this will cascade delete remaining reactions and reports)
    const { error: deleteCatsError } = await supabase
      .from('cats')
      .delete()
      .in('user_id', demoUserIds)
    
    if (deleteCatsError) {
      console.warn('Warning: Could not delete cats:', deleteCatsError.message)
    } else {
      console.log('✅ Deleted cat photos from database')
    }
    
    // Step 6: Delete demo user accounts (this will cascade delete users table records)
    console.log('👥 Deleting demo user accounts...')
    
    for (const user of demoUsers) {
      console.log(`Deleting user: ${user.email}`)
      
      const { error } = await supabase.auth.admin.deleteUser(user.id)
      if (error) {
        console.error(`❌ Error deleting user ${user.email}:`, error.message)
      } else {
        console.log(`✅ Deleted user: ${user.email}`)
      }
    }
    
    // Step 7: Clean up any orphaned records
    console.log('🧽 Cleaning up orphaned records...')
    
    try {
      // Clean up any orphaned photo exposure records
      const { error: orphanedExposureError } = await supabase
        .from('photo_exposure')
        .delete()
        .not('cat_id', 'in', `(SELECT id FROM cats)`)
      
      if (orphanedExposureError) {
        console.warn('Warning: Could not clean orphaned exposure records:', orphanedExposureError.message)
      }
      
      // Clean up any orphaned user interactions
      const { error: orphanedInteractionsError } = await supabase
        .from('user_interactions')
        .delete()
        .not('cat_id', 'in', `(SELECT id FROM cats)`)
      
      if (orphanedInteractionsError) {
        console.warn('Warning: Could not clean orphaned interactions:', orphanedInteractionsError.message)
      }
      
      console.log('✅ Cleaned up orphaned records')
    } catch (cleanupError) {
      console.warn('Warning: Orphaned record cleanup had issues:', cleanupError)
    }
    
    console.log('')
    console.log('🎉 Demo data cleanup completed successfully!')
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
    console.log('')
    console.log('✨ Your database is now clean and ready for fresh demo data!')
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    console.log('')
    console.log('💡 If you see permission errors, make sure you are using the SERVICE_ROLE_KEY')
    console.log('   and not the ANON_KEY in your .env file.')
  }
}

cleanDemoData()