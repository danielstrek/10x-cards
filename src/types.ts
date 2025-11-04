// src/types.ts
import type { Tables, TablesInsert, TablesUpdate } from "./db/database.types";

// --- AUTH DTOs ---

/** Request body for user registration */
export interface RegisterUserDto {
  email: string;
  password: string;
}

/** Response body after registering a user */
export interface RegisterUserResponseDto {
  userId: string;
  email: string;
  createdAt: string;
}

/** Request body for user login */
export interface LoginUserDto {
  email: string;
  password: string;
}

/** Response body after logging in */
export interface LoginUserResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
  };
}

// --- GENERATIONS DTOs ---

/** Command to create a generation */
export interface CreateGenerationDto {
  sourceText: string;
  model: string;
}

/** One proposed flashcard from the AI */
export interface ProposalDto {
  proposalId: string;
  front: string;
  back: string;
}

/** Response for creating a generation */
export interface CreateGenerationResponseDto {
  generationId: number;
  model: string;
  generatedCount: number;
  proposals: ProposalDto[];
}

/** Raw DB row for generations */
type GenerationRow = Tables<"generations">;

/** Item in a paginated list of generations */
export interface GenerationListItemDto {
  generationId: GenerationRow["id"];
  model: GenerationRow["model"];
  createdAt: GenerationRow["created_at"];
  generatedCount: GenerationRow["generated_count"];
  acceptedUneditedCount: GenerationRow["accepted_unedited_count"];
  acceptedEditedCount: GenerationRow["accepted_edited_count"];
}

/** Paginated response for generations */
export interface GenerationListResponseDto {
  data: GenerationListItemDto[];
  page: number;
  limit: number;
  total: number;
}

// --- FLASHCARDS DTOs ---

/** Raw DB types for flashcards */
type FlashcardRow = Tables<"flashcards">;
type FlashcardInsert = TablesInsert<"flashcards">;
type FlashcardUpdate = TablesUpdate<"flashcards">;

/** Command to bulk-create flashcards */
export interface BulkCreateFlashcardsDto {
  generationId: number;
  flashcards: Pick<FlashcardInsert, "front" | "back" | "source">[];
}

/** Created flashcard data */
export type FlashcardCreatedDto = Pick<FlashcardRow, "id" | "front" | "back">;

/** Response for bulk-creating flashcards */
export interface BulkCreateFlashcardsResponseDto {
  created: FlashcardCreatedDto[];
}

/** Item in a paginated list of flashcards */
export interface FlashcardListItemDto extends Pick<FlashcardRow, "id" | "front" | "back" | "source"> {
  due: boolean;
}

/** Paginated response for listing flashcards */
export interface FlashcardListResponseDto {
  data: FlashcardListItemDto[];
  page: number;
  limit: number;
  total: number;
}

/** Detailed flashcard view */
export interface FlashcardDetailDto {
  id: FlashcardRow["id"];
  front: FlashcardRow["front"];
  back: FlashcardRow["back"];
  source: FlashcardRow["source"];
  createdAt: FlashcardRow["created_at"];
  updatedAt: FlashcardRow["updated_at"];
  generationId: FlashcardRow["generation_id"];
}

/** Command to update a flashcard */
export type UpdateFlashcardDto = Pick<FlashcardUpdate, "front" | "back">;

// --- STUDY SESSIONS DTOs ---

/** Paginated response for due flashcards; same as listing */
export type SessionDueListResponseDto = FlashcardListResponseDto;

/** Command to submit a review rating */
export interface SessionReviewDto {
  flashcardId: number;
  rating: "easy" | "medium" | "hard";
}

/** Possible session summary (shape may vary) */
export type SessionSummaryDto = Record<string, any>;

/** Response after submitting a review: either the next flashcard or a summary */
export type SessionReviewResponseDto = FlashcardDetailDto | SessionSummaryDto;

// --- STUDY SESSION DTOs ---

/** Flashcard with SRS data for study session */
export interface StudyFlashcardDto {
  id: number;
  front: string;
  back: string;
  easinessFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string;
}

/** Request body for reviewing a flashcard */
export interface ReviewFlashcardDto {
  flashcardId: number;
  rating: "again" | "hard" | "good" | "easy";
}

/** Response after reviewing a flashcard */
export interface ReviewFlashcardResponseDto {
  easinessFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string;
  quality: number;
}

/** Study session statistics */
export interface StudyStatisticsDto {
  total: number;
  due: number;
  reviewedToday: number;
}
