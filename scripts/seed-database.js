import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Supabase configuration
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

// Real cat names that are popular and cute
const catNames = [
  'Luna', 'Bella', 'Oliver', 'Charlie', 'Lucy', 'Max', 'Lily', 'Simba',
  'Milo', 'Chloe', 'Leo', 'Nala', 'Smokey', 'Shadow', 'Tiger', 'Princess',
  'Mittens', 'Whiskers', 'Ginger', 'Oreo', 'Patches', 'Snowball', 'Coco',
  'Daisy', 'Felix', 'Jasper', 'Ruby', 'Rosie', 'Oscar', 'Zoe', 'Mia',
  'Sophie', 'Toby', 'Molly', 'Jack', 'Lola', 'Sam', 'Penny', 'Buddy',
  'Gracie', 'Tucker', 'Maggie', 'Bear', 'Sadie', 'Duke', 'Stella'
]

// Funny captions written by female cat lovers
const catCaptions = [
  "When your cat gives you THAT look and you know you're in trouble 😹",
  "My therapist: 'Your cat can't actually judge you.' My cat: 👁️👄👁️",
  "POV: You opened a can of tuna and suddenly have a best friend 🐟💕",
  "This is my 'I knocked something off your desk' face 😇",
  "Caught red-pawed destroying the toilet paper... again 🧻😅",
  "When you realize the red dot will never be caught but you must try anyway 🔴",
  "My cat's daily schedule: Sleep, judge humans, knock things over, repeat 😴",
  "That moment when you find the PERFECT nap spot ☀️😻",
  "My human thinks they own me... how adorable 👑",
  "Excuse me, this is MY chair now. You may find somewhere else to sit 💺",
  "When someone says they're a dog person in front of me 🙄",
  "3AM zoomies because why sleep when you can ZOOM? 🏃‍♀️💨",
  "My face when the food bowl is only 90% full 😤",
  "Plotting world domination from my cardboard fortress 📦👑",
  "When you hear the treat bag crinkle from three rooms away 👂✨",
  "This box is clearly made for me, regardless of size 📦😸",
  "My human's keyboard makes the perfect bed, obviously ⌨️😴",
  "When you're trying to be photogenic but your personality shows 📸",
  "That 'I definitely didn't break anything' innocent face 😇",
  "Sunbathing is a full-time job and I take it very seriously ☀️",
  "My reaction when someone moves me from my favorite spot 😾",
  "Professional bird watcher and window supervisor 🐦👀",
  "When you realize you're out of treats and must resort to being cute 🥺",
  "This is my 'feed me or I'll knock everything off the counter' look 😼",
  "Caught in 4K being absolutely adorable 📹💕",
  "My human bought me a $50 bed but this cardboard box hits different 📦",
  "When you're trying to work from home but your supervisor has other plans 💻😹",
  "That post-grooming glow ✨🛁",
  "My face when someone tries to move me during my 18th nap of the day 😴",
  "Professional treat quality inspector reporting for duty 🕵️‍♀️",
  "This is my 'I love you but also give me space' face 😽",
  "When you find the one warm spot in the entire house ☀️😻",
  "My human thinks they're the boss... how cute 😏",
  "Caught being a perfect angel (for once) 😇✨",
  "This is my 'I'm not spoiled, I'm just well-loved' pose 💅",
  "When you realize the vacuum is coming out and it's time to HIDE 🏃‍♀️💨",
  "My daily meditation: staring at the wall for no reason 🧘‍♀️",
  "That 'I definitely belong on this expensive furniture' energy 🛋️👑",
  "Professional lap warmer and purr machine at your service 🥰",
  "This is my 'I'm judging your life choices' face 🤨"
]

