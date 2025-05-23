-- Description: Add RLS policies for flashcard_reviews table
-- Creates row level security policies to ensure users can only access their own data
-- Author: Claude
-- Date: 2024-05-01

-- RLS Policies for flashcard_reviews
create policy "Users can only view their own flashcard reviews"
on flashcard_reviews for select
using (auth.uid() = user_id);

create policy "Users can only insert their own flashcard reviews"
on flashcard_reviews for insert
with check (auth.uid() = user_id);

create policy "Users can only update their own flashcard reviews"
on flashcard_reviews for update
using (auth.uid() = user_id);

create policy "Users can only delete their own flashcard reviews"
on flashcard_reviews for delete
using (auth.uid() = user_id); 