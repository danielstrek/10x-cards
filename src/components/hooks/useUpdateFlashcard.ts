// src/components/hooks/useUpdateFlashcard.ts
import * as React from "react";
import type { UpdateFlashcardDto, FlashcardDetailDto } from "../../types";

interface UseUpdateFlashcardResult {
  updateFlashcard: (flashcardId: number, dto: UpdateFlashcardDto) => Promise<FlashcardDetailDto | null>;
  isUpdating: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Hook to update a flashcard
 */
export function useUpdateFlashcard(): UseUpdateFlashcardResult {
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const updateFlashcard = React.useCallback(
    async (flashcardId: number, dto: UpdateFlashcardDto): Promise<FlashcardDetailDto | null> => {
      setIsUpdating(true);
      setError(null);

      try {
        const response = await fetch(`/api/flashcards/${flashcardId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(dto),
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Not authenticated");
          }
          if (response.status === 404) {
            throw new Error("Flashcard not found");
          }
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update flashcard");
        }

        const data: FlashcardDetailDto = await response.json();
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        console.error("Error updating flashcard:", err);
        return null;
      } finally {
        setIsUpdating(false);
      }
    },
    []
  );

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    updateFlashcard,
    isUpdating,
    error,
    clearError,
  };
}
