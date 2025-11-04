// src/lib/services/flashcards.service.ts
import type { SupabaseClient } from "../../db/supabase.client";
import type {
  BulkCreateFlashcardsDto,
  FlashcardCreatedDto,
  FlashcardListResponseDto,
  FlashcardDetailDto,
  UpdateFlashcardDto,
} from "../../types";

/**
 * Service for managing flashcards operations
 */

/**
 * Bulk creates flashcards for a given generation
 *
 * @param supabase - Supabase client instance
 * @param dto - Data transfer object containing generationId and flashcards array
 * @param userId - The authenticated user's ID
 * @returns Array of created flashcards with id, front, and back fields
 * @throws Error if generation doesn't exist or doesn't belong to the user
 * @throws Error if database operation fails
 */
export async function bulkCreateFlashcards(
  supabase: SupabaseClient,
  dto: BulkCreateFlashcardsDto,
  userId: string
): Promise<FlashcardCreatedDto[]> {
  // Step 1: Verify that the generation exists and belongs to the user
  const { data: generation, error: generationError } = await supabase
    .from("generations")
    .select("id, user_id, accepted_unedited_count, accepted_edited_count")
    .eq("id", dto.generationId)
    .eq("user_id", userId)
    .single();

  if (generationError || !generation) {
    throw new Error("Generation not found or does not belong to user");
  }

  // Step 2: Map flashcards to insert structure
  const flashcardsToInsert = dto.flashcards.map((flashcard) => ({
    user_id: userId,
    generation_id: dto.generationId,
    front: flashcard.front,
    back: flashcard.back,
    source: flashcard.source,
  }));

  // Step 3: Bulk insert flashcards
  const { data: insertedFlashcards, error: insertError } = await supabase
    .from("flashcards")
    .insert(flashcardsToInsert)
    .select("id, front, back");

  if (insertError) {
    throw new Error(`Failed to insert flashcards: ${insertError.message}`);
  }

  if (!insertedFlashcards || insertedFlashcards.length === 0) {
    throw new Error("No flashcards were created");
  }

  // Step 4: Update generation counters
  // Count how many are ai-full (unedited) vs ai-edited
  const uneditedCount = dto.flashcards.filter((f) => f.source === "ai-full").length;
  const editedCount = dto.flashcards.filter((f) => f.source === "ai-edited").length;

  // Update the generation record with accepted counts
  const { error: updateError } = await supabase
    .from("generations")
    .update({
      accepted_unedited_count: (generation.accepted_unedited_count || 0) + uneditedCount,
      accepted_edited_count: (generation.accepted_edited_count || 0) + editedCount,
    })
    .eq("id", dto.generationId);

  if (updateError) {
    // Log the error but don't fail the operation since flashcards were created
    console.error("Failed to update generation counters:", updateError);
  }

  return insertedFlashcards;
}

/**
 * Retrieves all flashcards for a user with pagination
 *
 * @param supabase - Supabase client instance
 * @param userId - The authenticated user's ID
 * @param page - Page number (1-indexed)
 * @param limit - Number of items per page
 * @returns Paginated list of flashcards
 */
export async function getUserFlashcards(
  supabase: SupabaseClient,
  userId: string,
  page = 1,
  limit = 50
): Promise<FlashcardListResponseDto> {
  // Calculate offset
  const offset = (page - 1) * limit;

  // Get total count
  const { count, error: countError } = await supabase
    .from("flashcards")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError) {
    throw new Error(`Failed to count flashcards: ${countError.message}`);
  }

  // Get paginated data
  const { data, error } = await supabase
    .from("flashcards")
    .select("id, front, back, source, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to fetch flashcards: ${error.message}`);
  }

  return {
    data: (data || []).map((fc) => ({
      id: fc.id,
      front: fc.front,
      back: fc.back,
      source: fc.source,
      due: false, // For now, always false (will be used in study sessions)
    })),
    page,
    limit,
    total: count || 0,
  };
}

/**
 * Retrieves a single flashcard by ID
 *
 * @param supabase - Supabase client instance
 * @param flashcardId - The flashcard ID
 * @param userId - The authenticated user's ID
 * @returns Flashcard details or null if not found
 */
export async function getFlashcardById(
  supabase: SupabaseClient,
  flashcardId: number,
  userId: string
): Promise<FlashcardDetailDto | null> {
  const { data, error } = await supabase
    .from("flashcards")
    .select("id, front, back, source, created_at, updated_at, generation_id")
    .eq("id", flashcardId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    front: data.front,
    back: data.back,
    source: data.source,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    generationId: data.generation_id,
  };
}

/**
 * Updates a flashcard
 *
 * @param supabase - Supabase client instance
 * @param flashcardId - The flashcard ID
 * @param dto - Data to update
 * @param userId - The authenticated user's ID
 * @returns Updated flashcard or null if not found
 */
export async function updateFlashcard(
  supabase: SupabaseClient,
  flashcardId: number,
  dto: UpdateFlashcardDto,
  userId: string
): Promise<FlashcardDetailDto | null> {
  // First verify the flashcard belongs to the user
  const existing = await getFlashcardById(supabase, flashcardId, userId);

  if (!existing) {
    return null;
  }

  // Update the flashcard
  const { data, error } = await supabase
    .from("flashcards")
    .update({
      front: dto.front,
      back: dto.back,
      updated_at: new Date().toISOString(),
    })
    .eq("id", flashcardId)
    .eq("user_id", userId)
    .select("id, front, back, source, created_at, updated_at, generation_id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to update flashcard: ${error?.message}`);
  }

  return {
    id: data.id,
    front: data.front,
    back: data.back,
    source: data.source,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    generationId: data.generation_id,
  };
}

/**
 * Deletes a flashcard
 *
 * @param supabase - Supabase client instance
 * @param flashcardId - The flashcard ID
 * @param userId - The authenticated user's ID
 * @returns true if deleted, false if not found
 */
export async function deleteFlashcard(supabase: SupabaseClient, flashcardId: number, userId: string): Promise<boolean> {
  // First verify the flashcard belongs to the user
  const existing = await getFlashcardById(supabase, flashcardId, userId);

  if (!existing) {
    return false;
  }

  // Delete the flashcard
  const { error } = await supabase.from("flashcards").delete().eq("id", flashcardId).eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to delete flashcard: ${error.message}`);
  }

  return true;
}

/**
 * Creates a single flashcard manually (without generation)
 *
 * @param supabase - Supabase client instance
 * @param front - Front text
 * @param back - Back text
 * @param userId - The authenticated user's ID
 * @returns Created flashcard
 */
export async function createManualFlashcard(
  supabase: SupabaseClient,
  front: string,
  back: string,
  userId: string
): Promise<FlashcardCreatedDto> {
  const { data, error } = await supabase
    .from("flashcards")
    .insert({
      user_id: userId,
      front,
      back,
      source: "manual",
      generation_id: null,
    })
    .select("id, front, back")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create flashcard: ${error?.message}`);
  }

  return {
    id: data.id,
    front: data.front,
    back: data.back,
  };
}
