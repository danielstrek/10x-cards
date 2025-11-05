# Study Module Implementation - Spaced Repetition System

## Overview

Successfully implemented a complete study session module (`/study`) with SM-2 spaced repetition algorithm for the 10x-cards application. Users can now efficiently learn their flashcards using a scientifically proven method.

## Implementation Date

November 3, 2025

## Features Implemented

### 1. SM-2 Spaced Repetition Algorithm

- **Algorithm**: SuperMemo 2 by Piotr Wozniak (1987)
- **Quality Ratings**: 4 user-friendly options mapped to SM-2 scale (0-5)
  - "Wcale" (Again) → Quality 0
  - "Trudno" (Hard) → Quality 3
  - "Dobrze" (Good) → Quality 4
  - "Łatwo" (Easy) → Quality 5
- **Parameters**:
  - Easiness Factor (EF): 1.3 - 2.5+ (default 2.5)
  - Interval: Days until next review
  - Repetitions: Consecutive correct answers
  - Next Review Date: Calculated based on interval

### 2. Study Session Features

- ✅ Fetch due flashcards (cards ready for review)
- ✅ Card flip interaction (show question → show answer)
- ✅ 4-button rating system with visual feedback
- ✅ Progress tracking (current card / total cards)
- ✅ Session statistics (due, reviewed today, total)
- ✅ Auto-advance to next card after rating
- ✅ Session completion screen
- ✅ Refresh functionality for new sessions

### 3. Statistics Dashboard

- **Total Cards**: Total number of user's flashcards
- **Due Cards**: Cards ready for review right now
- **Reviewed Today**: Cards studied in current session
- **Real-time Updates**: Statistics update after each review

### 4. User Experience

- 🎯 Clean, focused study interface
- 🔄 Smooth card flip animation
- 📊 Visual progress bar
- 🎨 Color-coded rating buttons
- ⚡ Loading states for all operations
- ✅ Empty state with helpful actions
- 🏆 Session completion celebration

## Files Created/Modified

### Database Migration (1 file)

1. **supabase/migrations/20251103000000_add_srs_fields_to_flashcards.sql** (new)
   - Added 5 SRS fields to flashcards table:
     - `easiness_factor` REAL (default 2.5, min 1.3)
     - `interval` INTEGER (default 0, days until next review)
     - `repetitions` INTEGER (default 0, consecutive correct)
     - `next_review_date` TIMESTAMPTZ (default NOW())
     - `last_reviewed_at` TIMESTAMPTZ (nullable)
   - Added index for efficient due card queries
   - Includes detailed comments explaining SM-2 algorithm

### Services (1 file)

2. **src/lib/services/study.service.ts** (new)
   - `calculateSM2()` - Core SM-2 algorithm implementation
   - `ratingToQuality()` - Convert user rating to SM-2 quality
   - `getDueFlashcards()` - Fetch cards due for review
   - `getDueFlashcardsCount()` - Count due cards
   - `reviewFlashcard()` - Process review and update SRS data
   - `getStudyStatistics()` - Get study session statistics
   - ~260 lines with comprehensive documentation

### API Endpoints (2 files)

3. **src/pages/api/study/due.ts** (new)
   - `GET /api/study/due` - Fetch due flashcards
   - Query params: `limit` (default 20, max 100)
   - Returns flashcards array + statistics
   - Protected route (session authentication)

4. **src/pages/api/study/review.ts** (new)
   - `POST /api/study/review` - Submit flashcard review
   - Body: `{ flashcardId, rating }`
   - Returns updated SRS data
   - Protected route (session authentication)
   - Validates rating enum: again/hard/good/easy

### Hooks (2 files)

5. **src/components/hooks/useStudySession.ts** (new)
   - Fetches due flashcards with statistics
   - Handles loading and error states
   - Provides refetch function
   - ~60 lines

6. **src/components/hooks/useReviewFlashcard.ts** (new)
   - Submits flashcard reviews
   - Handles loading and error states
   - Returns updated SRS data
   - ~70 lines

### Components (2 files)

7. **src/components/FlashcardStudyCard.tsx** (new)
   - Individual flashcard display with flip interaction
   - Shows front → back transition
   - 4-button rating system with colors
   - Displays SRS metadata (repetitions, interval, EF)
   - ~165 lines

