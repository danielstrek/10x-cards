-- Migration: Disable all RLS policies
-- Purpose: Remove all RLS policies from flashcards, generations, and generation_error_logs tables
-- Affected tables: flashcards, generations, generation_error_logs
-- Special considerations:
--   - This is a destructive operation that removes access control policies
--   - RLS will still be enabled on tables, but no policies will restrict access
--   - Without policies, users will have no access to data (default deny)

-- drop all rls policies from flashcards table
-- warning: this removes all access control policies for flashcards
drop policy if exists "flashcards_select_authenticated" on flashcards;
drop policy if exists "flashcards_insert_authenticated" on flashcards;
drop policy if exists "flashcards_update_authenticated" on flashcards;
drop policy if exists "flashcards_delete_authenticated" on flashcards;
drop policy if exists "flashcards_select_anon" on flashcards;
drop policy if exists "flashcards_insert_anon" on flashcards;
drop policy if exists "flashcards_update_anon" on flashcards;
drop policy if exists "flashcards_delete_anon" on flashcards;

-- drop all rls policies from generations table
-- warning: this removes all access control policies for generations
drop policy if exists "generations_select_authenticated" on generations;
drop policy if exists "generations_insert_authenticated" on generations;
drop policy if exists "generations_update_authenticated" on generations;
drop policy if exists "generations_delete_authenticated" on generations;
drop policy if exists "generations_select_anon" on generations;
drop policy if exists "generations_insert_anon" on generations;
drop policy if exists "generations_update_anon" on generations;
drop policy if exists "generations_delete_anon" on generations;

-- drop all rls policies from generation_error_logs table
-- warning: this removes all access control policies for generation_error_logs
drop policy if exists "generation_error_logs_select_authenticated" on generation_error_logs;
drop policy if exists "generation_error_logs_insert_authenticated" on generation_error_logs;
drop policy if exists "generation_error_logs_update_authenticated" on generation_error_logs;
drop policy if exists "generation_error_logs_delete_authenticated" on generation_error_logs;
drop policy if exists "generation_error_logs_select_anon" on generation_error_logs;
drop policy if exists "generation_error_logs_insert_anon" on generation_error_logs;
drop policy if exists "generation_error_logs_update_anon" on generation_error_logs;
drop policy if exists "generation_error_logs_delete_anon" on generation_error_logs;

