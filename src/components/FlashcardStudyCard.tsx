// src/components/FlashcardStudyCard.tsx
import * as React from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { RotateCcwIcon } from "lucide-react";
import type { StudyFlashcardDto } from "../types";

interface FlashcardStudyCardProps {
  flashcard: StudyFlashcardDto;
  onRate: (rating: "again" | "hard" | "good" | "easy") => void;
  isRating: boolean;
}

export function FlashcardStudyCard({ flashcard, onRate, isRating }: FlashcardStudyCardProps) {
  const [isFlipped, setIsFlipped] = React.useState(false);

  // Reset flip state when flashcard changes
  React.useEffect(() => {
    setIsFlipped(false);
  }, [flashcard.id]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRate = (rating: "again" | "hard" | "good" | "easy") => {
    onRate(rating);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Flashcard */}
      <Card className="mb-6" data-test-id="study-flashcard-card">
        <CardContent className="pt-12 pb-12 px-8 min-h-[300px] flex flex-col justify-center items-center">
          <div className="w-full text-center">
            {!isFlipped ? (
              /* Front side */
              <div className="space-y-6" data-test-id="study-flashcard-front">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pytanie</h2>
                <p className="text-2xl font-medium leading-relaxed">{flashcard.front}</p>
              </div>
            ) : (
              /* Back side */
              <div className="space-y-6" data-test-id="study-flashcard-back">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Odpowiedź</h2>
                <div className="space-y-4">
                  <p className="text-xl text-muted-foreground leading-relaxed">{flashcard.front}</p>
                  <div className="border-t pt-4">
                    <p className="text-2xl font-medium leading-relaxed">{flashcard.back}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="space-y-4">
        {!isFlipped ? (
          /* Show answer button */
          <Button
            onClick={handleFlip}
            size="lg"
            className="w-full"
            disabled={isRating}
            data-test-id="study-show-answer-button"
          >
            <RotateCcwIcon className="mr-2 h-5 w-5" />
            Pokaż odpowiedź
          </Button>
        ) : (
          /* Rating buttons */
          <div className="space-y-3" data-test-id="study-rating-buttons">
            <p className="text-center text-sm text-muted-foreground mb-4">Jak dobrze pamiętałeś tę fiszkę?</p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleRate("again")}
                variant="outline"
                size="lg"
                disabled={isRating}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                data-test-id="study-rate-again-button"
              >
                Wcale
              </Button>
              <Button
                onClick={() => handleRate("hard")}
                variant="outline"
                size="lg"
                disabled={isRating}
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
                data-test-id="study-rate-hard-button"
              >
                Trudno
              </Button>
              <Button
                onClick={() => handleRate("good")}
                variant="outline"
                size="lg"
                disabled={isRating}
                className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                data-test-id="study-rate-good-button"
              >
                Dobrze
              </Button>
              <Button
                onClick={() => handleRate("easy")}
                variant="outline"
                size="lg"
                disabled={isRating}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                data-test-id="study-rate-easy-button"
              >
                Łatwo
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Metadata */}
      {isFlipped && (
        <div
          className="mt-6 text-center text-xs text-muted-foreground space-y-1"
          data-test-id="study-flashcard-metadata"
        >
          <p>
            Powtórzenia: {flashcard.repetitions} | Interwał: {flashcard.interval} dni
          </p>
          <p>Współczynnik łatwości: {flashcard.easinessFactor.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
}
