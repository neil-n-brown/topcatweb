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
   # From the project root (not the scripts directory)
   supabase db push
   ```

## Running the Seeder

**Important:** Make sure you're in the correct directory:

```bash
# For seeding (run from scripts directory)
cd scripts
npm run seed

# For starting the dev server (run from project root)
cd ..  # or cd /home/project
npm run dev
```

## Common Issues

### "Missing script: dev" Error
This error occurs when you try to run `npm run dev` from the wrong directory. The `dev` script is only available in the main project's `package.json`, not in the scripts folder.

**Solution:**
- To run the development server: `cd` to the project root and run `npm run dev`
- To run seeding scripts: `cd scripts` and run `npm run seed`

### Network/Fetch Failed Errors
If you encounter "TypeError: fetch failed" or similar network errors:

1. **Check Internet Connection:** Ensure stable internet connectivity
2. **Verify Supabase URL:** Confirm `VITE_SUPABASE_URL` starts with `https://`
3. **Check Project Status:** Ensure your Supabase project is active (not paused)
4. **Firewall/Proxy:** Check if connections to Supabase are being blocked
5. **Service Role Key:** Verify you're using the SERVICE ROLE KEY, not the anon key
6. **Retry:** Network issues are often temporary - try running the script again

The scripts include automatic retry logic with progressive backoff to handle temporary network issues.

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
- **Source:** High-quality photos from local files (cute_cat_01.jpg to cute_cat_20.jpg)
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

**Note:** The cleanup script includes enhanced network error handling and will retry failed operations automatically.

## Directory Structure

```
project-root/
├── package.json          # Main project dependencies (contains "dev" script)
├── src/                  # Application source code
├── public/               # Static assets including cat photos
│   ├── cute_cat_01.jpg   # Local cat photos used by seeder
│   ├── cute_cat_02.jpg
│   └── ...
└── scripts/
    ├── package.json      # Seeding script dependencies
    ├── seed-database.js  # Main seeding script
    ├── clean-demo-data.js # Cleanup script
    └── .env              # Environment variables for scripts
```

## Command Reference

| Command | Directory | Purpose |
|---------|-----------|---------|
| `npm run dev` | Project root | Start development server |
| `npm run seed` | scripts/ | Populate database with demo data |
| `npm run clean-demo` | scripts/ | Remove all demo data |
| `npm install` | Project root | Install main project dependencies |
| `npm install` | scripts/ | Install seeding script dependencies |

## Features Demonstrated

The seeded data showcases:
- **User profiles** with realistic information
- **Cat profiles** with detailed characteristics
- **Photo uploads** with engaging captions
- **Reaction system** with varied engagement
- **Leaderboard rankings** with realistic competition
- **Social features** with user interactions

## Troubleshooting

### Script Errors
1. **"Missing script" errors:** Check you're in the correct directory
2. **Network/fetch errors:** Check internet connection and Supabase configuration
3. **Missing Service Role Key:** Ensure you have the SERVICE ROLE KEY, not the anon key
4. **Storage Errors:** Ensure the cat-photos bucket exists and has proper policies
5. **Missing Images:** Verify cute_cat_01.jpg through cute_cat_20.jpg exist in public/

### Network Issues
The scripts include enhanced error handling for network issues:
- **Automatic retries** with progressive backoff
- **Timeout protection** to prevent hanging operations
- **Smaller batch sizes** to reduce network load
- **Detailed error reporting** to help diagnose issues

If you continue to experience network issues:
- Try running from a different network connection
- Check if your firewall is blocking Supabase connections
- Ensure your Supabase project is accessible and active
- Consider running during off-peak hours for better connectivity

## Marketing Use

This seeded data is perfect for:
- **Social media screenshots** showing active community
- **Demo videos** with realistic user interactions
- **Feature showcases** demonstrating all app capabilities
- **User testing** with pre-populated content
- **Investor presentations** showing app potential