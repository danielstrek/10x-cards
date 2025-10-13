-- Migration: Create generation_error_logs table
-- Purpose: Track errors that occur during AI flashcard generation
-- Affected tables: generation_error_logs (new)
-- Special considerations:
--   - Includes RLS policies for user-specific access
--   - Stores error details for debugging and monitoring
--   - Insert-only table (no updates needed, deletes for cleanup)

-- create generation_error_logs table
create table generation_error_logs (
    id bigserial primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    model varchar not null,
    source_text_hash varchar not null,
    source_text_length integer not null check (source_text_length between 1000 and 10000),
    error_code varchar(100) not null,
    error_message text not null,
    created_at timestamptz not null default now()
);

-- enable row level security on generation_error_logs table
-- this ensures that access control policies are enforced
alter table generation_error_logs enable row level security;

-- rls policy: allow authenticated users to select their own error logs
-- rationale: users should only see error logs for their own generation attempts
create policy "generation_error_logs_select_authenticated"
    on generation_error_logs
    for select
    to authenticated
    using (auth.uid() = user_id);

-- rls policy: allow authenticated users to insert their own error logs
-- rationale: users (or system on their behalf) can create error log entries
create policy "generation_error_logs_insert_authenticated"
    on generation_error_logs
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- rls policy: deny updates for authenticated users
-- rationale: error logs are immutable records and should not be modified after creation
create policy "generation_error_logs_update_authenticated"
    on generation_error_logs
    for update
    to authenticated
    using (false);

-- rls policy: allow authenticated users to delete their own error logs
-- rationale: users can remove their own error logs for cleanup purposes
-- warning: this is a destructive operation that permanently removes error log data
create policy "generation_error_logs_delete_authenticated"
    on generation_error_logs
    for delete
    to authenticated
    using (auth.uid() = user_id);

-- rls policy: deny all operations for anonymous users on select
-- rationale: anonymous users should not have any access to error logs
create policy "generation_error_logs_select_anon"
    on generation_error_logs
    for select
    to anon
    using (false);

-- rls policy: deny all operations for anonymous users on insert
-- rationale: anonymous users should not be able to create error logs
create policy "generation_error_logs_insert_anon"
    on generation_error_logs
    for insert
    to anon
    with check (false);

-- rls policy: deny all operations for anonymous users on update
-- rationale: anonymous users should not be able to modify error logs
create policy "generation_error_logs_update_anon"
    on generation_error_logs
    for update
    to anon
    using (false);

-- rls policy: deny all operations for anonymous users on delete
-- rationale: anonymous users should not be able to delete error logs
create policy "generation_error_logs_delete_anon"
    on generation_error_logs
    for delete
    to anon
    using (false);

