// src/lib/services/flashcards.service.ts
import type { SupabaseClient } from '../../db/supabase.client';
import type {
  BulkCreateFlashcardsDto,
  FlashcardCreatedDto,
} from '../../types';

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
    .from('generations')
    .select('id, user_id, accepted_unedited_count, accepted_edited_count')
    .eq('id', dto.generationId)
    .eq('user_id', userId)
    .single();

  if (generationError || !generation) {
    throw new Error('Generation not found or does not belong to user');
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
    .from('flashcards')
    .insert(flashcardsToInsert)
    .select('id, front, back');

  if (insertError) {
    throw new Error(`Failed to insert flashcards: ${insertError.message}`);
  }

  if (!insertedFlashcards || insertedFlashcards.length === 0) {
    throw new Error('No flashcards were created');
  }

  // Step 4: Update generation counters
  // Count how many are ai-full (unedited) vs ai-edited
  const uneditedCount = dto.flashcards.filter(
    (f) => f.source === 'ai-full'
  ).length;
  const editedCount = dto.flashcards.filter(
    (f) => f.source === 'ai-edited'
  ).length;

  // Update the generation record with accepted counts
  const { error: updateError } = await supabase
    .from('generations')
    .update({
      accepted_unedited_count: (generation.accepted_unedited_count || 0) + uneditedCount,
      accepted_edited_count: (generation.accepted_edited_count || 0) + editedCount,
    })
    .eq('id', dto.generationId);

  if (updateError) {
    // Log the error but don't fail the operation since flashcards were created
    console.error('Failed to update generation counters:', updateError);
  }

  return insertedFlashcards;
}

