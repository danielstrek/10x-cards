// src/components/hooks/useDeleteFlashcard.ts
import * as React from 'react';

interface UseDeleteFlashcardResult {
  deleteFlashcard: (flashcardId: number) => Promise<boolean>;
  isDeleting: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Hook to delete a flashcard
 */
export function useDeleteFlashcard(): UseDeleteFlashcardResult {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const deleteFlashcard = React.useCallback(async (flashcardId: number): Promise<boolean> => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/flashcards/${flashcardId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Not authenticated');
        }
        if (response.status === 404) {
          throw new Error('Flashcard not found');
        }
        throw new Error('Failed to delete flashcard');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error deleting flashcard:', err);
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    deleteFlashcard,
    isDeleting,
    error,
    clearError,
  };
}

