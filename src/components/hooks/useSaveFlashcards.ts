// src/components/hooks/useSaveFlashcards.ts
import { useState } from 'react';
import type { BulkCreateFlashcardsResponseDto } from '../../types';
import type { FlashcardProposalViewModel } from '../types';

interface UseSaveFlashcardsResult {
  isSaving: boolean;
  saveError: string | null;
  savedCount: number | null;
  saveFlashcards: (
    flashcards: FlashcardProposalViewModel[],
    generationId: number
  ) => Promise<boolean>;
  clearSaveError: () => void;
}

/**
 * Custom hook for saving flashcards to the database
 * Manages the API call state for bulk creating flashcards
 */
export function useSaveFlashcards(): UseSaveFlashcardsResult {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  const clearSaveError = () => {
    setSaveError(null);
  };

  const saveFlashcards = async (
    flashcards: FlashcardProposalViewModel[],
    generationId: number
  ): Promise<boolean> => {
    // Validation
    if (!flashcards || flashcards.length === 0) {
      setSaveError('No flashcards to save');
      return false;
    }

    if (!generationId) {
      setSaveError('Generation ID is required');
      return false;
    }

    // Reset state
    setIsSaving(true);
    setSaveError(null);
    setSavedCount(null);

    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('Not authenticated. Please log in first.');
      }

      // Transform view models to API format
      const flashcardsToSave = flashcards.map(card => ({
        front: card.front,
        back: card.back,
        source: card.source,
      }));

      // Call API
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          generationId,
          flashcards: flashcardsToSave,
        }),
      });

      // Handle non-OK responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Unknown Error',
          message: `Server returned ${response.status}`,
        }));

        throw new Error(
          errorData.message || errorData.error || `Request failed with status ${response.status}`
        );
      }

      // Parse successful response
      const data: BulkCreateFlashcardsResponseDto = await response.json();

      // Update state with results
      setSavedCount(data.created.length);

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save flashcards';
      setSaveError(errorMessage);
      console.error('Error saving flashcards:', err);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    saveError,
    savedCount,
    saveFlashcards,
    clearSaveError,
  };
}

