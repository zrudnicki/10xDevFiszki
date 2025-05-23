-- Temporary script to disable RLS on all tables
-- Run this directly in the SQL editor of Supabase Dashboard
-- or using psql if you have access to the database

-- Disable RLS on all tables
alter table collections disable row level security;
alter table categories disable row level security;
alter table flashcards disable row level security;
alter table flashcard_generation_stats disable row level security;
alter table flashcard_reviews disable row level security;

-- If you need to check which tables have RLS enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- If you need to drop specific policies:
-- SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public';
-- DROP POLICY "policy_name" ON table_name; 