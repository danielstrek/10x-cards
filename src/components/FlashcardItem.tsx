// src/components/FlashcardItem.tsx
import * as React from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { PencilIcon, TrashIcon, SaveIcon, XIcon } from 'lucide-react';
import type { FlashcardListItemDto } from '../types';

interface FlashcardItemProps {
  flashcard: FlashcardListItemDto;
  onUpdate: (flashcardId: number, front: string, back: string) => Promise<void>;
  onDelete: (flashcardId: number) => Promise<void>;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function FlashcardItem({ 
  flashcard, 
  onUpdate, 
  onDelete, 
  isUpdating, 
  isDeleting 
}: FlashcardItemProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedFront, setEditedFront] = React.useState(flashcard.front);
  const [editedBack, setEditedBack] = React.useState(flashcard.back);
  const [validationError, setValidationError] = React.useState<string | null>(null);

  // Reset edited values when flashcard changes
  React.useEffect(() => {
    setEditedFront(flashcard.front);
    setEditedBack(flashcard.back);
  }, [flashcard.front, flashcard.back]);

  const handleEdit = () => {
    setIsEditing(true);
    setValidationError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedFront(flashcard.front);
    setEditedBack(flashcard.back);
    setValidationError(null);
  };

  const handleSave = async () => {
    // Validate
    if (!editedFront.trim() || !editedBack.trim()) {
      setValidationError('Both front and back must not be empty');
      return;
    }

    if (editedFront.length > 200) {
      setValidationError('Front must be at most 200 characters');
      return;
    }

    if (editedBack.length > 500) {
      setValidationError('Back must be at most 500 characters');
      return;
    }

    setValidationError(null);

    await onUpdate(flashcard.id, editedFront, editedBack);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this flashcard?')) {
      await onDelete(flashcard.id);
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'ai-full':
        return <span className="text-xs px-2 py-1 rounded-md bg-blue-100 text-blue-700">AI Generated</span>;
      case 'ai-edited':
        return <span className="text-xs px-2 py-1 rounded-md bg-purple-100 text-purple-700">AI Edited</span>;
      case 'manual':
        return <span className="text-xs px-2 py-1 rounded-md bg-green-100 text-green-700">Manual</span>;
      default:
        return null;
    }
  };

  return (
    <Card className="relative" data-test-id="flashcard-card">
      <CardContent className="pt-6">
        {/* Source badge */}
        <div className="absolute top-3 right-3">
          {getSourceBadge(flashcard.source)}
        </div>

        {/* Display mode */}
        {!isEditing ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Front</h3>
              <p className="text-base">{flashcard.front}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Back</h3>
              <p className="text-base">{flashcard.back}</p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                disabled={isUpdating || isDeleting}
                data-test-id="flashcard-card-edit-button"
              >
                <PencilIcon className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isUpdating || isDeleting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                data-test-id="flashcard-card-delete-button"
              >
                <TrashIcon className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        ) : (
          /* Edit mode */
          <div className="space-y-4">
            <div>
              <label htmlFor={`front-${flashcard.id}`} className="text-sm font-semibold text-muted-foreground mb-2 block">
                Front ({editedFront.length}/200)
              </label>
              <Textarea
                id={`front-${flashcard.id}`}
                value={editedFront}
                onChange={(e) => setEditedFront(e.target.value)}
                maxLength={200}
                rows={3}
                className="resize-none"
                aria-label="Front of flashcard"
                data-test-id="flashcard-card-edit-front-input"
              />
            </div>
            <div>
              <label htmlFor={`back-${flashcard.id}`} className="text-sm font-semibold text-muted-foreground mb-2 block">
                Back ({editedBack.length}/500)
              </label>
              <Textarea
                id={`back-${flashcard.id}`}
                value={editedBack}
                onChange={(e) => setEditedBack(e.target.value)}
                maxLength={500}
                rows={4}
                className="resize-none"
                aria-label="Back of flashcard"
                data-test-id="flashcard-card-edit-back-input"
              />
            </div>

            {/* Validation error */}
            {validationError && (
              <p className="text-sm text-red-600" role="alert">
                {validationError}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isUpdating}
                data-test-id="flashcard-card-save-button"
              >
                <SaveIcon className="mr-2 h-4 w-4" />
                {isUpdating ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isUpdating}
                data-test-id="flashcard-card-cancel-button"
              >
                <XIcon className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

