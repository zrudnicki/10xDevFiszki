-- migration: create_flashcards_schema
-- purpose: create complete database schema for 10xDevFiszki application
-- affected tables: collections, categories, flashcards, study_sessions, flashcard_generation_stats
-- special considerations: 
--   - enables row level security on all tables
--   - creates granular rls policies for anon and authenticated users
--   - implements sm-2 algorithm parameters in flashcards table
--   - sets up triggers for automatic timestamp updates

-- create custom enum types for application state management
create type session_status as enum ('active', 'completed', 'abandoned');
create type flashcard_created_by as enum ('manual', 'ai_generated');

-- collections table: stores user flashcard collections
-- each user can have multiple collections with unique names
create table collections (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name varchar(250) not null,
    description text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    
    constraint collections_name_length check (length(name) <= 250),
    constraint collections_user_name_unique unique (user_id, name)
);

-- enable row level security for collections table
alter table collections enable row level security;

-- rls policy: allow authenticated users to select their own collections
create policy collections_select_policy on collections
    for select 
    to authenticated
    using (auth.uid() = user_id);

-- rls policy: allow authenticated users to insert their own collections
create policy collections_insert_policy on collections
    for insert 
    to authenticated
    with check (auth.uid() = user_id);

-- rls policy: allow authenticated users to update their own collections
create policy collections_update_policy on collections
    for update 
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- rls policy: allow authenticated users to delete their own collections
create policy collections_delete_policy on collections
    for delete 
    to authenticated
    using (auth.uid() = user_id);

-- categories table: stores flashcard categories for organization
-- flat structure without hierarchy, private per user
create table categories (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name varchar(250) not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    
    constraint categories_name_length check (length(name) <= 250),
    constraint categories_user_name_unique unique (user_id, name)
);

-- enable row level security for categories table
alter table categories enable row level security;

-- rls policy: allow authenticated users to select their own categories
create policy categories_select_policy on categories
    for select 
    to authenticated
    using (auth.uid() = user_id);

-- rls policy: allow authenticated users to insert their own categories
create policy categories_insert_policy on categories
    for insert 
    to authenticated
    with check (auth.uid() = user_id);

-- rls policy: allow authenticated users to update their own categories
create policy categories_update_policy on categories
    for update 
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- rls policy: allow authenticated users to delete their own categories
create policy categories_delete_policy on categories
    for delete 
    to authenticated
    using (auth.uid() = user_id);

-- flashcards table: core table storing flashcard data with sm-2 algorithm parameters
-- contains front/back content, spaced repetition parameters, and metadata
create table flashcards (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    collection_id uuid not null references collections(id) on delete cascade,
    category_id uuid references categories(id) on delete set null,
    
    front varchar(200) not null,
    back varchar(500) not null,
    
    -- sm-2 algorithm parameters for spaced repetition
    easiness_factor decimal(3,2) not null default 2.5,
    interval integer not null default 1,
    repetitions integer not null default 0,
    next_review_date timestamptz not null default (current_date + interval '1 day')::timestamptz,
    
    created_by flashcard_created_by not null default 'manual',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    
    constraint flashcards_front_length check (length(front) <= 200 and length(front) > 0),
    constraint flashcards_back_length check (length(back) <= 500 and length(back) > 0),
    constraint flashcards_easiness_factor_range check (easiness_factor >= 1.3 and easiness_factor <= 2.5),
    constraint flashcards_interval_positive check (interval > 0),
    constraint flashcards_repetitions_non_negative check (repetitions >= 0)
);

-- enable row level security for flashcards table
alter table flashcards enable row level security;

-- rls policy: allow authenticated users to select their own flashcards
create policy flashcards_select_policy on flashcards
    for select 
    to authenticated
    using (auth.uid() = user_id);

-- rls policy: allow authenticated users to insert their own flashcards
create policy flashcards_insert_policy on flashcards
    for insert 
    to authenticated
    with check (auth.uid() = user_id);

-- rls policy: allow authenticated users to update their own flashcards
create policy flashcards_update_policy on flashcards
    for update 
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- rls policy: allow authenticated users to delete their own flashcards
create policy flashcards_delete_policy on flashcards
    for delete 
    to authenticated
    using (auth.uid() = user_id);

-- study_sessions table: tracks learning sessions for time metrics and progress
-- supports session continuation and timeout handling
create table study_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    collection_id uuid not null references collections(id) on delete cascade,
    
    started_at timestamptz not null default now(),
    ended_at timestamptz,
    flashcards_reviewed_count integer not null default 0,
    status session_status not null default 'active',
    
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    
    constraint study_sessions_flashcards_count_non_negative check (flashcards_reviewed_count >= 0),
    constraint study_sessions_ended_after_started check (ended_at is null or ended_at >= started_at)
);

