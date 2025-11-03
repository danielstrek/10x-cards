// src/components/FlashcardList.tsx
import * as React from 'react';
import { FlashcardListItem } from './FlashcardListItem';
import type { FlashcardProposalViewModel } from './types';

interface FlashcardListProps {
  flashcards: FlashcardProposalViewModel[];
  onAccept: (proposalId: string) => void;
  onEdit: (proposalId: string, front: string, back: string) => void;
  onReject: (proposalId: string) => void;
}

export function FlashcardList({
  flashcards,
  onAccept,
  onEdit,
  onReject,
}: FlashcardListProps) {
  if (flashcards.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No flashcards to display.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" role="list" aria-label="Generated flashcards" data-test-id="flashcard-list">
      {flashcards.map((flashcard) => (
        <div key={flashcard.proposalId} role="listitem">
          <FlashcardListItem
            flashcard={flashcard}
            onAccept={onAccept}
            onEdit={onEdit}
            onReject={onReject}
          />
        </div>
      ))}
    </div>
  );
}

