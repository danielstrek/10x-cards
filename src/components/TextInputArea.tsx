// src/components/TextInputArea.tsx
import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface TextInputAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minLength?: number;
  maxLength?: number;
}

export function TextInputArea({
  value,
  onChange,
  placeholder = "Paste your text here (1000-10000 characters)...",
  disabled = false,
  minLength = 1000,
  maxLength = 10000,
}: TextInputAreaProps) {
  const characterCount = value.length;
  const isValid = characterCount >= minLength && characterCount <= maxLength;
  const isTooShort = characterCount > 0 && characterCount < minLength;
  const isTooLong = characterCount > maxLength;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor="source-text"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Source Text
        </label>
        <span
          className={cn(
            "text-xs",
            isTooShort && "text-orange-600 dark:text-orange-400",
            isTooLong && "text-destructive",
            isValid && "text-green-600 dark:text-green-400",
            characterCount === 0 && "text-muted-foreground"
          )}
          aria-live="polite"
        >
          {characterCount.toLocaleString()} / {minLength.toLocaleString()}-{maxLength.toLocaleString()} characters
        </span>
      </div>

      <Textarea
        id="source-text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "min-h-[300px] resize-y",
          isTooShort && "border-orange-600 focus-visible:border-orange-600 focus-visible:ring-orange-600/50",
          isTooLong && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/50"
        )}
        aria-invalid={!isValid && characterCount > 0}
        aria-describedby="character-count-help"
        data-test-id="generate-source-text-input"
      />

      {isTooShort && (
        <p id="character-count-help" className="text-xs text-orange-600 dark:text-orange-400">
          Text is too short. Need at least {(minLength - characterCount).toLocaleString()} more characters.
        </p>
      )}

      {isTooLong && (
        <p id="character-count-help" className="text-xs text-destructive">
          Text is too long. Please remove {(characterCount - maxLength).toLocaleString()} characters.
        </p>
      )}
    </div>
  );
}
