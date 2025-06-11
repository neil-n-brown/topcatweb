import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // You'll need to add this

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

// Demo user data - female cat lovers
const demoUsers = [
  {
    username: 'sarah_catlover',
    email: 'sarah@test.com',
    firstName: 'Sarah',
    cats: [
      {
        name: 'Luna',
        breed: 'British Shorthair',
        age: '2 years',
        sex: 'Female',
        personality: 'Playful and curious, loves to explore every corner of the house',
        favourite_person: 'Sarah',
        favourite_treat: 'Salmon treats',
        favourite_toy: 'Feather wand',
        favourite_word: 'Treats',
        play_time_preference: 'Evening',
        photos: [
          {
            caption: 'Luna discovered the perfect nap spot in my laundry basket! 😴🧺',
            searchTerm: 'cute gray cat sleeping'
          },
          {
            caption: 'When Luna realizes it\'s treat time and gives me THOSE eyes 👀✨',
            searchTerm: 'british shorthair cat looking'
          }
        ]
      }
    ]
  },
  {
    username: 'emma_kitty',
    email: 'emma@test.com',
    firstName: 'Emma',
    cats: [
      {
        name: 'Whiskers',
        breed: 'Orange Tabby',
        age: '3 years',
        sex: 'Male',
        personality: 'Mischievous and energetic, always getting into trouble',
        favourite_person: 'Emma',
        favourite_treat: 'Tuna',
        favourite_toy: 'Catnip mouse',
        favourite_word: 'Outside',
        play_time_preference: 'Morning',
        photos: [
          {
            caption: 'Whiskers thinks he\'s helping with my work from home setup 💻😹',
            searchTerm: 'orange tabby cat computer'
          }
        ]
      }
    ]
  },
  {
    username: 'mia_meow',
    email: 'mia@test.com',
    firstName: 'Mia',
    cats: [
      {
        name: 'Shadow',
        breed: 'Black Cat',
        age: '1 year',
        sex: 'Female',
        personality: 'Mysterious and elegant, loves to pose for photos',
        favourite_person: 'Mia',
        favourite_treat: 'Chicken',
        favourite_toy: 'Laser pointer',
        favourite_word: 'Pretty',
        play_time_preference: 'Night',
        photos: [
          {
            caption: 'Shadow being absolutely DRAMATIC as usual 🖤✨ #BlackCatMagic',
            searchTerm: 'black cat dramatic pose'
          }
        ]
      }
    ]
  },
  {
    username: 'lily_pawsome',
    email: 'lily@test.com',
    firstName: 'Lily',
    cats: [
      {
        name: 'Mittens',
        breed: 'Ragdoll',
        age: '4 years',
        sex: 'Female',
        personality: 'Gentle giant, loves cuddles and being carried around',
        favourite_person: 'Lily',
        favourite_treat: 'Freeze-dried chicken',
        favourite_toy: 'Stuffed mouse',
        favourite_word: 'Cuddles',
        play_time_preference: 'Afternoon',
        photos: [
          {
            caption: 'Mittens in full fluff mode after her grooming session! 🎀💕',
            searchTerm: 'ragdoll cat fluffy'
          }
        ]
      }
    ]
  },
  {
    username: 'zoe_feline',
    email: 'zoe@test.com',
    firstName: 'Zoe',
    cats: [
      {
        name: 'Bella',
        breed: 'Siamese',
        age: '2 years',
        sex: 'Female',
        personality: 'Vocal and demanding, always has something to say',
        favourite_person: 'Zoe',
        favourite_treat: 'Fish flakes',
        favourite_toy: 'Interactive puzzle',
        favourite_word: 'Mama',
        play_time_preference: 'Morning',
        photos: [
          {
            caption: 'Bella giving me a lecture about being 5 minutes late with breakfast 😤🗣️',
            searchTerm: 'siamese cat meowing'
          }
        ]
      }
    ]
  },
  {
    username: 'grace_whiskers',
    email: 'grace@test.com',
    firstName: 'Grace',
    cats: [
      {
        name: 'Coco',
        breed: 'Persian',
        age: '3 years',
        sex: 'Female',
        personality: 'Regal and sophisticated, expects royal treatment',
        favourite_person: 'Grace',
        favourite_treat: 'Gourmet pâté',
        favourite_toy: 'Silk ribbon',
        favourite_word: 'Princess',
        play_time_preference: 'Evening',
        photos: [
          {
            caption: 'Princess Coco demands her daily brushing session 👑✨',
            searchTerm: 'persian cat grooming'
          }
        ]
      }
    ]
  },
  {
    username: 'ava_purr',
    email: 'ava@test.com',
    firstName: 'Ava',
    cats: [
      {
        name: 'Ginger',
        breed: 'Maine Coon',
        age: '5 years',
        sex: 'Male',
        personality: 'Gentle giant with a big heart and bigger appetite',
        favourite_person: 'Ava',
        favourite_treat: 'Salmon jerky',
        favourite_toy: 'Giant feather',
        favourite_word: 'Food',
        play_time_preference: 'All day',
        photos: [
          {
            caption: 'Ginger\'s reaction when I open literally ANY bag in the kitchen 🍽️😻',
            searchTerm: 'maine coon cat big'
          }
        ]
      }
    ]
  },
  {
    username: 'chloe_cats',
    email: 'chloe@test.com',
    firstName: 'Chloe',
    cats: [
      {
        name: 'Patches',
        breed: 'Calico',
        age: '2 years',
        sex: 'Female',
        personality: 'Sassy and independent, rules the house with an iron paw',
        favourite_person: 'Chloe',
        favourite_treat: 'Catnip',
        favourite_toy: 'Cardboard box',
        favourite_word: 'Mine',
        play_time_preference: 'When she feels like it',
        photos: [
          {
            caption: 'Patches claiming her new cardboard kingdom 📦👑 #BoxLife',
            searchTerm: 'calico cat in box'
          }
        ]
      }
    ]
  },
  {
    username: 'maya_meows',
    email: 'maya@test.com',
    firstName: 'Maya',
    cats: [
      {
        name: 'Snowball',
        breed: 'White Persian',
        age: '1 year',
        sex: 'Female',
        personality: 'Pure and innocent, loves to play with anything that moves',
        favourite_person: 'Maya',
        favourite_treat: 'Milk treats',
        favourite_toy: 'Pom pom balls',
        favourite_word: 'Play',
        play_time_preference: 'Morning',
        photos: [
          {
            caption: 'Snowball discovered the joy of toilet paper... RIP my bathroom 🧻😅',
            searchTerm: 'white persian kitten playing'
          }
        ]
      }
    ]
  },
  {
    username: 'ruby_furbaby',
    email: 'ruby@test.com',
    firstName: 'Ruby',
    cats: [
      {
        name: 'Tiger',
        breed: 'Bengal',
        age: '2 years',
        sex: 'Male',
        personality: 'Wild at heart, loves to climb and explore high places',
        favourite_person: 'Ruby',
        favourite_treat: 'Raw chicken',
        favourite_toy: 'Climbing tree',
        favourite_word: 'Adventure',
        play_time_preference: 'Dawn',
        photos: [
          {
            caption: 'Tiger living his best life on top of the fridge again 🐅⬆️',
            searchTerm: 'bengal cat climbing'
          }
        ]
      }
    ]
  },
  {
    username: 'sophia_kitties',
    email: 'sophia@test.com',
    firstName: 'Sophia',
    cats: [
      {
        name: 'Daisy',
        breed: 'Scottish Fold',
        age: '3 years',
        sex: 'Female',
        personality: 'Sweet and gentle, loves to sit like a human',
        favourite_person: 'Sophia',
        favourite_treat: 'Yogurt drops',
        favourite_toy: 'Soft blanket',
        favourite_word: 'Gentle',
        play_time_preference: 'Quiet time',
        photos: [
          {
            caption: 'Daisy sitting like a proper lady at the dinner table 🍽️😂',
            searchTerm: 'scottish fold cat sitting'
          }
        ]
      }
    ]
  },
  {
    username: 'hannah_paws',
    email: 'hannah@test.com',
    firstName: 'Hannah',
    cats: [
      {
        name: 'Oreo',
        breed: 'Tuxedo Cat',
        age: '4 years',
        sex: 'Male',
        personality: 'Formal and dignified, always dressed for success',
        favourite_person: 'Hannah',
        favourite_treat: 'Cheese',
        favourite_toy: 'Bow tie',
        favourite_word: 'Handsome',
        play_time_preference: 'Business hours',
        photos: [
          {
            caption: 'Oreo ready for his job interview at the tuna factory 👔💼',
            searchTerm: 'tuxedo cat formal'
          }
        ]
      }
    ]
  },
  {
    username: 'olivia_catmom',
    email: 'olivia@test.com',
    firstName: 'Olivia',
    cats: [
      {
        name: 'Pumpkin',
        breed: 'Orange Tabby',
        age: '1 year',
        sex: 'Female',
        personality: 'Energetic kitten who thinks everything is a toy',
        favourite_person: 'Olivia',
        favourite_treat: 'Pumpkin treats',
        favourite_toy: 'Everything',
        favourite_word: 'Play',
        play_time_preference: '24/7',
        photos: [
          {
            caption: 'Pumpkin found my yarn stash... send help 🧶😱',
            searchTerm: 'orange kitten playing yarn'
          }
        ]
      }
    ]
  },
  {
    username: 'natalie_fluff',
    email: 'natalie@test.com',
    firstName: 'Natalie',
    cats: [
      {
        name: 'Smokey',
        breed: 'Russian Blue',
        age: '5 years',
        sex: 'Male',
        personality: 'Calm and observant, the wise old soul of the house',
        favourite_person: 'Natalie',
        favourite_treat: 'Salmon',
        favourite_toy: 'Window perch',
        favourite_word: 'Peace',
        play_time_preference: 'Sunset',
        photos: [
          {
            caption: 'Smokey contemplating life and the meaning of treats 🤔💭',
            searchTerm: 'russian blue cat window'
          }
        ]
      }
    ]
  },
  {
    username: 'jessica_purrs',
    email: 'jessica@test.com',
    firstName: 'Jessica',
    cats: [
      {
        name: 'Muffin',
        breed: 'Munchkin',
        age: '2 years',
        sex: 'Female',
        personality: 'Small but mighty, proves size doesn\'t matter',
        favourite_person: 'Jessica',
        favourite_treat: 'Mini treats',
        favourite_toy: 'Small ball',
        favourite_word: 'Tiny',
        play_time_preference: 'Short bursts',
        photos: [
          {
            caption: 'Muffin proving that good things come in small packages 🧁💕',
            searchTerm: 'munchkin cat small'
          }
        ]
      }
    ]
  },
  {
    username: 'amanda_whiskers',
    email: 'amanda@test.com',
    firstName: 'Amanda',
    cats: [
      {
        name: 'Duchess',
        breed: 'Turkish Angora',
        age: '3 years',
        sex: 'Female',
        personality: 'Elegant and graceful, moves like she\'s dancing',
        favourite_person: 'Amanda',
        favourite_treat: 'Caviar treats',
        favourite_toy: 'Silk scarf',
        favourite_word: 'Elegant',
        play_time_preference: 'Graceful moments',
        photos: [
          {
            caption: 'Duchess practicing her runway walk for Paris Fashion Week 💃✨',
            searchTerm: 'turkish angora cat elegant'
          }
        ]
      }
    ]
  },
  {
    username: 'rachel_kitty',
    email: 'rachel@test.com',
    firstName: 'Rachel',
    cats: [
      {
        name: 'Biscuit',
        breed: 'British Longhair',
        age: '4 years',
        sex: 'Male',
        personality: 'Laid-back and chill, the ultimate couch potato',
        favourite_person: 'Rachel',
        favourite_treat: 'Biscuits',
        favourite_toy: 'Couch cushion',
        favourite_word: 'Relax',
        play_time_preference: 'Never',
        photos: [
          {
            caption: 'Biscuit mastering the art of doing absolutely nothing 😴🛋️',
            searchTerm: 'british longhair cat lazy'
          }
        ]
      }
    ]
  },
  {
    username: 'kelly_feline',
    email: 'kelly@test.com',
    firstName: 'Kelly',
    cats: [
      {
        name: 'Sparkle',
        breed: 'Abyssinian',
        age: '2 years',
        sex: 'Female',
        personality: 'Athletic and agile, loves to show off her acrobatic skills',
        favourite_person: 'Kelly',
        favourite_treat: 'Energy treats',
        favourite_toy: 'Agility course',
        favourite_word: 'Jump',
        play_time_preference: 'High energy',
        photos: [
          {
            caption: 'Sparkle attempting her triple backflip dismount 🤸‍♀️⭐',
            searchTerm: 'abyssinian cat jumping'
          }
        ]
      }
    ]
  },
  {
    username: 'lauren_meow',
    email: 'lauren@test.com',
    firstName: 'Lauren',
    cats: [
      {
        name: 'Cookie',
        breed: 'Exotic Shorthair',
        age: '3 years',
        sex: 'Female',
        personality: 'Sweet and gentle, loves to be pampered',
        favourite_person: 'Lauren',
        favourite_treat: 'Cookie treats',
        favourite_toy: 'Soft brush',
        favourite_word: 'Sweet',
        play_time_preference: 'Gentle play',
        photos: [
          {
            caption: 'Cookie\'s spa day face mask is working wonders! 🥒✨',
            searchTerm: 'exotic shorthair cat cute'
          }
        ]
      }
    ]
  },
  {
    username: 'stephanie_paws',
    email: 'stephanie@test.com',
    firstName: 'Stephanie',
    cats: [
      {
        name: 'Ziggy',
        breed: 'Devon Rex',
        age: '1 year',
        sex: 'Male',
        personality: 'Quirky and unique, marches to the beat of his own drum',
        favourite_person: 'Stephanie',
        favourite_treat: 'Weird treats',
        favourite_toy: 'Unusual objects',
        favourite_word: 'Different',
        play_time_preference: 'Unpredictable',
        photos: [
          {
            caption: 'Ziggy being his wonderfully weird self as usual 🤪💫',
            searchTerm: 'devon rex cat quirky'
          }
        ]
      }
    ]
  }
]

