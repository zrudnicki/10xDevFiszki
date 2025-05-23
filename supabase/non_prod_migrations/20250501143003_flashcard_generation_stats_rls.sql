-- Description: Add RLS policies for flashcard_generation_stats table
-- Creates row level security policies to ensure users can only access their own data
-- Author: Claude
-- Date: 2024-05-01

-- RLS Policies for flashcard_generation_stats
create policy "Users can only view their own flashcard generation stats"
on flashcard_generation_stats for select
using (auth.uid() = user_id);

create policy "Users can only insert their own flashcard generation stats"
on flashcard_generation_stats for insert
with check (auth.uid() = user_id);

create policy "Users can only update their own flashcard generation stats"
on flashcard_generation_stats for update
using (auth.uid() = user_id);

create policy "Users can only delete their own flashcard generation stats"
on flashcard_generation_stats for delete
using (auth.uid() = user_id); 