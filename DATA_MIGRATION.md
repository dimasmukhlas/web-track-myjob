# Data Migration Guide

## Overview
This guide helps you migrate existing job application data to be owned by your Firebase Auth user (dimasmukhlas@gmail.com).

## Step 1: Find Your Firebase UID

First, we need to find your Firebase UID. You can do this by:

1. **Open your app** in the browser
2. **Sign in** with dimasmukhlas@gmail.com
3. **Open browser developer tools** (F12)
4. **Go to Console tab**
5. **Run this command**:
   ```javascript
   // Get current user info
   import { getAuth } from 'firebase/auth';
   const auth = getAuth();
   console.log('Current user:', auth.currentUser);
   console.log('User UID:', auth.currentUser?.uid);
   ```

Or alternatively, you can check the Network tab in developer tools when the app loads - look for any requests to Supabase and check the `user_id` parameter.

## Step 2: SQL Migration

Once you have your Firebase UID, run this SQL in your Supabase Dashboard → SQL Editor:

```sql
-- Replace 'YOUR_FIREBASE_UID_HERE' with your actual Firebase UID
-- Example: 'jcBkohDqghUvfyMk02xW9SdLfGO2'

-- Update all existing job applications to be owned by your Firebase user
UPDATE public.job_applications 
SET user_id = 'YOUR_FIREBASE_UID_HERE'
WHERE user_id IS NOT NULL;

-- Verify the update
SELECT id, company_name, position_title, user_id, created_at 
FROM public.job_applications 
ORDER BY created_at DESC;
```

## Step 3: Alternative - Get UID from App

If you can't find your UID easily, you can also:

1. **Add a temporary debug component** to display your UID
2. **Or check the browser's Application/Storage tab** for Firebase Auth data

## Step 4: Verify Migration

After running the SQL:

1. **Refresh your app**
2. **Check that all your job applications are visible**
3. **Verify you can edit/delete them**
4. **Test creating a new application**

## Important Notes

- **Backup First**: Consider backing up your data before migration
- **Test Thoroughly**: Verify all functionality works after migration
- **One-Time Operation**: This migration only needs to be done once

## Troubleshooting

If you have issues:
1. Check that the Firebase UID is correct
2. Verify the SQL ran successfully
3. Check browser console for any errors
4. Ensure you're signed in with the correct account