-- enable row level security for study_sessions table
alter table study_sessions enable row level security;

-- rls policy: allow authenticated users to select their own study sessions
create policy study_sessions_select_policy on study_sessions
    for select 
    to authenticated
    using (auth.uid() = user_id);

-- rls policy: allow authenticated users to insert their own study sessions
create policy study_sessions_insert_policy on study_sessions
    for insert 
    to authenticated
    with check (auth.uid() = user_id);

-- rls policy: allow authenticated users to update their own study sessions
create policy study_sessions_update_policy on study_sessions
    for update 
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- rls policy: allow authenticated users to delete their own study sessions
create policy study_sessions_delete_policy on study_sessions
    for delete 
    to authenticated
    using (auth.uid() = user_id);

-- flashcard_generation_stats table: aggregated statistics for ai generation metrics
-- tracks success rates for mvp metrics (75% acceptance rate, 75% ai generated)
create table flashcard_generation_stats (
    user_id uuid primary key references auth.users(id) on delete cascade,
    
    total_generated integer not null default 0,
    total_accepted_direct integer not null default 0,
    total_accepted_edited integer not null default 0,
    last_generation_at timestamptz,
    
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    
    constraint generation_stats_totals_non_negative check (
        total_generated >= 0 and 
        total_accepted_direct >= 0 and 
        total_accepted_edited >= 0
    ),
    constraint generation_stats_accepted_not_exceed_generated check (
        (total_accepted_direct + total_accepted_edited) <= total_generated
    )
);

-- enable row level security for flashcard_generation_stats table
alter table flashcard_generation_stats enable row level security;

-- rls policy: allow authenticated users to select their own generation stats
create policy generation_stats_select_policy on flashcard_generation_stats
    for select 
    to authenticated
    using (auth.uid() = user_id);

-- rls policy: allow authenticated users to insert their own generation stats
create policy generation_stats_insert_policy on flashcard_generation_stats
    for insert 
    to authenticated
    with check (auth.uid() = user_id);

-- rls policy: allow authenticated users to update their own generation stats
create policy generation_stats_update_policy on flashcard_generation_stats
    for update 
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- rls policy: allow authenticated users to delete their own generation stats
create policy generation_stats_delete_policy on flashcard_generation_stats
    for delete 
    to authenticated
    using (auth.uid() = user_id);

-- create performance indexes for optimized queries
-- collections indexes
create index idx_collections_user_id on collections(user_id);
create index idx_collections_user_created_at on collections(user_id, created_at desc);

-- categories indexes  
create index idx_categories_user_id on categories(user_id);

-- flashcards indexes - critical for performance with large datasets
create index idx_flashcards_user_id on flashcards(user_id);
create index idx_flashcards_collection_id on flashcards(collection_id);
create index idx_flashcards_category_id on flashcards(category_id);
create index idx_flashcards_next_review_date on flashcards(next_review_date);
create index idx_flashcards_user_next_review on flashcards(user_id, next_review_date);
create index idx_flashcards_created_by on flashcards(created_by);

-- study sessions indexes
create index idx_study_sessions_user_id on study_sessions(user_id);
create index idx_study_sessions_collection_id on study_sessions(collection_id);
create index idx_study_sessions_user_started_at on study_sessions(user_id, started_at desc);
-- partial index for active sessions only (performance optimization)
create index idx_study_sessions_status on study_sessions(status) where status = 'active';

-- create function for automatic updated_at timestamp management
-- this function will be used by triggers to maintain data integrity
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

-- create triggers for automatic updated_at timestamp updates
-- these triggers ensure data consistency across all tables
create trigger update_collections_updated_at before update on collections
    for each row execute function update_updated_at_column();

create trigger update_categories_updated_at before update on categories
    for each row execute function update_updated_at_column();

create trigger update_flashcards_updated_at before update on flashcards
    for each row execute function update_updated_at_column();

create trigger update_study_sessions_updated_at before update on study_sessions
    for each row execute function update_updated_at_column();

create trigger update_generation_stats_updated_at before update on flashcard_generation_stats
    for each row execute function update_updated_at_column();

-- create function for automatic generation stats initialization
-- ensures every new user gets statistics record for tracking mvp metrics
create or replace function initialize_user_generation_stats()
returns trigger as $$
begin
    insert into flashcard_generation_stats (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
    return new;
end;
$$ language 'plpgsql';

-- create trigger for automatic stats initialization on user signup
-- this trigger runs after user registration to set up tracking
create trigger initialize_generation_stats_on_signup
    after insert on auth.users
    for each row execute function initialize_user_generation_stats(); 