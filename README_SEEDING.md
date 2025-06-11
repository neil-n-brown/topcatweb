# Top Cat Database Seeding

This directory contains scripts to populate the Top Cat app with realistic demo data for marketing and demonstration purposes.

## Setup

1. **Install dependencies:**
   ```bash
   cd scripts
   npm install
   ```

2. **Set environment variables:**
   Create a `.env` file in the scripts directory with:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

   **Important:** You need the SERVICE ROLE KEY (not the anon key) to create user accounts.

3. **Run the migration:**
   ```bash
   # From the project root
   supabase db push
   ```

## Running the Seeder

```bash
cd scripts
npm run seed
```

## What Gets Created

### 20 Demo Users
- **Usernames:** Female cat lover names (sarah_catlover, emma_kitty, etc.)
- **Emails:** [username]@test.com format
- **Password:** All accounts use "Testing01!"
- **Tagged:** All demo accounts have `is_demo_account: true` metadata

### 20+ Cat Profiles
- **Names:** Popular cat names (Luna, Whiskers, Shadow, etc.)
- **Details:** Complete profiles with breed, age, personality, preferences
- **Variety:** Different breeds, ages, and personalities

### 20+ Cat Photos
- **Source:** High-quality photos from Pexels
- **Captions:** Funny, cute, cat-loving captions
- **Storage:** Properly uploaded to Supabase storage
- **Linked:** Connected to cat profiles and users

### Realistic Engagement
- **Reactions:** 5-25 reactions per photo with various emojis
- **Timing:** Reactions spread over the past week
- **Variety:** Different engagement levels to create realistic rankings

## Demo Account Details

All demo accounts can be logged into with:
- **Password:** `Testing01!`
- **Emails:** Available in the console output after seeding

Example accounts:
- sarah@test.com
- emma@test.com
- mia@test.com
- lily@test.com
- etc.

## Cleaning Up Demo Data

To remove all demo data:

```bash
cd scripts
npm run clean-demo
```

This will:
- Delete all demo user accounts
- Remove all associated cat profiles and photos
- Clean up storage files
- Cascade delete all related reactions and data

## Features Demonstrated

The seeded data showcases:
- **User profiles** with realistic information
- **Cat profiles** with detailed characteristics
- **Photo uploads** with engaging captions
- **Reaction system** with varied engagement
- **Leaderboard rankings** with realistic competition
- **Social features** with user interactions

## File Structure

```
scripts/
├── package.json          # Dependencies for seeding scripts
├── seed-database.js      # Main seeding script
├── clean-demo-data.js    # Cleanup script
└── temp_images/          # Temporary folder for downloaded images (auto-created)
```

## Notes

- **Performance:** The script includes delays to avoid rate limiting
- **Images:** Downloads real cat photos from Pexels (requires internet)
- **Storage:** Images are properly uploaded to Supabase storage
- **Cleanup:** Temp image files are automatically removed after upload
- **Tagging:** All demo data is tagged for easy identification and removal
- **Realistic:** Data is designed to showcase the app's full potential

## Troubleshooting

1. **Missing Service Role Key:** Make sure you have the SERVICE ROLE KEY, not the anon key
2. **Storage Errors:** Ensure the cat-photos bucket exists and has proper policies
3. **Rate Limiting:** The script includes delays, but you may need to increase them
4. **Image Downloads:** Requires internet connection to download from Pexels
5. **Permissions:** Ensure your Supabase project has proper RLS policies enabled

## Marketing Use

This seeded data is perfect for:
- **Social media screenshots** showing active community
- **Demo videos** with realistic user interactions
- **Feature showcases** demonstrating all app capabilities
- **User testing** with pre-populated content
- **Investor presentations** showing app potential