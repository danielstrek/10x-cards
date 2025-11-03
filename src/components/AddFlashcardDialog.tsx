// src/components/AddFlashcardDialog.tsx
import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { PlusIcon } from 'lucide-react';

interface AddFlashcardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (front: string, back: string) => Promise<void>;
  isCreating: boolean;
}

export function AddFlashcardDialog({ 
  open, 
  onOpenChange, 
  onCreate, 
  isCreating 
}: AddFlashcardDialogProps) {
  const [front, setFront] = React.useState('');
  const [back, setBack] = React.useState('');
  const [validationError, setValidationError] = React.useState<string | null>(null);

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      setFront('');
      setBack('');
      setValidationError(null);
    }
  }, [open]);

  const handleCreate = async () => {
    // Validate
    if (!front.trim() || !back.trim()) {
      setValidationError('Both front and back must not be empty');
      return;
    }

    if (front.length > 200) {
      setValidationError('Front must be at most 200 characters');
      return;
    }

    if (back.length > 500) {
      setValidationError('Back must be at most 500 characters');
      return;
    }

    setValidationError(null);

    await onCreate(front, back);
    
    // Close dialog on success
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Flashcard</DialogTitle>
          <DialogDescription>
            Add a new flashcard manually. Fill in both the front and back of the card.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label htmlFor="new-front" className="text-sm font-semibold text-muted-foreground mb-2 block">
              Front ({front.length}/200)
            </label>
            <Textarea
              id="new-front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              maxLength={200}
              rows={3}
              className="resize-none"
              placeholder="Enter the question or prompt..."
              aria-label="Front of flashcard"
            />
          </div>
          <div>
            <label htmlFor="new-back" className="text-sm font-semibold text-muted-foreground mb-2 block">
              Back ({back.length}/500)
            </label>
            <Textarea
              id="new-back"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              maxLength={500}
              rows={4}
              className="resize-none"
              placeholder="Enter the answer or explanation..."
              aria-label="Back of flashcard"
            />
          </div>

          {/* Validation error */}
          {validationError && (
            <p className="text-sm text-red-600" role="alert">
              {validationError}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating}
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            {isCreating ? 'Creating...' : 'Create Flashcard'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