// Demo user data - female cat lovers with realistic usernames
const demoUsers = [
  {
    username: 'sarah_catlover',
    email: 'sarah@test.com',
    firstName: 'Sarah'
  },
  {
    username: 'emma_kitty',
    email: 'emma@test.com',
    firstName: 'Emma'
  },
  {
    username: 'mia_meow',
    email: 'mia@test.com',
    firstName: 'Mia'
  },
  {
    username: 'lily_pawsome',
    email: 'lily@test.com',
    firstName: 'Lily'
  },
  {
    username: 'zoe_feline',
    email: 'zoe@test.com',
    firstName: 'Zoe'
  },
  {
    username: 'grace_whiskers',
    email: 'grace@test.com',
    firstName: 'Grace'
  },
  {
    username: 'ava_purr',
    email: 'ava@test.com',
    firstName: 'Ava'
  },
  {
    username: 'chloe_cats',
    email: 'chloe@test.com',
    firstName: 'Chloe'
  },
  {
    username: 'maya_meows',
    email: 'maya@test.com',
    firstName: 'Maya'
  },
  {
    username: 'ruby_furbaby',
    email: 'ruby@test.com',
    firstName: 'Ruby'
  },
  {
    username: 'sophia_kitties',
    email: 'sophia@test.com',
    firstName: 'Sophia'
  },
  {
    username: 'hannah_paws',
    email: 'hannah@test.com',
    firstName: 'Hannah'
  },
  {
    username: 'olivia_catmom',
    email: 'olivia@test.com',
    firstName: 'Olivia'
  },
  {
    username: 'natalie_fluff',
    email: 'natalie@test.com',
    firstName: 'Natalie'
  },
  {
    username: 'jessica_purrs',
    email: 'jessica@test.com',
    firstName: 'Jessica'
  },
  {
    username: 'amanda_whiskers',
    email: 'amanda@test.com',
    firstName: 'Amanda'
  },
  {
    username: 'rachel_kitty',
    email: 'rachel@test.com',
    firstName: 'Rachel'
  },
  {
    username: 'kelly_feline',
    email: 'kelly@test.com',
    firstName: 'Kelly'
  },
  {
    username: 'lauren_meow',
    email: 'lauren@test.com',
    firstName: 'Lauren'
  },
  {
    username: 'stephanie_paws',
    email: 'stephanie@test.com',
    firstName: 'Stephanie'
  }
]

// Cat breeds for realistic profiles
const catBreeds = [
  'Domestic Shorthair', 'Domestic Longhair', 'Maine Coon', 'Persian', 'Siamese',
  'British Shorthair', 'Ragdoll', 'Bengal', 'Russian Blue', 'Scottish Fold',
  'Abyssinian', 'American Shorthair', 'Oriental', 'Birman', 'Burmese',
  'Norwegian Forest Cat', 'Turkish Angora', 'Exotic Shorthair', 'Devon Rex',
  'Cornish Rex', 'Manx', 'Munchkin', 'Sphynx', 'Tonkinese', 'Bombay'
]

// Function to get a random item from an array
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)]
}

// Function to get local cat photo path
function getLocalCatPhotoPath(photoNumber) {
  const paddedNumber = photoNumber.toString().padStart(2, '0')
  return path.join(__dirname, '..', 'public', `cute_cat_${paddedNumber}.jpg`)
}

// Function to upload local image to Supabase Storage
async function uploadLocalImageToSupabase(localImagePath, fileName, userId) {
  try {
    if (!fs.existsSync(localImagePath)) {
      console.error(`❌ Local image not found: ${localImagePath}`)
      return null
    }

    const fileBuffer = fs.readFileSync(localImagePath)
    const fileExt = path.extname(fileName)
    const uniqueFileName = `${userId}-${Date.now()}${fileExt}`
    
    const { data, error } = await supabase.storage
      .from('cat-photos')
      .upload(uniqueFileName, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: false
      })
    
    if (error) {
      throw error
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('cat-photos')
      .getPublicUrl(uniqueFileName)
    
    console.log(`✅ Uploaded local image to Supabase: ${uniqueFileName}`)
    return publicUrl
  } catch (error) {
    console.error(`❌ Error uploading ${fileName} to Supabase:`, error)
    return null
  }
}

