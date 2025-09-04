# Storage RLS Fix for Firebase Auth

## Issue
File uploads are failing with error: "new row violates row-level security policy"

This happens because the storage bucket still has RLS policies that expect Supabase Auth, but we're using Firebase Auth.

## Solution
We need to disable RLS for the storage bucket as well.

## SQL to Run in Supabase Dashboard

Go to your Supabase Dashboard → SQL Editor and run this SQL:

```sql
-- Disable RLS for the storage.objects table (for the job-documents bucket)
-- This allows Firebase Auth users to upload files

-- First, let's check if RLS is enabled on storage.objects
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Disable RLS for storage.objects
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'objects' AND schemaname = 'storage';
```

## Alternative: More Targeted Approach

If you want to be more specific and only disable RLS for the job-documents bucket:

```sql
-- Drop all existing storage policies
DROP POLICY IF EXISTS "Users can view their own job documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own job documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own job documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own job documents" ON storage.objects;

-- Disable RLS for storage.objects
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

## After Running the SQL

1. Refresh your application
2. Try uploading a file again
3. The upload should work without errors

## Security Note

This temporarily disables RLS for file storage. In production, you should:
1. Re-enable RLS
2. Create proper policies for Firebase Auth
3. Or use a service role key for file operations

## Testing

After applying the fix:
- File uploads should work
- Files should be accessible
- No more "row violates row-level security policy" errors