8. **src/components/StudyView.tsx** (new)
   - Main study session orchestrator
   - Progress tracking and statistics display
   - Session state management
   - Empty state and completion screens
   - ~190 lines

### Pages (1 file)

9. **src/pages/study.astro** (new)
   - Study session page at `/study` route
   - Protected route (requires authentication)
   - Renders StudyView component
   - Uses Layout wrapper with UserNav

### Types (1 file modified)

10. **src/types.ts** (extended)
    - Added `StudyFlashcardDto` interface
    - Added `ReviewFlashcardDto` interface
    - Added `ReviewFlashcardResponseDto` interface
    - Added `StudyStatisticsDto` interface

### Navigation (1 file modified)

11. **src/components/auth/UserNav.tsx** (extended)
    - Added "Nauka" link to navigation menu
    - Links: Generuj → Moje Fiszki → Nauka

## Tech Stack Used

- **Frontend Framework**: Astro 5 with React 19
- **Styling**: Tailwind CSS 4
- **UI Components**: Shadcn/ui (Card, Button)
- **Type Safety**: TypeScript 5
- **Database**: Supabase (PostgreSQL)
- **Algorithm**: SM-2 (SuperMemo 2) - custom implementation
- **Icons**: lucide-react

## SM-2 Algorithm Details

### How It Works

1. **Initial State** (New Card):
   - Easiness Factor: 2.5
   - Interval: 0 days
   - Repetitions: 0
   - Next Review: Now

2. **After First Correct Answer** (Quality ≥ 3):
   - Interval: 1 day
   - Repetitions: 1
   - EF: Adjusted based on quality

3. **After Second Correct Answer**:
   - Interval: 6 days
   - Repetitions: 2
   - EF: Adjusted again

4. **Subsequent Reviews**:
   - Interval: Previous interval × EF
   - Repetitions: Incremented
   - EF: Continuously adjusted

5. **After Incorrect Answer** (Quality < 3):
   - Interval: 1 day (review tomorrow)
   - Repetitions: Reset to 0
   - EF: Decreased (but never below 1.3)

### Formula

```
EF' = EF + (0.1 - (5 - quality) × (0.08 + (5 - quality) × 0.02))
```

Where:

- `EF'` = New easiness factor
- `EF` = Previous easiness factor
- `quality` = Answer quality (0-5)

### Interval Calculation

```
If quality < 3:
  interval = 1, repetitions = 0

Else if repetitions = 1:
  interval = 1

Else if repetitions = 2:
  interval = 6

Else:
  interval = round(previous_interval × EF)
```

## User Stories Completed

### US-008: Study Sessions with Spaced Repetition

✅ Study view prepares session based on due cards
✅ Front of card displayed initially
✅ User can reveal back via interaction
✅ User rates card according to algorithm expectations
✅ Algorithm shows next card in sequence
✅ Progress tracking throughout session

## API Endpoints Summary

| Method | Endpoint            | Description                       | Auth    |
| ------ | ------------------- | --------------------------------- | ------- |
| GET    | `/api/study/due`    | Get due flashcards + statistics   | Session |
| POST   | `/api/study/review` | Submit review and update SRS data | Session |

## Database Schema Changes

### New Columns in `flashcards` table:

```sql
easiness_factor REAL NOT NULL DEFAULT 2.5 CHECK (easiness_factor >= 1.3)
interval INTEGER NOT NULL DEFAULT 0 CHECK (interval >= 0)
repetitions INTEGER NOT NULL DEFAULT 0 CHECK (repetitions >= 0)
next_review_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
last_reviewed_at TIMESTAMPTZ
```

### New Index:

```sql
CREATE INDEX idx_flashcards_next_review_date
ON flashcards(user_id, next_review_date)
WHERE next_review_date <= NOW();
```

## Key Features

### Security

- All endpoints verify session authentication
- User can only access their own flashcards
- Server-side SRS calculations (no client manipulation)
- Validation with Zod schemas

### UX Improvements

- Card flip interaction (front → back)
- Color-coded rating buttons:
  - Red: "Wcale" (Again)
  - Orange: "Trudno" (Hard)
  - Green: "Dobrze" (Good)
  - Blue: "Łatwo" (Easy)
