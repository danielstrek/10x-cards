-- Migration: Create flashcards table
-- Purpose: Store user-generated flashcards with AI or manual sources
-- Affected tables: flashcards (new)
-- Special considerations: 
--   - Includes RLS policies for user-specific access
--   - Includes trigger for automatic updated_at timestamp
--   - References generations table (must be created after generations migration)

-- create flashcards table
create table flashcards (
    id bigserial primary key,
    front varchar(200) not null,
    back varchar(500) not null,
    source varchar not null check (source in ('ai-full', 'ai-edited', 'manual')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    generation_id bigint references generations(id) on delete set null,
    user_id uuid not null references auth.users(id) on delete cascade
);

-- create trigger function to automatically update updated_at column
-- this function will be called before any update operation on flashcards table
create or replace function update_flashcards_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- attach trigger to flashcards table
-- this trigger fires before each row update and sets the updated_at timestamp
create trigger flashcards_updated_at_trigger
    before update on flashcards
    for each row
    execute function update_flashcards_updated_at();

-- enable row level security on flashcards table
-- this ensures that access control policies are enforced
alter table flashcards enable row level security;

-- rls policy: allow authenticated users to select their own flashcards
-- rationale: users should only see flashcards they created
create policy "flashcards_select_authenticated"
    on flashcards
    for select
    to authenticated
    using (auth.uid() = user_id);

-- rls policy: allow authenticated users to insert their own flashcards
-- rationale: users can create new flashcards for themselves
create policy "flashcards_insert_authenticated"
    on flashcards
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- rls policy: allow authenticated users to update their own flashcards
-- rationale: users can modify only their own flashcards
create policy "flashcards_update_authenticated"
    on flashcards
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- rls policy: allow authenticated users to delete their own flashcards
-- rationale: users can remove only their own flashcards
-- warning: this is a destructive operation that permanently removes flashcard data
create policy "flashcards_delete_authenticated"
    on flashcards
    for delete
    to authenticated
    using (auth.uid() = user_id);

-- rls policy: deny all operations for anonymous users on select
-- rationale: anonymous users should not have any access to flashcards
create policy "flashcards_select_anon"
    on flashcards
    for select
    to anon
    using (false);

-- rls policy: deny all operations for anonymous users on insert
-- rationale: anonymous users should not be able to create flashcards
create policy "flashcards_insert_anon"
    on flashcards
    for insert
    to anon
    with check (false);

-- rls policy: deny all operations for anonymous users on update
-- rationale: anonymous users should not be able to modify flashcards
create policy "flashcards_update_anon"
    on flashcards
    for update
    to anon
    using (false);

-- rls policy: deny all operations for anonymous users on delete
-- rationale: anonymous users should not be able to delete flashcards
create policy "flashcards_delete_anon"
    on flashcards
    for delete
    to anon
    using (false);

