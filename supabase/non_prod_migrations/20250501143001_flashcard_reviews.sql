-- Description: Add flashcard_reviews table for spaced repetition
-- Creates the flashcard_reviews table to track review status and scheduling
-- Author: Claude
-- Date: 2024-05-01

-- Flashcard Reviews table (depends on flashcards)
create table flashcard_reviews (
    id uuid primary key default gen_random_uuid(),
    flashcard_id uuid not null references flashcards(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    status text not null check (status in ('learned', 'review')),
    next_review_at timestamptz,
    review_count integer not null default 0,
    last_reviewed_at timestamptz,
    created_at timestamptz default current_timestamp,
    updated_at timestamptz default current_timestamp,
    constraint flashcard_reviews_unique_flashcard_user unique (flashcard_id, user_id)
);

-- Indexes
create index idx_flashcard_reviews_flashcard_id on flashcard_reviews(flashcard_id);
create index idx_flashcard_reviews_user_id on flashcard_reviews(user_id);
create index idx_flashcard_reviews_next_review_at on flashcard_reviews(next_review_at);
create index idx_flashcard_reviews_status on flashcard_reviews(status);

-- Updated at trigger
create trigger set_flashcard_reviews_updated_at
before update on flashcard_reviews
for each row
execute function update_updated_at_column();

-- Enable row level security (policies will be defined in a separate file)
alter table flashcard_reviews enable row level security; 