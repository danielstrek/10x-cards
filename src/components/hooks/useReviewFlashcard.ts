// src/components/hooks/useReviewFlashcard.ts
import * as React from 'react';
import type { ReviewFlashcardResponseDto } from '../../types';

interface UseReviewFlashcardResult {
  reviewFlashcard: (
    flashcardId: number,
    rating: 'again' | 'hard' | 'good' | 'easy'
  ) => Promise<ReviewFlashcardResponseDto | null>;
  isReviewing: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Hook to review a flashcard
 */
export function useReviewFlashcard(): UseReviewFlashcardResult {
  const [isReviewing, setIsReviewing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const reviewFlashcard = React.useCallback(async (
    flashcardId: number,
    rating: 'again' | 'hard' | 'good' | 'easy'
  ): Promise<ReviewFlashcardResponseDto | null> => {
    setIsReviewing(true);
    setError(null);

    try {
      const response = await fetch('/api/study/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ flashcardId, rating }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Not authenticated');
        }
        if (response.status === 404) {
          throw new Error('Flashcard not found');
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to review flashcard');
      }

      const data: ReviewFlashcardResponseDto = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error reviewing flashcard:', err);
      return null;
    } finally {
      setIsReviewing(false);
    }
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    reviewFlashcard,
    isReviewing,
    error,
    clearError,
  };
}

