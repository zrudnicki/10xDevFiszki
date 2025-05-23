-- Description: Enable RLS on all tables and add RLS policies
-- Ensures row level security is properly configured for all tables
-- Author: Claude
-- Date: 2024-05-01

-- Enable RLS on all tables
alter table collections enable row level security;
alter table categories enable row level security;
alter table flashcards enable row level security;
alter table flashcard_generation_stats enable row level security;

-- Collections RLS policies
create policy "Users can only view their own collections"
on collections for select
using (auth.uid() = user_id);

create policy "Users can only insert their own collections"
on collections for insert
with check (auth.uid() = user_id);

create policy "Users can only update their own collections"
on collections for update
using (auth.uid() = user_id);

create policy "Users can only delete their own collections"
on collections for delete
using (auth.uid() = user_id);

-- Categories RLS policies
create policy "Users can only view their own categories"
on categories for select
using (auth.uid() = user_id);

create policy "Users can only insert their own categories"
on categories for insert
with check (auth.uid() = user_id);

create policy "Users can only update their own categories"
on categories for update
using (auth.uid() = user_id);

create policy "Users can only delete their own categories"
on categories for delete
using (auth.uid() = user_id);

-- Flashcards RLS policies
create policy "Users can only view their own flashcards"
on flashcards for select
using (auth.uid() = user_id);

create policy "Users can only insert their own flashcards"
on flashcards for insert
with check (auth.uid() = user_id);

create policy "Users can only update their own flashcards"
on flashcards for update
using (auth.uid() = user_id);

create policy "Users can only delete their own flashcards"
on flashcards for delete
using (auth.uid() = user_id); 