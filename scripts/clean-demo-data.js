import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration.')
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
    console.log('🧹 Cleaning demo data...')
    
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
    
    // Delete demo users (this will cascade delete all related data)
    for (const user of demoUsers) {
      console.log(`Deleting user: ${user.email}`)
      
      const { error } = await supabase.auth.admin.deleteUser(user.id)
      if (error) {
        console.error(`Error deleting user ${user.email}:`, error)
      }
    }
    
    // Clean up any orphaned storage files
    const { data: files, error: listError } = await supabase.storage
      .from('cat-photos')
      .list()
    
    if (!listError && files) {
      const demoFiles = files.filter(file => 
        demoUsers.some(user => file.name.startsWith(user.id))
      )
      
      if (demoFiles.length > 0) {
        const filePaths = demoFiles.map(file => file.name)
        const { error: removeError } = await supabase.storage
          .from('cat-photos')
          .remove(filePaths)
        
        if (removeError) {
          console.error('Error removing storage files:', removeError)
        } else {
          console.log(`Removed ${filePaths.length} storage files`)
        }
      }
    }
    
    console.log('✅ Demo data cleanup completed!')
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  }
}

cleanDemoData()