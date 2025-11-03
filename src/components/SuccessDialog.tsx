// src/components/SuccessDialog.tsx
import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SuccessDialogProps {
  open: boolean;
  onClose: () => void;
  savedCount: number;
}

export function SuccessDialog({ open, onClose, savedCount }: SuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent data-test-id="success-dialog">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-green-600 dark:text-green-400"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <DialogTitle className="text-center">Flashcards Saved Successfully!</DialogTitle>
          <DialogDescription className="text-center">
            {savedCount} flashcard{savedCount !== 1 ? 's have' : ' has'} been saved to your collection.
            You can now study them in your flashcard deck.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button onClick={onClose} className="w-full sm:w-auto" data-test-id="success-dialog-continue-button">
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

