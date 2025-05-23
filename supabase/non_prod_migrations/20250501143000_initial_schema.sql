-- Description: Initial database schema for Fiszki application
-- Creates core tables: collections, categories, flashcards, and flashcard_generation_stats
-- Author: AI Assistant
-- Date: 2024-03-20

-- 1. Extensions
create extension if not exists "uuid-ossp";

-- 2. Functions (needed for triggers)
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = current_timestamp;
    return new;
end;
$$ language plpgsql;

-- 3. Tables (in order of dependencies)
-- Collections table (depends only on auth.users)
create table collections (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    description text,
    created_at timestamptz default current_timestamp,
    updated_at timestamptz default current_timestamp,
    constraint collections_name_length check (char_length(name) <= 100),
    constraint collections_description_length check (char_length(description) <= 500)
);

-- Categories table (depends only on auth.users)
create table categories (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    description text,
    created_at timestamptz default current_timestamp,
    updated_at timestamptz default current_timestamp,
    constraint categories_name_length check (char_length(name) <= 50),
    constraint categories_description_length check (char_length(description) <= 200),
    constraint categories_unique_name_per_user unique (user_id, name)
);

-- Flashcards table (depends on collections and categories)
create table flashcards (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    collection_id uuid references collections(id) on delete set null,
    category_id uuid references categories(id) on delete set null,
    front text not null,
    back text not null,
    created_at timestamptz default current_timestamp,
    updated_at timestamptz default current_timestamp,
    constraint flashcards_front_length check (char_length(front) <= 200),
    constraint flashcards_back_length check (char_length(back) <= 500)
);

-- Flashcard generation stats table (depends only on auth.users)
create table flashcard_generation_stats (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    total_generated integer not null default 0,
    total_accepted_direct integer not null default 0,
    total_accepted_edited integer not null default 0,
    last_generation_at timestamptz,
    created_at timestamptz default current_timestamp,
    updated_at timestamptz default current_timestamp,
    constraint flashcard_generation_stats_positive_numbers check (
        total_generated >= 0 and
        total_accepted_direct >= 0 and
        total_accepted_edited >= 0 and
        total_accepted_direct + total_accepted_edited <= total_generated
    )
);

-- 4. Indexes
create index idx_collections_user_id on collections(user_id);
create index idx_collections_created_at on collections(created_at);

create index idx_categories_user_id on categories(user_id);
create index idx_categories_created_at on categories(created_at);

create index idx_flashcards_user_id on flashcards(user_id);
create index idx_flashcards_collection_id on flashcards(collection_id);
create index idx_flashcards_category_id on flashcards(category_id);
create index idx_flashcards_created_at on flashcards(created_at);

create index idx_flashcard_generation_stats_user_id on flashcard_generation_stats(user_id);

-- 5. Triggers
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
