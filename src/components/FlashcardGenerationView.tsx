// src/components/FlashcardGenerationView.tsx
import * as React from 'react';
import { TextInputArea } from './TextInputArea';
import { GenerateButton } from './GenerateButton';
import { ErrorNotification } from './ErrorNotification';
import { SkeletonLoader } from './SkeletonLoader';
import { FlashcardList } from './FlashcardList';
import { BulkSaveButton } from './BulkSaveButton';
import { SuccessDialog } from './SuccessDialog';
import { useGenerateFlashcards } from './hooks/useGenerateFlashcards';
import { useSaveFlashcards } from './hooks/useSaveFlashcards';
import type { FlashcardProposalViewModel } from './types';

const MIN_TEXT_LENGTH = 1000;
const MAX_TEXT_LENGTH = 10000;
const DEFAULT_MODEL = 'openai/gpt-4o-mini';

export default function FlashcardGenerationView() {
  // State management
  const [sourceText, setSourceText] = React.useState('');
  const [localFlashcards, setLocalFlashcards] = React.useState<FlashcardProposalViewModel[]>([]);
  
  // Use custom hooks for API operations
  const {
    isLoading,
    error: errorMessage,
    generationId,
    flashcards,
    generateFlashcards,
  } = useGenerateFlashcards();

  const {
    isSaving,
    saveError,
    savedCount,
    saveFlashcards,
    clearSaveError,
  } = useSaveFlashcards();

  // State for success dialog
  const [showSuccessDialog, setShowSuccessDialog] = React.useState(false);

  // Sync flashcards from hook to local state
  React.useEffect(() => {
    setLocalFlashcards(flashcards);
  }, [flashcards]);

  // Validation
  const isTextValid = sourceText.length >= MIN_TEXT_LENGTH && sourceText.length <= MAX_TEXT_LENGTH;
  const canGenerate = isTextValid && !isLoading;

  // Handler for generating flashcards
  const handleGenerate = async () => {
    if (!canGenerate) {
      return;
    }

    await generateFlashcards({
      sourceText,
      model: DEFAULT_MODEL,
    });
  };

  // Handler for accepting a flashcard
  const handleAccept = (proposalId: string) => {
    setLocalFlashcards((prev) =>
      prev.map((card) =>
        card.proposalId === proposalId
          ? { ...card, accepted: true }
          : card
      )
    );
  };

  // Handler for editing a flashcard
  const handleEdit = (proposalId: string, front: string, back: string) => {
    setLocalFlashcards((prev) =>
      prev.map((card) =>
        card.proposalId === proposalId
          ? { ...card, front, back, edited: true, source: 'ai-edited' }
          : card
      )
    );
  };

  // Handler for rejecting a flashcard
  const handleReject = (proposalId: string) => {
    setLocalFlashcards((prev) =>
      prev.filter((card) => card.proposalId !== proposalId)
    );
  };

  // Handler for saving all flashcards
  const handleSaveAll = async () => {
    if (!generationId) {
      console.error('No generation ID available');
      return;
    }

    const success = await saveFlashcards(localFlashcards, generationId);
    
    if (success) {
      setShowSuccessDialog(true);
    }
  };

  // Handler for saving only accepted flashcards
  const handleSaveAccepted = async () => {
    if (!generationId) {
      console.error('No generation ID available');
      return;
    }

    const acceptedFlashcards = localFlashcards.filter(card => card.accepted);
    
    if (acceptedFlashcards.length === 0) {
      return;
    }

    const success = await saveFlashcards(acceptedFlashcards, generationId);
    
    if (success) {
      setShowSuccessDialog(true);
    }
  };

  // Handler for closing success dialog
  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false);
    // Optionally reset the form
    setSourceText('');
    setLocalFlashcards([]);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Generate Flashcards</h1>
          <p className="text-muted-foreground">
            Paste your study material and let AI generate flashcards for you.
          </p>
        </div>

        {/* Error notifications */}
        {errorMessage && (
          <ErrorNotification message={errorMessage} title="Generation Error" />
        )}
        
        {saveError && (
          <ErrorNotification message={saveError} title="Save Error" />
        )}

        {/* Input section */}
        <div className="space-y-4">
          <TextInputArea
            value={sourceText}
            onChange={setSourceText}
            disabled={isLoading}
            minLength={MIN_TEXT_LENGTH}
            maxLength={MAX_TEXT_LENGTH}
          />
          
          <GenerateButton
            onClick={handleGenerate}
            disabled={!canGenerate}
            isLoading={isLoading}
          />
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Generating flashcards...</h2>
            <SkeletonLoader count={5} />
          </div>
        )}

        {/* Results section */}
        {!isLoading && localFlashcards.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Generated Flashcards ({localFlashcards.length})
              </h2>
              <div className="text-sm text-muted-foreground">
                Accepted: {localFlashcards.filter(f => f.accepted).length}
              </div>
            </div>
            
            {/* Bulk save buttons */}
            <BulkSaveButton
              flashcards={localFlashcards}
              onSaveAll={handleSaveAll}
              onSaveAccepted={handleSaveAccepted}
              isSaving={isSaving}
              disabled={isSaving}
            />
            
            <FlashcardList
              flashcards={localFlashcards}
              onAccept={handleAccept}
              onEdit={handleEdit}
              onReject={handleReject}
            />
          </div>
        )}

        {/* Success dialog */}
        <SuccessDialog
          open={showSuccessDialog}
          onClose={handleCloseSuccessDialog}
          savedCount={savedCount || 0}
        />
      </div>
    </div>
  );
}

