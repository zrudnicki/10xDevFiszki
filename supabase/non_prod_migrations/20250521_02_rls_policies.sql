-- Enable RLS on all tables
alter table collections enable row level security;
alter table categories enable row level security;
alter table flashcards enable row level security;
alter table flashcard_generation_stats enable row level security;
alter table flashcard_reviews enable row level security;

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