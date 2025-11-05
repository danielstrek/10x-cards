// src/components/StudyView.tsx
import * as React from "react";
import { Button } from "./ui/button";
import { FlashcardStudyCard } from "./FlashcardStudyCard";
import { ErrorNotification } from "./ErrorNotification";
import { SkeletonLoader } from "./SkeletonLoader";
import { useStudySession } from "./hooks/useStudySession";
import { useReviewFlashcard } from "./hooks/useReviewFlashcard";
import { CheckCircleIcon, BookOpenIcon, TrophyIcon } from "lucide-react";
import type { StudyFlashcardDto } from "../types";

export default function StudyView() {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [reviewedCount, setReviewedCount] = React.useState(0);
  const [sessionFlashcards, setSessionFlashcards] = React.useState<StudyFlashcardDto[]>([]);

  // Fetch due flashcards
  const { flashcards, statistics, isLoading, error: fetchError, refetch } = useStudySession(20);

  // Review flashcard hook
  const { reviewFlashcard, isReviewing, error: reviewError, clearError: clearReviewError } = useReviewFlashcard();

  // Initialize session flashcards when data loads
  React.useEffect(() => {
    if (flashcards.length > 0 && sessionFlashcards.length === 0) {
      setSessionFlashcards(flashcards);
    }
  }, [flashcards, sessionFlashcards.length]);

  // Handle rating
  const handleRate = React.useCallback(
    async (rating: "again" | "hard" | "good" | "easy") => {
      const currentFlashcard = sessionFlashcards[currentIndex];
      if (!currentFlashcard) return;

      const result = await reviewFlashcard(currentFlashcard.id, rating);

      if (result) {
        setReviewedCount((prev) => prev + 1);

        // Move to next card
        if (currentIndex < sessionFlashcards.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          // Session complete - refetch to get new due cards
          await refetch();
          setCurrentIndex(0);
          setReviewedCount(0);
        }
      }
    },
    [currentIndex, sessionFlashcards, reviewFlashcard, refetch]
  );

  // Handle restart session
  const handleRestartSession = React.useCallback(async () => {
    setCurrentIndex(0);
    setReviewedCount(0);
    await refetch();
  }, [refetch]);

  const currentFlashcard = sessionFlashcards[currentIndex];
  const error = fetchError || reviewError;

  // Clear errors
  const clearAllErrors = React.useCallback(() => {
    clearReviewError();
  }, [clearReviewError]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-8 px-4">
      <div className="container mx-auto max-w-4xl space-y-6">
        {/* Header with statistics */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Sesja Nauki</h1>

          {statistics && (
            <div className="flex justify-center gap-6 text-sm" data-test-id="study-statistics">
              <div className="flex items-center gap-2">
                <BookOpenIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Do nauki:{" "}
                  <strong className="text-foreground" data-test-id="study-due-count">
                    {statistics.due}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Dzisiaj:{" "}
                  <strong className="text-foreground" data-test-id="study-reviewed-today-count">
                    {statistics.reviewedToday}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrophyIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Łącznie:{" "}
                  <strong className="text-foreground" data-test-id="study-total-count">
                    {statistics.total}
                  </strong>
                </span>
              </div>
            </div>
          )}

          {/* Progress */}
          {sessionFlashcards.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground" data-test-id="study-progress-text">
                Fiszka {currentIndex + 1} z {sessionFlashcards.length}
              </p>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{
                    width: `${((currentIndex + 1) / sessionFlashcards.length) * 100}%`,
                  }}
                  data-test-id="study-progress-bar"
                />
              </div>
            </div>
          )}
        </div>

        {/* Error notification */}
        {error && (
          <div data-test-id="study-error-notification">
            <ErrorNotification message={error} />
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-4" data-test-id="study-loading-indicator">
            <SkeletonLoader count={1} />
          </div>
        )}

        {/* No cards state */}
        {!isLoading && sessionFlashcards.length === 0 && (
          <div className="text-center py-12" data-test-id="study-empty-state">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <CheckCircleIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Świetna robota!</h2>
            <p className="text-muted-foreground mb-6">
              Nie masz fiszek do powtórki. Wróć później lub dodaj nowe fiszki.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleRestartSession} data-test-id="study-refresh-button">
                Odśwież
              </Button>
              <Button variant="outline" asChild>
                <a href="/flashcards">Moje Fiszki</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/generate">Generuj Nowe</a>
              </Button>
            </div>
          </div>
        )}

        {/* Study card */}
        {!isLoading && currentFlashcard && (
          <FlashcardStudyCard flashcard={currentFlashcard} onRate={handleRate} isRating={isReviewing} />
        )}

        {/* Session complete */}
        {!isLoading && reviewedCount > 0 && currentIndex >= sessionFlashcards.length && (
          <div className="text-center py-12" data-test-id="study-session-complete">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
              <TrophyIcon className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Sesja zakończona!</h2>
            <p className="text-muted-foreground mb-6">Przejrzałeś {reviewedCount} fiszek. Świetna robota!</p>
            <Button onClick={handleRestartSession} data-test-id="study-restart-button">
              Rozpocznij nową sesję
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
