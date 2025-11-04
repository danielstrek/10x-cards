// src/components/hooks/useGenerateFlashcards.ts
import { useState } from "react";
import type { CreateGenerationResponseDto } from "../../types";
import type { FlashcardProposalViewModel, GenerateFlashcardsCommand } from "../types";

interface UseGenerateFlashcardsResult {
  isLoading: boolean;
  error: string | null;
  generationId: number | null;
  flashcards: FlashcardProposalViewModel[];
  generateFlashcards: (command: GenerateFlashcardsCommand) => Promise<void>;
  clearError: () => void;
}

/**
 * Custom hook for generating flashcards from source text
 * Manages the API call state and transforms responses to view models
 */
export function useGenerateFlashcards(): UseGenerateFlashcardsResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<number | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardProposalViewModel[]>([]);

  const clearError = () => {
    setError(null);
  };

  const generateFlashcards = async (command: GenerateFlashcardsCommand) => {
    // Reset state
    setIsLoading(true);
    setError(null);
    setFlashcards([]);
    setGenerationId(null);

    try {
      // Get auth token from localStorage or sessionStorage
      const token = localStorage.getItem("sb-access-token") || sessionStorage.getItem("sb-access-token");

      if (!token) {
        throw new Error("Not authenticated. Please log in first.");
      }

      // Call API
      const response = await fetch("/api/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(command),
      });

      // Handle non-OK responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: "Unknown Error",
          message: `Server returned ${response.status}`,
        }));

        throw new Error(errorData.message || errorData.error || `Request failed with status ${response.status}`);
      }

      // Parse successful response
      const data: CreateGenerationResponseDto = await response.json();

      // Transform proposals to view models
      const viewModels: FlashcardProposalViewModel[] = data.proposals.map((proposal) => ({
        proposalId: proposal.proposalId,
        front: proposal.front,
        back: proposal.back,
        source: "ai-full" as const,
        accepted: false,
        edited: false,
      }));

      // Update state with results
      setGenerationId(data.generationId);
      setFlashcards(viewModels);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      console.error("Error generating flashcards:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    generationId,
    flashcards,
    generateFlashcards,
    clearError,
  };
}
