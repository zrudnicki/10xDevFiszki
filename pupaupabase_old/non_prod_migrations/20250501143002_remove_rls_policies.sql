-- Description: Disable all RLS policies for specified tables
-- Author: AI Assistant
-- Date: 2024-03-20

-- Disable policies for collections
drop policy if exists "Users can view their own collections" on collections;
drop policy if exists "Users can insert their own collections" on collections;
drop policy if exists "Users can update their own collections" on collections;
drop policy if exists "Users can delete their own collections" on collections;

-- Disable policies for categories
drop policy if exists "Users can view their own categories" on categories;
drop policy if exists "Users can insert their own categories" on categories;
drop policy if exists "Users can update their own categories" on categories;
drop policy if exists "Users can delete their own categories" on categories;

-- Disable policies for flashcards
drop policy if exists "Users can view their own flashcards" on flashcards;
drop policy if exists "Users can insert their own flashcards" on flashcards;
drop policy if exists "Users can update their own flashcards" on flashcards;
drop policy if exists "Users can delete their own flashcards" on flashcards;

-- Disable policies for flashcard_generation_stats
drop policy if exists "Users can view their own stats" on flashcard_generation_stats;
drop policy if exists "Users can update their own stats" on flashcard_generation_stats;

-- Disable RLS on tables
alter table collections disable row level security;
alter table categories disable row level security;
alter table flashcards disable row level security;
alter table flashcard_generation_stats disable row level security;