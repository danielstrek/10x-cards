// src/components/hooks/useFlashcards.ts
import * as React from 'react';
import type { FlashcardListItemDto, FlashcardListResponseDto } from '../../types';

interface UseFlashcardsResult {
  flashcards: FlashcardListItemDto[];
  isLoading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch user's flashcards
 */
export function useFlashcards(initialPage: number = 1, initialLimit: number = 50): UseFlashcardsResult {
  const [flashcards, setFlashcards] = React.useState<FlashcardListItemDto[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [total, setTotal] = React.useState(0);
  const [page] = React.useState(initialPage);
  const [limit] = React.useState(initialLimit);

  const fetchFlashcards = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/flashcards?page=${page}&limit=${limit}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Not authenticated');
        }
        throw new Error('Failed to fetch flashcards');
      }

      const data: FlashcardListResponseDto = await response.json();
      setFlashcards(data.data);
      setTotal(data.total);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching flashcards:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit]);

  React.useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  return {
    flashcards,
    isLoading,
    error,
    total,
    page,
    limit,
    refetch: fetchFlashcards,
  };
}

