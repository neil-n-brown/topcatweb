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

**CRITICAL: Directory Navigation**

The most common error is running commands from the wrong directory. Follow these steps carefully:

```bash
# For seeding (run from scripts directory)
cd /home/project/scripts
npm run seed

# For starting the dev server (run from project root)
cd /home/project
npm run dev

# For cleaning demo data (run from scripts directory)
cd /home/project/scripts
npm run clean-demo

cd scripts
node seed-database.js    # Seed demo data
node fixed-clean-demo.js # Clean up when needed
```

## Common Issues

### "Missing script: dev" Error
This error occurs when you try to run `npm run dev` from the wrong directory. The `dev` script is only available in the main project's `package.json`, not in the scripts folder.

**Solution:**
- **To run the development server:** Navigate to the project root (`cd /home/project`) and run `npm run dev`
- **To run seeding scripts:** Navigate to scripts directory (`cd /home/project/scripts`) and run `npm run seed`
- **To clean demo data:** Navigate to scripts directory (`cd /home/project/scripts`) and run `npm run clean-demo`

**Quick Directory Check:**
```bash
# Check current directory
pwd

# If you see /home/project/scripts, you can run seeding commands
# If you see /home/project, you can run the dev server
```

### Network/Fetch Failed Errors
If you encounter "TypeError: fetch failed" or similar network errors:

1. **Check Internet Connection:** Ensure stable internet connectivity
2. **Verify Supabase URL:** Confirm `VITE_SUPABASE_URL` starts with `https://`
3. **Check Project Status:** Ensure your Supabase project is active (not paused)
4. **Firewall/Proxy:** Check if connections to Supabase are being blocked
5. **Service Role Key:** Verify you're using the SERVICE ROLE KEY, not the anon key
6. **DNS Issues:** Try using different DNS servers (8.8.8.8, 1.1.1.1)
7. **Corporate Network:** If on corporate network, try using a VPN
8. **System Time:** Ensure system clock is accurate (affects SSL certificates)
9. **Retry:** Network issues are often temporary - try running the script again

**Enhanced Network Troubleshooting:**
- The scripts now include automatic retry logic with exponential backoff
- Circuit breaker pattern prevents overwhelming failed connections
- Smaller batch sizes reduce network load
- Extended timeouts accommodate slower connections
- Detailed error reporting helps diagnose specific issues

**If problems persist:**
- Try running during off-peak hours for better connectivity
- Use a mobile hotspot to test if it's a network-specific issue
- Check Supabase status page for service outages
- Contact your network administrator if behind corporate firewall

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
# IMPORTANT: Make sure you're in the scripts directory
cd /home/project/scripts
npm run clean-demo
```

This will:
- Delete all demo user accounts
- Remove all associated cat profiles and photos
- Clean up storage files
- Cascade delete all related reactions and data

**Enhanced Cleanup Features:**
- **Robust Network Handling:** Automatic retries with exponential backoff
- **Circuit Breaker:** Prevents overwhelming failed connections
- **Smaller Batches:** Reduces network load and improves reliability
- **Progress Tracking:** Detailed progress reporting for long operations
- **Graceful Degradation:** Continues cleanup even if some operations fail
- **Enhanced Error Reporting:** Better diagnostics for troubleshooting

**Note:** The cleanup script now includes significantly enhanced network error handling and will automatically retry failed operations with intelligent backoff strategies.

## Directory Structure

```
project-root/                    ← /home/project
├── package.json                 # Main project dependencies (contains "dev" script)
├── src/                         # Application source code
├── public/                      # Static assets including cat photos
│   ├── cute_cat_01.jpg         # Local cat photos used by seeder
│   ├── cute_cat_02.jpg
│   └── ...
└── scripts/                     ← /home/project/scripts
    ├── package.json             # Seeding script dependencies
    ├── seed-database.js         # Main seeding script
    ├── clean-demo-data.js       # Cleanup script
    └── .env                     # Environment variables for scripts
```

## Command Reference

| Command | Directory | Purpose | Full Path |
|---------|-----------|---------|-----------|
| `npm run dev` | Project root | Start development server | `cd /home/project && npm run dev` |
| `npm run seed` | scripts/ | Populate database with demo data | `cd /home/project/scripts && npm run seed` |
| `npm run clean-demo` | scripts/ | Remove all demo data | `cd /home/project/scripts && npm run clean-demo` |
| `npm install` | Project root | Install main project dependencies | `cd /home/project && npm install` |
| `npm install` | scripts/ | Install seeding script dependencies | `cd /home/project/scripts && npm install` |

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
1. **"Missing script" errors:** 
   - Check you're in the correct directory with `pwd`
   - Use full paths: `cd /home/project` for dev server, `cd /home/project/scripts` for seeding
2. **Network/fetch errors:** 
   - Check internet connection stability
   - Verify Supabase configuration
   - Try running during off-peak hours
   - Use VPN if behind corporate firewall
3. **Missing Service Role Key:** 
   - Ensure you have the SERVICE ROLE KEY, not the anon key
   - Check .env file exists in correct location
4. **Storage Errors:** 
   - Ensure the cat-photos bucket exists and has proper policies
   - Check storage quotas and permissions
5. **Missing Images:** 
   - Verify cute_cat_01.jpg through cute_cat_20.jpg exist in public/

### Enhanced Network Error Handling

The scripts now include comprehensive network error handling:

**Automatic Retries:**
- Exponential backoff with jitter to prevent thundering herd
- Circuit breaker pattern to prevent overwhelming failed connections
- Progressive delays that increase with consecutive failures
- Maximum retry limits to prevent infinite loops

**Network Resilience:**
- Extended timeouts for slower connections
- Smaller batch sizes to reduce network load
- Connection testing before major operations
- Graceful degradation when some operations fail

**Error Classification:**
- Distinguishes between retryable network errors and permanent failures
- Provides specific guidance based on error type
- Enhanced logging for better troubleshooting

**If you continue to experience network issues:**
- **Different Network:** Try running from a different network connection
- **VPN:** Use a VPN if corporate firewall is blocking Supabase
- **DNS:** Try different DNS servers (8.8.8.8, 1.1.1.1)
- **Time:** Ensure system clock is accurate (affects SSL certificates)
- **Status:** Check Supabase status page for service outages
- **Peak Hours:** Run during off-peak hours for better connectivity
- **Mobile Hotspot:** Test with mobile data to isolate network issues

## Marketing Use

This seeded data is perfect for:
- **Social media screenshots** showing active community
- **Demo videos** with realistic user interactions
- **Feature showcases** demonstrating all app capabilities
- **User testing** with pre-populated content
- **Investor presentations** showing app potential

## Performance Optimization

The scripts are optimized for reliability over speed:
- **Small Batches:** Reduces memory usage and network load
- **Progressive Delays:** Prevents overwhelming the database
- **Circuit Breakers:** Automatically backs off when errors occur
- **Timeout Protection:** Prevents hanging operations
- **Resource Cleanup:** Properly closes connections and clears timeouts

This approach ensures the scripts work reliably even on slower or unstable network connections.