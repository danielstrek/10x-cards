// src/components/FlashcardsView.tsx
import * as React from 'react';
import { Button } from './ui/button';
import { FlashcardItem } from './FlashcardItem';
import { AddFlashcardDialog } from './AddFlashcardDialog';
import { ErrorNotification } from './ErrorNotification';
import { SkeletonLoader } from './SkeletonLoader';
import { useFlashcards } from './hooks/useFlashcards';
import { useUpdateFlashcard } from './hooks/useUpdateFlashcard';
import { useDeleteFlashcard } from './hooks/useDeleteFlashcard';
import { useCreateFlashcard } from './hooks/useCreateFlashcard';
import { PlusIcon } from 'lucide-react';

export default function FlashcardsView() {
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);

  // Fetch flashcards
  const { 
    flashcards, 
    isLoading, 
    error: fetchError, 
    total,
    refetch 
  } = useFlashcards();

  // Update flashcard hook
  const { 
    updateFlashcard, 
    isUpdating, 
    error: updateError,
    clearError: clearUpdateError 
  } = useUpdateFlashcard();

  // Delete flashcard hook
  const { 
    deleteFlashcard, 
    isDeleting, 
    error: deleteError,
    clearError: clearDeleteError 
  } = useDeleteFlashcard();

  // Create flashcard hook
  const { 
    createFlashcard, 
    isCreating, 
    error: createError,
    clearError: clearCreateError 
  } = useCreateFlashcard();

  // Handle update
  const handleUpdate = React.useCallback(async (
    flashcardId: number, 
    front: string, 
    back: string
  ) => {
    const result = await updateFlashcard(flashcardId, { front, back });
    if (result) {
      // Refetch to get updated data
      await refetch();
    }
  }, [updateFlashcard, refetch]);

  // Handle delete
  const handleDelete = React.useCallback(async (flashcardId: number) => {
    const result = await deleteFlashcard(flashcardId);
    if (result) {
      // Refetch to remove deleted item
      await refetch();
    }
  }, [deleteFlashcard, refetch]);

  // Handle create
  const handleCreate = React.useCallback(async (front: string, back: string) => {
    const result = await createFlashcard(front, back);
    if (result) {
      // Refetch to show new flashcard
      await refetch();
    }
  }, [createFlashcard, refetch]);

  // Combined error
  const error = fetchError || updateError || deleteError || createError;

  // Clear all errors
  const clearAllErrors = React.useCallback(() => {
    clearUpdateError();
    clearDeleteError();
    clearCreateError();
  }, [clearUpdateError, clearDeleteError, clearCreateError]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-8 px-4">
      <div className="container mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Flashcards</h1>
            <p className="text-muted-foreground mt-1" data-test-id="flashcards-total-count">
              {total > 0 ? `${total} flashcard${total !== 1 ? 's' : ''} total` : 'No flashcards yet'}
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} data-test-id="flashcards-add-button">
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Flashcard
          </Button>
        </div>

        {/* Error notification */}
        {error && (
          <div data-test-id="flashcards-error-notification">
            <ErrorNotification 
              message={error}
            />
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div data-test-id="flashcards-loading-indicator">
            <SkeletonLoader count={3} />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && flashcards.length === 0 && (
          <div className="text-center py-12" data-test-id="flashcards-empty-state">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <PlusIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No flashcards yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first flashcard or generate some using AI on the{' '}
              <a href="/generate" className="text-primary hover:underline">
                generate page
              </a>
              .
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} data-test-id="flashcards-empty-create-button">
              <PlusIcon className="mr-2 h-4 w-4" />
              Create First Flashcard
            </Button>
          </div>
        )}

        {/* Flashcards list */}
        {!isLoading && flashcards.length > 0 && (
          <div className="space-y-4" role="list" aria-label="Flashcards list" data-test-id="flashcards-list">
            {flashcards.map((flashcard) => (
              <div key={flashcard.id} role="listitem">
                <FlashcardItem
                  flashcard={flashcard}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  isUpdating={isUpdating}
                  isDeleting={isDeleting}
                />
              </div>
            ))}
          </div>
        )}

        {/* Add flashcard dialog */}
        <AddFlashcardDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onCreate={handleCreate}
          isCreating={isCreating}
        />
      </div>
    </div>
  );
}

