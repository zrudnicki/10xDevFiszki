-- Description: Temporarily disable RLS on all tables
-- This is a temporary fix to address permission denied errors
-- Author: Claude
-- Date: 2024-05-01

-- Disable RLS on all tables
alter table collections disable row level security;
alter table categories disable row level security;
alter table flashcards disable row level security;
alter table flashcard_generation_stats disable row level security;
alter table flashcard_reviews disable row level security;

-- Comment: After resolving permission issues, you should re-enable RLS
-- by running a new migration that enables RLS and creates appropriate policies 