// src/components/types.ts
// View models and component-specific types for the flashcard generation view

/**
 * View model for a flashcard proposal with UI state
 */
export interface FlashcardProposalViewModel {
  /** Unique identifier for the proposal (frontend-only) */
  proposalId: string;
  /** Front side of the flashcard (question) */
  front: string;
  /** Back side of the flashcard (answer) */
  back: string;
  /** Source type - dynamically set based on user actions */
  source: "ai-full" | "ai-edited";
  /** Whether the proposal has been accepted by the user */
  accepted: boolean;
  /** Whether the proposal has been edited by the user */
  edited: boolean;
}

/**
 * Command to generate flashcards from source text
 */
export interface GenerateFlashcardsCommand {
  sourceText: string;
  model: string;
}
