# Firebase Authentication Migration

This document describes the migration from Supabase Authentication to Firebase Authentication while keeping Supabase for database operations.

## Migration Overview

- **Authentication**: Migrated from Supabase Auth to Firebase Auth
- **Database**: Kept Supabase for data storage and operations
- **File Storage**: Kept Supabase Storage for file uploads
- **Architecture**: Hybrid approach using Firebase Auth + Supabase Database

## Changes Made

### 1. Firebase Configuration
- Added Firebase configuration in `src/integrations/firebase/config.ts`
- Used existing Firebase project configuration from `main.js`

### 2. Authentication Service
- Created new Firebase authentication hook: `src/hooks/useFirebaseAuth.tsx`
- Replaced Supabase auth with Firebase auth in all components
- Updated App.tsx to use Firebase AuthProvider

### 3. Database Integration
- Created database service: `src/integrations/firebase/database.ts`
- Created user mapping service: `src/integrations/firebase/userMapping.ts`
- Updated all components to use the new database service

### 4. Updated Components
- `JobApplicationsList.tsx` - Uses new database service
- `JobApplicationForm.tsx` - Uses new database service
- `ApplicationAnalyticsChart.tsx` - Uses new database service
- `ApplicationCalendar.tsx` - Uses new database service
- `FileUpload.tsx` - Uses new database service
- `useAutocompleteData.ts` - Uses new database service

## Firebase Project Configuration

The Firebase project is configured with:
- **Project ID**: `jobtracking-94a69`
- **Auth Domain**: `jobtracking-94a69.firebaseapp.com`
- **Storage Bucket**: `jobtracking-94a69.firebasestorage.app`

## Database Schema Considerations

The existing Supabase database schema uses `user_id` as UUID references to `auth.users(id)`. Since Firebase Auth uses different UID formats, the database service maps Firebase UIDs to work with the existing schema.

## Authentication Flow

1. User signs in/up with Firebase Auth
2. Firebase Auth provides a UID
3. Database service uses this UID for Supabase operations
4. All data operations go through the database service which handles user authentication

## Benefits

- **Firebase Auth**: Better authentication features, Google integration, etc.
- **Supabase Database**: Keep existing data and schema
- **Hybrid Approach**: Best of both worlds
- **Minimal Disruption**: Existing data remains intact

## Testing

To test the migration:
1. Run `npm run dev`
2. Navigate to the application
3. Try signing up with a new account
4. Try signing in with existing credentials
5. Test job application CRUD operations
6. Test file uploads

## Notes

- Firebase UIDs are used directly as user identifiers in Supabase
- The existing Supabase RLS policies may need adjustment for Firebase UIDs
- File storage still uses Supabase Storage with Firebase Auth for user identification


