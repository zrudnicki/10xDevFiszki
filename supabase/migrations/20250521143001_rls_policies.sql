-- Enable RLS on all tables
alter table collections enable row level security;
alter table categories enable row level security;
alter table flashcards enable row level security;
alter table flashcard_generation_stats enable row level security;
alter table flashcard_reviews enable row level security;
alter table public.flashcard_generation_requests enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view their own collections" on collections;
drop policy if exists "Users can insert their own collections" on collections;
drop policy if exists "Users can update their own collections" on collections;
drop policy if exists "Users can delete their own collections" on collections;

drop policy if exists "Users can view their own categories" on categories;
drop policy if exists "Users can insert their own categories" on categories;
drop policy if exists "Users can update their own categories" on categories;
drop policy if exists "Users can delete their own categories" on categories;

drop policy if exists "Users can view their own flashcards" on flashcards;
drop policy if exists "Users can insert their own flashcards" on flashcards;
drop policy if exists "Users can update their own flashcards" on flashcards;
drop policy if exists "Users can delete their own flashcards" on flashcards;

drop policy if exists "Users can view their own stats" on flashcard_generation_stats;
drop policy if exists "Users can insert their own stats" on flashcard_generation_stats;
drop policy if exists "Users can update their own stats" on flashcard_generation_stats;

drop policy if exists "Users can view their own reviews" on flashcard_reviews;
drop policy if exists "Users can insert their own reviews" on flashcard_reviews;
drop policy if exists "Users can update their own reviews" on flashcard_reviews;
drop policy if exists "Users can delete their own reviews" on flashcard_reviews;

drop policy if exists "Users can view their own requests" on public.flashcard_generation_requests;
drop policy if exists "Users can insert their own requests" on public.flashcard_generation_requests;

-- Collections policies
create policy "Users can view their own collections"
    on collections for select
    using (auth.uid() = user_id);

create policy "Users can insert their own collections"
    on collections for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own collections"
    on collections for update
    using (auth.uid() = user_id);

create policy "Users can delete their own collections"
    on collections for delete
    using (auth.uid() = user_id);

-- Categories policies
create policy "Users can view their own categories"
    on categories for select
    using (auth.uid() = user_id);

create policy "Users can insert their own categories"
    on categories for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own categories"
    on categories for update
    using (auth.uid() = user_id);

create policy "Users can delete their own categories"
    on categories for delete
    using (auth.uid() = user_id);

-- Flashcards policies
create policy "Users can view their own flashcards"
    on flashcards for select
    using (auth.uid() = user_id);

create policy "Users can insert their own flashcards"
    on flashcards for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own flashcards"
    on flashcards for update
    using (auth.uid() = user_id);

create policy "Users can delete their own flashcards"
    on flashcards for delete
    using (auth.uid() = user_id);

-- Flashcard generation stats policies
create policy "Users can view their own stats"
    on flashcard_generation_stats for select
    using (auth.uid() = user_id);

create policy "Users can insert their own stats"
    on flashcard_generation_stats for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own stats"
    on flashcard_generation_stats for update
    using (auth.uid() = user_id);

-- Flashcard reviews policies
create policy "Users can view their own reviews"
    on flashcard_reviews for select
    using (auth.uid() = user_id);

create policy "Users can insert their own reviews"
    on flashcard_reviews for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own reviews"
    on flashcard_reviews for update
    using (auth.uid() = user_id);

create policy "Users can delete their own reviews"
    on flashcard_reviews for delete
    using (auth.uid() = user_id);

-- Rate limit policies
create policy "Users can view their own requests"
    on public.flashcard_generation_requests for select
    using (auth.uid() = user_id);

create policy "Users can insert their own requests"
    on public.flashcard_generation_requests for insert
    with check (auth.uid() = user_id); 