// Function to create user account
async function createUserAccount(userData) {
  try {
    console.log(`Creating user account for ${userData.username}...`)
    
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: 'Testing01!',
      email_confirm: true,
      user_metadata: {
        username: userData.username,
        is_demo_account: true
      }
    })
    
    if (authError) {
      throw authError
    }
    
    const userId = authData.user.id
    
    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert([{
        id: userId,
        email: userData.email,
        username: userData.username,
        created_at: new Date().toISOString()
      }])
    
    if (profileError) {
      throw profileError
    }
    
    console.log(`✅ Created user: ${userData.username} (${userId})`)
    return userId
  } catch (error) {
    console.error(`❌ Error creating user ${userData.username}:`, error)
    return null
  }
}

// Function to create cat profile with local photo
async function createCatProfile(userId, catName, breed, photoNumber) {
  try {
    console.log(`Creating cat profile for ${catName}...`)
    
    const ages = ['6 months', '1 year', '2 years', '3 years', '4 years', '5 years', '6 years', '7 years']
    const sexes = ['Male', 'Female']
    const personalities = [
      'Playful and energetic',
      'Calm and affectionate',
      'Independent and curious',
      'Social and friendly',
      'Mischievous and clever',
      'Gentle and sweet',
      'Adventurous and bold',
      'Lazy and cuddly'
    ]
    
    // Upload profile picture from local files
    let profilePictureUrl = null
    if (photoNumber) {
      const localImagePath = getLocalCatPhotoPath(photoNumber)
      profilePictureUrl = await uploadLocalImageToSupabase(
        localImagePath, 
        `profile_${catName.toLowerCase()}.jpg`, 
        userId
      )
    }
    
    const { data, error } = await supabase
      .from('cat_profiles')
      .insert([{
        user_id: userId,
        name: catName,
        breed: breed,
        age: getRandomItem(ages),
        sex: getRandomItem(sexes),
        personality: getRandomItem(personalities),
        favourite_treat: getRandomItem(['Tuna', 'Salmon', 'Chicken treats', 'Catnip', 'Freeze-dried treats']),
        favourite_toy: getRandomItem(['Feather wand', 'Laser pointer', 'Catnip mouse', 'Ball', 'String']),
        favourite_word: getRandomItem(['Treats', 'Outside', 'Play', 'Food', 'Mama']),
        play_time_preference: getRandomItem(['Morning', 'Afternoon', 'Evening', 'Night', 'Anytime']),
        profile_picture: profilePictureUrl
      }])
      .select()
      .single()
    
    if (error) {
      throw error
    }
    
    console.log(`✅ Created cat profile: ${catName} (${data.id})`)
    return data.id
  } catch (error) {
    console.error(`❌ Error creating cat profile for ${catName}:`, error)
    return null
  }
}

// Function to create cat photo using local images
async function createCatPhoto(userId, catProfileId, catName, photoNumber, caption) {
  try {
    console.log(`Creating photo for ${catName} using local image ${photoNumber}...`)
    
    // Get local image path
    const localImagePath = getLocalCatPhotoPath(photoNumber)
    
    if (!fs.existsSync(localImagePath)) {
      console.error(`❌ Local image not found: ${localImagePath}`)
      return null
    }
    
    // Upload to Supabase
    const uploadedImageUrl = await uploadLocalImageToSupabase(
      localImagePath, 
      `${catName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.jpg`, 
      userId
    )
    
    if (!uploadedImageUrl) {
      console.error(`❌ Failed to upload image for ${catName}`)
      return null
    }
    
    // Create cat photo record
    const { data, error } = await supabase
      .from('cats')
      .insert([{
        user_id: userId,
        name: catName,
        caption: caption,
        image_url: uploadedImageUrl,
        cat_profile_id: catProfileId
      }])
      .select()
      .single()
    
    if (error) {
      throw error
    }
    
    console.log(`✅ Created photo for ${catName}: ${caption}`)
    return data.id
  } catch (error) {
    console.error(`❌ Error creating photo for ${catName}:`, error)
    return null
  }
}

