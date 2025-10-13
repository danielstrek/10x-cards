-- Migration: Create indexes for performance optimization
-- Purpose: Add indexes to improve query performance on foreign key and frequently queried columns
-- Affected tables: flashcards, generations, generation_error_logs
-- Special considerations:
--   - Indexes on user_id columns for efficient user-specific queries
--   - Index on generation_id in flashcards for join operations
--   - All indexes use btree (PostgreSQL default) for general-purpose queries

-- create index on flashcards.user_id
-- rationale: speeds up queries filtering flashcards by user (common in RLS policies and user dashboards)
create index idx_flashcards_user_id on flashcards(user_id);

-- create index on flashcards.generation_id
-- rationale: speeds up joins between flashcards and generations tables
-- also improves performance when filtering flashcards by generation
create index idx_flashcards_generation_id on flashcards(generation_id);

-- create index on generations.user_id
-- rationale: speeds up queries filtering generations by user (common in RLS policies and analytics)
create index idx_generations_user_id on generations(user_id);

-- create index on generation_error_logs.user_id
-- rationale: speeds up queries filtering error logs by user (common in RLS policies and error monitoring)
create index idx_generation_error_logs_user_id on generation_error_logs(user_id);

