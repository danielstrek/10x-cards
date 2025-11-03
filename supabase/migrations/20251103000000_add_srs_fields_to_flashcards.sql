-- Migration: Add SRS (Spaced Repetition System) fields to flashcards
-- Purpose: Enable SuperMemo 2 (SM-2) algorithm for study sessions
-- Affected tables: flashcards (modified)
-- Algorithm: SM-2 by Piotr Wozniak (1987)
-- References: https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method

-- Add SRS fields to flashcards table
ALTER TABLE flashcards
ADD COLUMN easiness_factor REAL NOT NULL DEFAULT 2.5 CHECK (easiness_factor >= 1.3),
ADD COLUMN interval INTEGER NOT NULL DEFAULT 0 CHECK (interval >= 0),
ADD COLUMN repetitions INTEGER NOT NULL DEFAULT 0 CHECK (repetitions >= 0),
ADD COLUMN next_review_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
ADD COLUMN last_reviewed_at TIMESTAMPTZ;

-- Add comment explaining the fields
COMMENT ON COLUMN flashcards.easiness_factor IS 'SM-2 easiness factor (EF), range 1.3-2.5+, default 2.5';
COMMENT ON COLUMN flashcards.interval IS 'Days until next review, calculated by SM-2 algorithm';
COMMENT ON COLUMN flashcards.repetitions IS 'Number of consecutive correct answers';
COMMENT ON COLUMN flashcards.next_review_date IS 'When this card should be reviewed next';
COMMENT ON COLUMN flashcards.last_reviewed_at IS 'Last time this card was reviewed';

-- Create index for efficient querying of due cards
-- Note: We can't use WHERE next_review_date <= NOW() because NOW() is not IMMUTABLE
-- Instead, we create a regular index which will still be efficient for our queries
CREATE INDEX idx_flashcards_next_review_date 
ON flashcards(user_id, next_review_date);

COMMENT ON INDEX idx_flashcards_next_review_date IS 'Optimize queries for due flashcards per user';

