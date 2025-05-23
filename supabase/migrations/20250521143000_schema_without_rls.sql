-- Extensions
create extension if not exists "uuid-ossp";

-- Functions
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = current_timestamp;
    return new;
end;
$$ language plpgsql;

-- Rate limit cleanup function
create or replace function public.cleanup_old_requests()
returns void as $$
begin
    delete from public.flashcard_generation_requests
    where created_at < now() - interval '24 hours';
    
    delete from public.flashcard_generation_stats
    where created_at < now() - interval '24 hours';
end;
$$ language plpgsql security definer;

-- Rate limit trigger function
create or replace function public.trigger_cleanup_old_requests()
returns trigger as $$
begin
    -- Only run cleanup if we have more than 1000 records
    if (select count(*) from public.flashcard_generation_requests) > 1000 then
        perform public.cleanup_old_requests();
    end if;
    return new;
end;
$$ language plpgsql security definer;

-- Tables
create table if not exists collections (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    description text,
    created_at timestamptz default current_timestamp,
    updated_at timestamptz default current_timestamp,
    constraint collections_name_length check (char_length(name) <= 100),
    constraint collections_description_length check (char_length(description) <= 500)
);

create table if not exists categories (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    description text,
    created_at timestamptz default current_timestamp,
    updated_at timestamptz default current_timestamp,
    constraint categories_name_length check (char_length(name) <= 50),
    constraint categories_description_length check (char_length(description) <= 200),
    constraint categories_unique_name_per_user unique (user_id, name)
);

create table if not exists flashcards (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    collection_id uuid references collections(id) on delete set null,
    category_id uuid references categories(id) on delete set null,
    front text not null,
    back text not null,
    next_review_at timestamptz,
    easiness_factor real default 2.5,
    interval_days integer default 0,
    reviews_count integer default 0,
    last_reviewed_at timestamptz,
    created_at timestamptz default current_timestamp,
    updated_at timestamptz default current_timestamp,
    constraint flashcards_front_length check (char_length(front) <= 200),
    constraint flashcards_back_length check (char_length(back) <= 500)
);

-- Rate limit and generation tracking tables
create table if not exists public.flashcard_generation_requests (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz default now() not null
);

create table if not exists public.flashcard_generation_stats (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    total_generated integer not null default 0,
    total_accepted_direct integer not null default 0,
    total_accepted_edited integer not null default 0,
    last_generation_at timestamptz,
    created_at timestamptz default current_timestamp,
    updated_at timestamptz default current_timestamp,
    metadata jsonb default '{}'::jsonb,
    constraint flashcard_generation_stats_positive_numbers check (
        total_generated >= 0 and
        total_accepted_direct >= 0 and
        total_accepted_edited >= 0 and
        total_accepted_direct + total_accepted_edited <= total_generated
    )
);

create table if not exists flashcard_reviews (
    id uuid primary key default uuid_generate_v4(),
    flashcard_id uuid not null references flashcards(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    status text not null check (status in ('learned', 'review')),
    next_review_at timestamptz,
    review_count integer not null default 0,
    last_reviewed_at timestamptz,
    quality integer default 0,
    created_at timestamptz default current_timestamp,
    updated_at timestamptz default current_timestamp,
    constraint flashcard_reviews_unique_flashcard_user unique (flashcard_id, user_id)
);

-- Indexes
create index if not exists idx_collections_user_id on collections(user_id);
create index if not exists idx_collections_created_at on collections(created_at);

create index if not exists idx_categories_user_id on categories(user_id);
create index if not exists idx_categories_created_at on categories(created_at);

create index if not exists idx_flashcards_user_id on flashcards(user_id);
create index if not exists idx_flashcards_collection_id on flashcards(collection_id);
create index if not exists idx_flashcards_category_id on flashcards(category_id);
create index if not exists idx_flashcards_created_at on flashcards(created_at);
create index if not exists idx_flashcards_next_review_at on flashcards(next_review_at);
create index if not exists idx_flashcards_user_next_review on flashcards(user_id, next_review_at);

create index if not exists idx_flashcard_generation_stats_user_id on flashcard_generation_stats(user_id);
create index if not exists flashcard_generation_stats_user_created_idx on flashcard_generation_stats(user_id, created_at);

create index if not exists idx_flashcard_reviews_flashcard_id on flashcard_reviews(flashcard_id);
create index if not exists idx_flashcard_reviews_user_id on flashcard_reviews(user_id);
create index if not exists idx_flashcard_reviews_next_review_at on flashcard_reviews(next_review_at);
create index if not exists idx_flashcard_reviews_status on flashcard_reviews(status);

-- Rate limit indexes
create index if not exists flashcard_generation_requests_user_created_idx 
    on public.flashcard_generation_requests(user_id, created_at);

-- Drop existing triggers
drop trigger if exists update_collections_updated_at on collections;
drop trigger if exists update_categories_updated_at on categories;
drop trigger if exists update_flashcards_updated_at on flashcards;
drop trigger if exists update_flashcard_generation_stats_updated_at on flashcard_generation_stats;
drop trigger if exists set_flashcard_reviews_updated_at on flashcard_reviews;
drop trigger if exists cleanup_old_requests_trigger on public.flashcard_generation_requests;

-- Create triggers
create trigger update_collections_updated_at
    before update on collections
    for each row
    execute function update_updated_at_column();

create trigger update_categories_updated_at
    before update on categories
    for each row
    execute function update_updated_at_column();

create trigger update_flashcards_updated_at
    before update on flashcards
    for each row
    execute function update_updated_at_column();

create trigger update_flashcard_generation_stats_updated_at
    before update on flashcard_generation_stats
    for each row
    execute function update_updated_at_column();

create trigger set_flashcard_reviews_updated_at
    before update on flashcard_reviews
    for each row
    execute function update_updated_at_column();

create trigger cleanup_old_requests_trigger
    after insert on public.flashcard_generation_requests
    for each row
    execute function public.trigger_cleanup_old_requests(); 