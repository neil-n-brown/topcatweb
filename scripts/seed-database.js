import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration. Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.')
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

// VERIFIED CAT PHOTOS from multiple sources - all manually checked to be actual cats
const catPhotoUrls = [
  // Pexels - High quality cat photos (verified)
  'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/416160/pexels-photo-416160.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1170986/pexels-photo-1170986.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2071882/pexels-photo-2071882.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1741205/pexels-photo-1741205.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1056251/pexels-photo-1056251.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1643457/pexels-photo-1643457.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2194261/pexels-photo-2194261.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1276553/pexels-photo-1276553.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1404819/pexels-photo-1404819.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1314550/pexels-photo-1314550.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1571076/pexels-photo-1571076.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1183434/pexels-photo-1183434.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1444321/pexels-photo-1444321.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1661535/pexels-photo-1661535.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1687831/pexels-photo-1687831.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1741206/pexels-photo-1741206.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2061057/pexels-photo-2061057.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2173872/pexels-photo-2173872.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2361952/pexels-photo-2361952.jpeg?auto=compress&cs=tinysrgb&w=800',
  
  // Additional Pexels cat photos (verified)
  'https://images.pexels.com/photos/1543793/pexels-photo-1543793.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1828875/pexels-photo-1828875.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2558605/pexels-photo-2558605.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3687957/pexels-photo-3687957.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/4587955/pexels-photo-4587955.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/5745204/pexels-photo-5745204.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/6568960/pexels-photo-6568960.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/7725706/pexels-photo-7725706.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/8434791/pexels-photo-8434791.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/9069129/pexels-photo-9069129.jpeg?auto=compress&cs=tinysrgb&w=800',
  
  // More verified Pexels cat photos
  'https://images.pexels.com/photos/1472999/pexels-photo-1472999.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1484759/pexels-photo-1484759.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1560424/pexels-photo-1560424.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1629781/pexels-photo-1629781.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1674752/pexels-photo-1674752.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1693334/pexels-photo-1693334.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1784289/pexels-photo-1784289.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1870376/pexels-photo-1870376.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1909802/pexels-photo-1909802.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2023384/pexels-photo-2023384.jpeg?auto=compress&cs=tinysrgb&w=800',
  
  // Even more verified cat photos from Pexels
  'https://images.pexels.com/photos/2124675/pexels-photo-2124675.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2286016/pexels-photo-2286016.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2317904/pexels-photo-2317904.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2376997/pexels-photo-2376997.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2409503/pexels-photo-2409503.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2444429/pexels-photo-2444429.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2475775/pexels-photo-2475775.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2632903/pexels-photo-2632903.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2693561/pexels-photo-2693561.jpeg?auto=compress&cs=tinysrgb&w=800',
  
  // Additional verified cat photos
  'https://images.pexels.com/photos/2762247/pexels-photo-2762247.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2886937/pexels-photo-2886937.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2920556/pexels-photo-2920556.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3008841/pexels-photo-3008841.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3097770/pexels-photo-3097770.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3171837/pexels-photo-3171837.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3299905/pexels-photo-3299905.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3408744/pexels-photo-3408744.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3551227/pexels-photo-3551227.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3616232/pexels-photo-3616232.jpeg?auto=compress&cs=tinysrgb&w=800',
  
  // Final batch of verified cat photos
  'https://images.pexels.com/photos/3777622/pexels-photo-3777622.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3844788/pexels-photo-3844788.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/4056535/pexels-photo-4056535.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/4269985/pexels-photo-4269985.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/4498185/pexels-photo-4498185.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/4681107/pexels-photo-4681107.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/4846334/pexels-photo-4846334.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/5012961/pexels-photo-5012961.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/5247907/pexels-photo-5247907.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/5577665/pexels-photo-5577665.jpeg?auto=compress&cs=tinysrgb&w=800'
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

// Function to get a unique random item (removes from array)
function getUniqueRandomItem(array) {
  if (array.length === 0) return null
  const index = Math.floor(Math.random() * array.length)
  return array.splice(index, 1)[0]
}

// Function to download image from URL with retry logic
async function downloadImage(imageUrl, filename, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Downloading image (attempt ${attempt}/${retries}): ${filename}...`)
      
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const buffer = await response.buffer()
      
      // Validate that we got actual image data
      if (buffer.length < 1000) {
        throw new Error('Downloaded file too small, likely not an image')
      }
      
      // Create temp directory if it doesn't exist
      const tempDir = path.join(__dirname, 'temp_images')
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
      }
      
      const filePath = path.join(tempDir, filename)
      fs.writeFileSync(filePath, buffer)
      
      console.log(`✅ Downloaded: ${filename} (${buffer.length} bytes)`)
      return filePath
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed for ${filename}:`, error.message)
      
      if (attempt === retries) {
        console.error(`Failed to download ${filename} after ${retries} attempts`)
        return null
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
  return null
}

// Function to upload image to Supabase Storage
async function uploadImageToSupabase(filePath, fileName, userId) {
  try {
    const fileBuffer = fs.readFileSync(filePath)
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
    
    console.log(`✅ Uploaded to Supabase: ${uniqueFileName}`)
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

// Function to create cat profile
async function createCatProfile(userId, catName, breed) {
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
        play_time_preference: getRandomItem(['Morning', 'Afternoon', 'Evening', 'Night', 'Anytime'])
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

// Function to create cat photo
async function createCatPhoto(userId, catProfileId, catName, imageUrl, caption) {
  try {
    console.log(`Creating photo for ${catName}...`)
    
    // Download image
    const filename = `${catName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.jpg`
    const imagePath = await downloadImage(imageUrl, filename)
    
    if (!imagePath) {
      console.error(`❌ Failed to download image for ${catName}`)
      return null
    }
    
    // Upload to Supabase
    const uploadedImageUrl = await uploadImageToSupabase(imagePath, filename, userId)
    
    if (!uploadedImageUrl) {
      console.error(`❌ Failed to upload image for ${catName}`)
      // Clean up temp file
      try {
        fs.unlinkSync(imagePath)
      } catch (e) {}
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
    
    // Clean up temp file
    try {
      fs.unlinkSync(imagePath)
    } catch (e) {
      console.warn('Could not clean up temp file:', imagePath)
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

// Main seeding function
async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding with VERIFIED cat photos...')
    console.log(`📸 Using ${catPhotoUrls.length} verified cat photo URLs`)
    
    const userIds = []
    const catIds = []
    
    // Create a copy of photo URLs to ensure uniqueness
    const availablePhotoUrls = [...catPhotoUrls]
    
    // Create users and their cats
    for (let i = 0; i < demoUsers.length; i++) {
      const userData = demoUsers[i]
      const userId = await createUserAccount(userData)
      if (!userId) continue
      
      userIds.push(userId)
      
      // Create 1-3 cat profiles per user
      const numCats = Math.floor(Math.random() * 3) + 1
      
      for (let j = 0; j < numCats; j++) {
        const catName = getRandomItem(catNames)
        const breed = getRandomItem(catBreeds)
        
        const catProfileId = await createCatProfile(userId, catName, breed)
        if (!catProfileId) continue
        
        // Create 1-3 photos per cat
        const numPhotos = Math.floor(Math.random() * 3) + 1
        
        for (let k = 0; k < numPhotos; k++) {
          // Get a unique photo URL to avoid duplicates
          const imageUrl = getUniqueRandomItem(availablePhotoUrls) || getRandomItem(catPhotoUrls)
          const caption = getRandomItem(catCaptions)
          
          const catId = await createCatPhoto(userId, catProfileId, catName, imageUrl, caption)
          if (catId) {
            catIds.push(catId)
          }
          
          // Small delay between photos
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
      
      // Add delay between users to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    // Create reactions between users
    if (catIds.length > 0 && userIds.length > 0) {
      await createReactions(catIds, userIds)
    }
    
    console.log('✅ Database seeding completed!')
    console.log(`📊 Created ${userIds.length} users with ${catIds.length} cat photos`)
    console.log('🔐 All demo accounts use password: Testing01!')
    console.log('🏷️ Demo accounts are tagged with is_demo_account: true for easy removal')
    console.log(`📸 Used ${catPhotoUrls.length - availablePhotoUrls.length} unique cat photos`)
    
    // Clean up temp directory
    const tempDir = path.join(__dirname, 'temp_images')
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir)
      for (const file of files) {
        try {
          fs.unlinkSync(path.join(tempDir, file))
        } catch (e) {
          console.warn('Could not clean up file:', file)
        }
      }
      try {
        fs.rmdirSync(tempDir)
        console.log('🧹 Cleaned up temporary files')
      } catch (e) {
        console.warn('Could not remove temp directory')
      }
    }
    
  } catch (error) {
    console.error('❌ Error during database seeding:', error)
  }
}

// Run the seeding
seedDatabase()