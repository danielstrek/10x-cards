// src/components/BulkSaveButton.tsx
import * as React from "react";
import { Button } from "@/components/ui/button";
import type { FlashcardProposalViewModel } from "./types";

interface BulkSaveButtonProps {
  flashcards: FlashcardProposalViewModel[];
  onSaveAll: () => void;
  onSaveAccepted: () => void;
  isSaving?: boolean;
  disabled?: boolean;
}

export function BulkSaveButton({
  flashcards,
  onSaveAll,
  onSaveAccepted,
  isSaving = false,
  disabled = false,
}: BulkSaveButtonProps) {
  const acceptedCount = flashcards.filter((card) => card.accepted).length;
  const totalCount = flashcards.length;

  const canSaveAll = totalCount > 0 && !isSaving && !disabled;
  const canSaveAccepted = acceptedCount > 0 && !isSaving && !disabled;

  return (
    <div
      className="flex flex-col sm:flex-row gap-3 p-4 bg-muted/50 rounded-lg border"
      role="region"
      aria-label="Save flashcards section"
    >
      <div className="flex-1">
        <h3 className="text-sm font-semibold mb-1">Save Flashcards</h3>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {totalCount} total flashcard{totalCount !== 1 ? "s" : ""} • {acceptedCount} accepted
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Button
          onClick={onSaveAccepted}
          disabled={!canSaveAccepted}
          variant="default"
          size="default"
          aria-busy={isSaving}
          aria-label={`Save ${acceptedCount} accepted flashcard${acceptedCount !== 1 ? "s" : ""} to database`}
          className="w-full sm:w-auto"
          data-test-id="save-accepted-button"
        >
          {isSaving ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 mr-2"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Save Accepted ({acceptedCount})
            </>
          )}
        </Button>

        <Button
          onClick={onSaveAll}
          disabled={!canSaveAll}
          variant="outline"
          size="default"
          aria-busy={isSaving}
          aria-label={`Save all ${totalCount} flashcard${totalCount !== 1 ? "s" : ""} to database`}
          className="w-full sm:w-auto"
          data-test-id="save-all-button"
        >
          {isSaving ? (
            "Saving..."
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 mr-2"
                aria-hidden="true"
              >
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Save All ({totalCount})
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
