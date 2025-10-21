// src/components/FlashcardListItem.tsx
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { FlashcardProposalViewModel } from './types';

interface FlashcardListItemProps {
  flashcard: FlashcardProposalViewModel;
  onAccept: (proposalId: string) => void;
  onEdit: (proposalId: string, front: string, back: string) => void;
  onReject: (proposalId: string) => void;
}

const MAX_FRONT_LENGTH = 200;
const MAX_BACK_LENGTH = 500;

export function FlashcardListItem({
  flashcard,
  onAccept,
  onEdit,
  onReject,
}: FlashcardListItemProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedFront, setEditedFront] = React.useState(flashcard.front);
  const [editedBack, setEditedBack] = React.useState(flashcard.back);

  // Validation for edited content
  const isFrontValid = editedFront.trim().length > 0 && editedFront.length <= MAX_FRONT_LENGTH;
  const isBackValid = editedBack.trim().length > 0 && editedBack.length <= MAX_BACK_LENGTH;
  const canSaveEdit = isFrontValid && isBackValid;

  // Reset edited content when flashcard changes
  React.useEffect(() => {
    setEditedFront(flashcard.front);
    setEditedBack(flashcard.back);
  }, [flashcard.front, flashcard.back]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedFront(flashcard.front);
    setEditedBack(flashcard.back);
  };

  const handleSaveEdit = () => {
    if (!canSaveEdit) {
      return;
    }
    onEdit(flashcard.proposalId, editedFront.trim(), editedBack.trim());
    setIsEditing(false);
  };

  const handleAccept = () => {
    onAccept(flashcard.proposalId);
  };

  const handleReject = () => {
    onReject(flashcard.proposalId);
  };

  return (
    <Card
      className={cn(
        'transition-all',
        flashcard.accepted && 'border-green-600 bg-green-50 dark:bg-green-950/20',
        flashcard.edited && 'border-blue-600'
      )}
      role="article"
      aria-label={`Flashcard: ${flashcard.front.substring(0, 50)}${flashcard.front.length > 50 ? '...' : ''}`}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-base">
            {flashcard.accepted && (
              <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 mr-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Accepted
              </span>
            )}
            {flashcard.edited && !flashcard.accepted && (
              <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 mr-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edited
              </span>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Front side */}
        <div className="space-y-2">
          <label htmlFor={`front-${flashcard.proposalId}`} className="text-sm font-medium">
            Front (Question)
          </label>
          {isEditing ? (
            <div className="space-y-1">
              <Input
                id={`front-${flashcard.proposalId}`}
                value={editedFront}
                onChange={(e) => setEditedFront(e.target.value)}
                maxLength={MAX_FRONT_LENGTH}
                className={cn(
                  !isFrontValid && 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/50'
                )}
                aria-invalid={!isFrontValid}
                aria-describedby={`front-char-count-${flashcard.proposalId}`}
              />
              <p
                id={`front-char-count-${flashcard.proposalId}`}
                className={cn(
                  'text-xs',
                  !isFrontValid ? 'text-destructive' : 'text-muted-foreground'
                )}
                aria-live="polite"
              >
                {editedFront.length} / {MAX_FRONT_LENGTH}
              </p>
            </div>
          ) : (
            <p className="text-sm bg-muted p-3 rounded-md">{flashcard.front}</p>
          )}
        </div>

        {/* Back side */}
        <div className="space-y-2">
          <label htmlFor={`back-${flashcard.proposalId}`} className="text-sm font-medium">
            Back (Answer)
          </label>
          {isEditing ? (
            <div className="space-y-1">
              <Textarea
                id={`back-${flashcard.proposalId}`}
                value={editedBack}
                onChange={(e) => setEditedBack(e.target.value)}
                maxLength={MAX_BACK_LENGTH}
                className={cn(
                  'min-h-[100px]',
                  !isBackValid && 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/50'
                )}
                aria-invalid={!isBackValid}
                aria-describedby={`back-char-count-${flashcard.proposalId}`}
              />
              <p
                id={`back-char-count-${flashcard.proposalId}`}
                className={cn(
                  'text-xs',
                  !isBackValid ? 'text-destructive' : 'text-muted-foreground'
                )}
                aria-live="polite"
              >
                {editedBack.length} / {MAX_BACK_LENGTH}
              </p>
            </div>
          ) : (
            <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">{flashcard.back}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-2" role="group" aria-label="Flashcard actions">
          {isEditing ? (
            <>
              <Button
                onClick={handleSaveEdit}
                disabled={!canSaveEdit}
                size="sm"
                variant="default"
                aria-label="Save edited flashcard"
              >
                Save Changes
              </Button>
              <Button
                onClick={handleCancelEdit}
                size="sm"
                variant="outline"
                aria-label="Cancel editing"
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleAccept}
                size="sm"
                variant={flashcard.accepted ? 'secondary' : 'default'}
                disabled={flashcard.accepted}
                aria-label={flashcard.accepted ? 'Flashcard already accepted' : 'Accept this flashcard'}
                aria-pressed={flashcard.accepted}
              >
                {flashcard.accepted ? 'Accepted' : 'Accept'}
              </Button>
              <Button
                onClick={handleEditClick}
                size="sm"
                variant="outline"
                aria-label="Edit this flashcard"
              >
                Edit
              </Button>
              <Button
                onClick={handleReject}
                size="sm"
                variant="destructive"
                aria-label="Reject and remove this flashcard"
              >
                Reject
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