// Function to create reactions
async function createReactions(catIds, userIds) {
  try {
    console.log('Creating reactions...')
    
    const reactions = []
    const emojis = ['❤️', '😻', '😸', '😹', '😺', '💕', '🥰', '😍', '🤩', '⭐']
    
    for (const catId of catIds) {
      // Each cat gets 5-25 random reactions
      const numReactions = Math.floor(Math.random() * 20) + 5
      const reactingUsers = [...userIds].sort(() => 0.5 - Math.random()).slice(0, numReactions)
      
      for (const userId of reactingUsers) {
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)]
        reactions.push({
          user_id: userId,
          cat_id: catId,
          emoji_type: randomEmoji,
          created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        })
      }
    }
    
    // Insert reactions in batches
    const batchSize = 100
    for (let i = 0; i < reactions.length; i += batchSize) {
      const batch = reactions.slice(i, i + batchSize)
      const { error } = await supabase
        .from('reactions')
        .insert(batch)
      
      if (error) {
        console.error('Error inserting reaction batch:', error)
      }
    }
    
    console.log(`✅ Created ${reactions.length} reactions`)
  } catch (error) {
    console.error('❌ Error creating reactions:', error)
  }
}

// Test connection function
async function testConnection() {
  try {
    console.log('🔗 Testing Supabase connection...')
    console.log(`URL: ${supabaseUrl}`)
    console.log(`Service Key: ${supabaseServiceKey.substring(0, 20)}...`)
    
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

// Main seeding function
async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding with LOCAL cat photos...')
    console.log(`📸 Using 20 local cat photos from public folder`)
    
    // Test connection first
    const connectionOk = await testConnection()
    if (!connectionOk) {
      console.error('❌ Cannot proceed without a working connection to Supabase')
      process.exit(1)
    }
    
    // Verify local photos exist
    const missingPhotos = []
    for (let i = 1; i <= 20; i++) {
      const photoPath = getLocalCatPhotoPath(i)
      if (!fs.existsSync(photoPath)) {
        missingPhotos.push(`cute_cat_${i.toString().padStart(2, '0')}.jpg`)
      }
    }
    
    if (missingPhotos.length > 0) {
      console.error('❌ Missing local cat photos:', missingPhotos)
      console.error('Please ensure all cat photos (cute_cat_01.jpg to cute_cat_20.jpg) are in the public folder')
      process.exit(1)
    }
    
    console.log('✅ All 20 local cat photos found')
    
    const userIds = []
    const catIds = []
    
    // Create users and their cats using local photos
    for (let i = 0; i < demoUsers.length; i++) {
      const userData = demoUsers[i]
      const userId = await createUserAccount(userData)
      if (!userId) continue
      
      userIds.push(userId)
      
      // Use photo number based on user index (1-20, cycling if more users)
      const photoNumber = (i % 20) + 1
      
      // Create 1 cat profile per user using their assigned photo
      const catName = getRandomItem(catNames)
      const breed = getRandomItem(catBreeds)
      
      const catProfileId = await createCatProfile(userId, catName, breed, photoNumber)
      if (!catProfileId) continue
      
      // Create 1-3 photos per cat using the same photo number for consistency
      const numPhotos = Math.floor(Math.random() * 3) + 1
      
      for (let k = 0; k < numPhotos; k++) {
        const caption = getRandomItem(catCaptions)
        
        const catId = await createCatPhoto(userId, catProfileId, catName, photoNumber, caption)
        if (catId) {
          catIds.push(catId)
        }
        
        // Small delay between photos
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      // Add delay between users to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    // Create reactions between users
    if (catIds.length > 0 && userIds.length > 0) {
      await createReactions(catIds, userIds)
    }
    
    console.log('✅ Database seeding completed!')
    console.log(`📊 Created ${userIds.length} users with ${catIds.length} cat photos`)
    console.log('🔐 All demo accounts use password: Testing01!')
    console.log('🏷️ Demo accounts are tagged with is_demo_account: true for easy removal')
    console.log(`📸 Used ${Math.min(userIds.length, 20)} local cat photos from public folder`)
    
    console.log('\n📧 Demo account emails:')
    demoUsers.slice(0, userIds.length).forEach(user => {
      console.log(`   • ${user.email}`)
    })
    
  } catch (error) {
    console.error('❌ Error during database seeding:', error)
  }
}

// Run the seeding
seedDatabase()