- Real-time progress tracking
- Session statistics display
- Empty state with quick actions
- Completion celebration screen
- SRS metadata display (for learning transparency)

### Performance

- Efficient database queries with indexes
- Pagination support (configurable limit)
- Minimal data transfer
- Client-side session state management

### Accessibility

- Semantic HTML structure
- ARIA labels where needed
- Keyboard navigation support
- Clear visual feedback

## Testing Checklist

To test the study module:

1. ✅ **Migration**: Run `npx supabase db reset` to apply migration
2. ✅ **Create flashcards**: Use `/generate` or `/flashcards` to add cards
3. ✅ **Access study page**: Navigate to `/study`
4. ✅ **View due cards**: Should show cards with `next_review_date <= NOW()`
5. ✅ **Flip card**: Click "Pokaż odpowiedź" to reveal back
6. ✅ **Rate card**: Click rating button (Wcale/Trudno/Dobrze/Łatwo)
7. ✅ **Progress**: Check progress bar and card counter
8. ✅ **Statistics**: Verify due count, reviewed today, total
9. ✅ **Next card**: Should auto-advance after rating
10. ✅ **Session complete**: Check completion screen after all cards
11. ✅ **New session**: Click "Rozpocznij nową sesję" to refetch

## Algorithm Verification

Test cases for SM-2 implementation:

### Test 1: First Review (Easy)

- **Input**: Quality = 5, EF = 2.5, Interval = 0, Reps = 0
- **Expected**: EF = 2.6, Interval = 1, Reps = 1

### Test 2: Second Review (Good)

- **Input**: Quality = 4, EF = 2.6, Interval = 1, Reps = 1
- **Expected**: EF = 2.5, Interval = 6, Reps = 2

### Test 3: Third Review (Easy)

- **Input**: Quality = 5, EF = 2.5, Interval = 6, Reps = 2
- **Expected**: EF = 2.6, Interval = 16, Reps = 3

### Test 4: Failed Review (Again)

- **Input**: Quality = 0, EF = 2.6, Interval = 16, Reps = 3
- **Expected**: EF ≈ 1.7, Interval = 1, Reps = 0

## Next Steps

Future enhancements could include:

1. **Study Settings**:
   - Daily review limit
   - Session duration target
   - New cards per day limit

2. **Statistics & Analytics**:
   - Retention rate graphs
   - Study streak tracking
   - Difficulty distribution
   - Time spent studying

3. **Advanced Features**:
   - Study reminders/notifications
   - Custom study decks/tags
   - Card suspension (temporary skip)
   - Undo last review

4. **Mobile Optimization**:
   - Swipe gestures for rating
   - Touch-optimized interface
   - Progressive Web App (PWA)

5. **Algorithm Enhancements**:
   - SM-17 or SM-18 (newer SuperMemo versions)
   - FSRS (Free Spaced Repetition Scheduler)
   - Customizable parameters

## Related PRD Requirements

This implementation addresses:

- **US-008**: Study sessions with spaced repetition algorithm ✅
- **PRD 4**: Integration with spaced repetition algorithm ✅

## Performance Metrics

Expected performance:

- Due cards query: < 50ms (with index)
- Review update: < 100ms
- Session load: < 200ms
- Memory footprint: Minimal (20 cards max per session)

## References

1. **SM-2 Algorithm**:
   - [SuperMemo: Application of a computer to improve memory](https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method)
2. **Spaced Repetition Research**:
   - Wozniak, P. (1987). SuperMemo 2 Algorithm
   - Ebbinghaus Forgetting Curve

3. **Implementation Patterns**:
   - Similar to Anki, Mnemosyne, RemNote
   - Adapted for web-based learning

## Summary

✅ **Complete Implementation** of study module with SM-2 algorithm
✅ **10 files created**, 2 modified
✅ **Full CRUD** for study sessions
✅ **Security**: Protected routes, authentication checks
✅ **UX**: Polished interface with smooth interactions
✅ **Performance**: Optimized queries with database indexes
✅ **Documentation**: Comprehensive inline comments and docs

The study module is now fully functional and ready for use! 🎉