// Function to download image from Pexels
async function downloadImage(searchTerm, filename) {
  try {
    // Using Pexels API for high-quality cat photos
    const pexelsApiKey = 'YOUR_PEXELS_API_KEY' // You'll need to get this from pexels.com
    
    // For now, we'll use direct URLs to known good cat photos from Pexels
    const catPhotoUrls = [
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
      'https://images.pexels.com/photos/2361952/pexels-photo-2361952.jpeg?auto=compress&cs=tinysrgb&w=800'
    ]
    
    // Get a random photo URL
    const randomIndex = Math.floor(Math.random() * catPhotoUrls.length)
    const imageUrl = catPhotoUrls[randomIndex]
    
    console.log(`Downloading image for ${filename}...`)
    
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`)
    }
    
    const buffer = await response.buffer()
    
    // Create temp directory if it doesn't exist
    const tempDir = path.join(__dirname, 'temp_images')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    
    const filePath = path.join(tempDir, filename)
    fs.writeFileSync(filePath, buffer)
    
    console.log(`Downloaded: ${filename}`)
    return filePath
  } catch (error) {
    console.error(`Error downloading image for ${filename}:`, error)
    return null
  }
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
    
    console.log(`Uploaded to Supabase: ${uniqueFileName}`)
    return publicUrl
  } catch (error) {
    console.error(`Error uploading ${fileName} to Supabase:`, error)
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
        is_demo_account: true // Tag for easy removal later
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
    
    console.log(`Created user: ${userData.username} (${userId})`)
    return userId
  } catch (error) {
    console.error(`Error creating user ${userData.username}:`, error)
    return null
  }
}

// Function to create cat profile
async function createCatProfile(userId, catData) {
  try {
    console.log(`Creating cat profile for ${catData.name}...`)
    
    const { data, error } = await supabase
      .from('cat_profiles')
      .insert([{
        user_id: userId,
        name: catData.name,
        breed: catData.breed,
        age: catData.age,
        sex: catData.sex,
        personality: catData.personality,
        favourite_person: catData.favourite_person,
        favourite_treat: catData.favourite_treat,
        favourite_toy: catData.favourite_toy,
        favourite_word: catData.favourite_word,
        play_time_preference: catData.play_time_preference
      }])
      .select()
      .single()
    
    if (error) {
      throw error
    }
    
    console.log(`Created cat profile: ${catData.name} (${data.id})`)
    return data.id
  } catch (error) {
    console.error(`Error creating cat profile for ${catData.name}:`, error)
    return null
  }
}

// Function to create cat photo
async function createCatPhoto(userId, catProfileId, photoData, catName) {
  try {
    console.log(`Creating photo for ${catName}...`)
    
    // Download image
    const filename = `${catName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.jpg`
    const imagePath = await downloadImage(photoData.searchTerm, filename)
    
    if (!imagePath) {
      console.error(`Failed to download image for ${catName}`)
      return null
    }
    
    // Upload to Supabase
    const imageUrl = await uploadImageToSupabase(imagePath, filename, userId)
    
    if (!imageUrl) {
      console.error(`Failed to upload image for ${catName}`)
      return null
    }
    
    // Create cat photo record
    const { data, error } = await supabase
      .from('cats')
      .insert([{
        user_id: userId,
        name: catName,
        caption: photoData.caption,
        image_url: imageUrl,
        cat_profile_id: catProfileId
      }])
      .select()
      .single()
    
    if (error) {
      throw error
    }
    
    // Clean up temp file
    fs.unlinkSync(imagePath)
    
    console.log(`Created photo for ${catName}: ${photoData.caption}`)
    return data.id
  } catch (error) {
    console.error(`Error creating photo for ${catName}:`, error)
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
          created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() // Random time in last week
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
    
    console.log(`Created ${reactions.length} reactions`)
  } catch (error) {
    console.error('Error creating reactions:', error)
  }
}

// Main seeding function
async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...')
    
    const userIds = []
    const catIds = []
    
    // Create users and their cats
    for (const userData of demoUsers) {
      const userId = await createUserAccount(userData)
      if (!userId) continue
      
      userIds.push(userId)
      
      // Create cat profiles and photos for this user
      for (const catData of userData.cats) {
        const catProfileId = await createCatProfile(userId, catData)
        if (!catProfileId) continue
        
        // Create photos for this cat
        for (const photoData of catData.photos) {
          const catId = await createCatPhoto(userId, catProfileId, photoData, catData.name)
          if (catId) {
            catIds.push(catId)
          }
        }
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    // Create reactions between users
    if (catIds.length > 0 && userIds.length > 0) {
      await createReactions(catIds, userIds)
    }
    
    console.log('✅ Database seeding completed!')
    console.log(`Created ${userIds.length} users with ${catIds.length} cat photos`)
    console.log('All demo accounts use password: Testing01!')
    console.log('Demo accounts are tagged with is_demo_account: true for easy removal')
    
  } catch (error) {
    console.error('❌ Error during database seeding:', error)
  }
}

// Run the seeding
seedDatabase()