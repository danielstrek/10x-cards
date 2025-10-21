-- Migration: Completely disable RLS on all tables
-- Purpose: Since we're doing authorization at the application level,
--          we don't need Supabase RLS enabled.
-- Affected tables: flashcards, generations, generation_error_logs
-- Special considerations:
--   - This fully disables RLS, allowing anon key to access data
--   - Authorization must be handled in application code
--   - Make sure your API endpoints verify user ownership

-- Disable RLS on generations table
ALTER TABLE generations DISABLE ROW LEVEL SECURITY;

-- Disable RLS on flashcards table
ALTER TABLE flashcards DISABLE ROW LEVEL SECURITY;

-- Disable RLS on generation_error_logs table
ALTER TABLE generation_error_logs DISABLE ROW LEVEL SECURITY;

