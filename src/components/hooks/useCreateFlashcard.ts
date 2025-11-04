// src/components/hooks/useCreateFlashcard.ts
import * as React from "react";
import type { FlashcardCreatedDto } from "../../types";
import { createManualFlashcard } from "../../lib/services/flashcards.service";

interface UseCreateFlashcardResult {
  createFlashcard: (front: string, back: string) => Promise<FlashcardCreatedDto | null>;
  isCreating: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Hook to create a manual flashcard
 */
export function useCreateFlashcard(): UseCreateFlashcardResult {
  const [isCreating, setIsCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const createFlashcard = React.useCallback(
    async (front: string, back: string): Promise<FlashcardCreatedDto | null> => {
      setIsCreating(true);
      setError(null);

      try {
        // We need to use a server-side endpoint since we need Supabase client
        const response = await fetch("/api/flashcards/manual", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ front, back }),
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Not authenticated");
          }
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create flashcard");
        }

        const data: FlashcardCreatedDto = await response.json();
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        console.error("Error creating flashcard:", err);
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    []
  );

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    createFlashcard,
    isCreating,
    error,
    clearError,
  };
}
