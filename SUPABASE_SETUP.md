# Supabase Integration

This app now integrates with Supabase to track game statistics and user progress.

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned

### 2. Run the Database Schema

1. Navigate to the SQL Editor in your Supabase dashboard
2. Copy and paste the SQL schema provided in your database setup
3. Run the SQL to create all tables, indexes, and policies

### 3. Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Get your Supabase credentials:
   - Go to Project Settings > API
   - Copy the Project URL
   - Copy the anon/public key

3. Update `.env.local` with your credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 4. Enable Google Authentication

To track user-specific data, you need to enable Google OAuth:

1. Go to Authentication > Providers in Supabase dashboard
2. Enable the Google provider
3. Add your OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API
   - Go to Credentials > Create Credentials > OAuth 2.0 Client ID
   - Add authorized redirect URIs:
     - `https://your-project-ref.supabase.co/auth/v1/callback`
     - For local testing: `http://localhost:3000/?redirected=true`
   - Copy the Client ID and Client Secret
4. Paste the credentials in Supabase Google provider settings
5. Save the configuration

The app will now show a "Sign In" button in the top right corner.

## What Gets Tracked

The app tracks the following data:

- **Game Rounds**: Each complete game (10 questions)
  - Genre/chart type played
  - Chart year and week
  - Start and end times
  - Total points and correct answers
  - Win/loss result

- **Guesses**: Each individual question answer
  - The correct track
  - All options shown
  - User's chosen answer
  - Time taken to answer
  - Points awarded

- **User Stats**: Rollup statistics per user
  - Total games played
  - Wins and losses
  - Total points earned
  - Last played date

## Anonymous Usage

The app works in anonymous mode by default. Data is tracked locally in the session but won't be persisted to Supabase unless a user signs in.

To enable user authentication, you'll need to add authentication UI components (not included in this setup).

## Database Schema

The schema includes:

- `profiles`: User profile information
- `game_rounds`: Individual game sessions
- `guesses`: Each question/answer
- `user_stats`: Aggregated user statistics
- `leaderboard`: Public view of top scores

All tables use Row Level Security (RLS) to ensure users can only access their own data.

## Development

For local development without Supabase:
- The app will work normally but data won't be persisted
- Console warnings about missing Supabase credentials can be ignored
- Game tracking functions will fail silently

## Production Deployment

When deploying to production:
1. Add environment variables to your hosting platform
2. Ensure the Supabase URL and keys are set correctly
3. Test authentication and data persistence

## Leaderboard

A public leaderboard view is available showing top 100 scores. You can query it with:

```typescript
const { data } = await supabase
  .from('leaderboard')
  .select('*')
  .limit(10);
```
