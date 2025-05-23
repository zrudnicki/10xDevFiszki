-- Add spaced repetition fields to flashcards table
ALTER TABLE public.flashcards
ADD COLUMN IF NOT EXISTS next_review_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS easiness_factor REAL DEFAULT 2.5,
ADD COLUMN IF NOT EXISTS interval_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMP WITH TIME ZONE;

-- Add quality field to flashcard_reviews table
ALTER TABLE public.flashcard_reviews
ADD COLUMN IF NOT EXISTS quality INTEGER DEFAULT 0;

-- Create index on next_review_at to optimize queries for due flashcards
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review_at
ON public.flashcards (next_review_at);

-- Create index on user_id + next_review_at for faster retrieval of user's due cards
CREATE INDEX IF NOT EXISTS idx_flashcards_user_next_review
ON public.flashcards (user_id, next_review_at);

COMMENT ON COLUMN public.flashcards.next_review_at IS 'When this card is scheduled for next review';
COMMENT ON COLUMN public.flashcards.easiness_factor IS 'SM-2 easiness factor (1.3 to 5.0), default 2.5';
COMMENT ON COLUMN public.flashcards.interval_days IS 'Current interval in days between reviews';
COMMENT ON COLUMN public.flashcards.reviews_count IS 'Number of times this card has been reviewed';
COMMENT ON COLUMN public.flashcards.last_reviewed_at IS 'When this card was last reviewed';
COMMENT ON COLUMN public.flashcard_reviews.quality IS 'Quality of recall (0-5 scale from SM-2 algorithm)'; 