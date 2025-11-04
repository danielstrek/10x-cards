// src/components/hooks/useStudySession.ts
import * as React from "react";
import type { StudyFlashcardDto, StudyStatisticsDto } from "../../types";

interface DueFlashcardsResponse {
  flashcards: StudyFlashcardDto[];
  statistics: StudyStatisticsDto;
}

interface UseStudySessionResult {
  flashcards: StudyFlashcardDto[];
  statistics: StudyStatisticsDto | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch due flashcards for study session
 */
export function useStudySession(limit = 20): UseStudySessionResult {
  const [flashcards, setFlashcards] = React.useState<StudyFlashcardDto[]>([]);
  const [statistics, setStatistics] = React.useState<StudyStatisticsDto | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchDueFlashcards = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/study/due?limit=${limit}`, {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        throw new Error("Failed to fetch due flashcards");
      }

      const data: DueFlashcardsResponse = await response.json();
      setFlashcards(data.flashcards);
      setStatistics(data.statistics);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error fetching due flashcards:", err);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  React.useEffect(() => {
    fetchDueFlashcards();
  }, [fetchDueFlashcards]);

  return {
    flashcards,
    statistics,
    isLoading,
    error,
    refetch: fetchDueFlashcards,
  };
}
