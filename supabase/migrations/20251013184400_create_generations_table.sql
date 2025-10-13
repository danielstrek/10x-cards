-- Migration: Create generations table
-- Purpose: Track AI generation sessions for flashcards
-- Affected tables: generations (new)
-- Special considerations:
--   - Includes RLS policies for user-specific access
--   - Tracks metrics about AI flashcard generation
--   - Must be created before flashcards table due to foreign key reference

-- create generations table
create table generations (
    id bigserial primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    model varchar not null,
    generated_count integer not null,
    accepted_unedited_count integer,
    accepted_edited_count integer,
    source_text_hash varchar not null,
    source_text_length integer not null check (source_text_length between 1000 and 10000),
    generation_duration integer not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- create trigger function to automatically update updated_at column
-- this function will be called before any update operation on generations table
create or replace function update_generations_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- attach trigger to generations table
-- this trigger fires before each row update and sets the updated_at timestamp
create trigger generations_updated_at_trigger
    before update on generations
    for each row
    execute function update_generations_updated_at();

-- enable row level security on generations table
-- this ensures that access control policies are enforced
alter table generations enable row level security;

-- rls policy: allow authenticated users to select their own generations
-- rationale: users should only see generation records they created
create policy "generations_select_authenticated"
    on generations
    for select
    to authenticated
    using (auth.uid() = user_id);

-- rls policy: allow authenticated users to insert their own generations
-- rationale: users can create new generation records for themselves
create policy "generations_insert_authenticated"
    on generations
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- rls policy: allow authenticated users to update their own generations
-- rationale: users can modify only their own generation records (e.g., updating acceptance counts)
create policy "generations_update_authenticated"
    on generations
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- rls policy: allow authenticated users to delete their own generations
-- rationale: users can remove only their own generation records
-- warning: this is a destructive operation that permanently removes generation data
-- note: related flashcards will have their generation_id set to null (on delete set null)
create policy "generations_delete_authenticated"
    on generations
    for delete
    to authenticated
    using (auth.uid() = user_id);

-- rls policy: deny all operations for anonymous users on select
-- rationale: anonymous users should not have any access to generation records
create policy "generations_select_anon"
    on generations
    for select
    to anon
    using (false);

-- rls policy: deny all operations for anonymous users on insert
-- rationale: anonymous users should not be able to create generation records
create policy "generations_insert_anon"
    on generations
    for insert
    to anon
    with check (false);

-- rls policy: deny all operations for anonymous users on update
-- rationale: anonymous users should not be able to modify generation records
create policy "generations_update_anon"
    on generations
    for update
    to anon
    using (false);

-- rls policy: deny all operations for anonymous users on delete
-- rationale: anonymous users should not be able to delete generation records
create policy "generations_delete_anon"
    on generations
    for delete
    to anon
    using (false);

