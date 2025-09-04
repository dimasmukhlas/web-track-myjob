-- Migration to support Firebase Auth UIDs
-- This migration temporarily disables RLS to allow Firebase Auth integration

-- Update the user_id column to be more flexible for Firebase UIDs
ALTER TABLE public.job_applications 
ALTER COLUMN user_id TYPE TEXT;

-- Temporarily disable RLS to allow Firebase Auth integration
-- This is a temporary solution for testing
ALTER TABLE public.job_applications DISABLE ROW LEVEL SECURITY;

-- Note: In production, you should implement proper RLS policies for Firebase Auth
-- or use a service role key for database operations
