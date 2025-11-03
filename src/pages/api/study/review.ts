// src/pages/api/study/review.ts
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { reviewFlashcard } from '../../../lib/services/study.service';
import type { ReviewFlashcardResponseDto } from '../../../types';

// Disable prerendering for API routes
export const prerender = false;

/**
 * Zod schema for validating review request
 */
const reviewFlashcardSchema = z.object({
  flashcardId: z.number().int().positive(),
  rating: z.enum(['again', 'hard', 'good', 'easy']),
});

/**
 * POST /api/study/review
 * 
 * Submit a review for a flashcard and update SRS data
 * Requires authentication via session
 * 
 * @param flashcardId - ID of the flashcard being reviewed
 * @param rating - User rating: 'again', 'hard', 'good', 'easy'
 * @returns 200 OK with updated SRS data
 * @returns 400 Bad Request if validation fails
 * @returns 401 Unauthorized if not authenticated
 * @returns 404 Not Found if flashcard doesn't exist or doesn't belong to user
 * @returns 500 Internal Server Error for server errors
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!locals.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Not authenticated' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = locals.user.id;

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Bad Request', message: 'Invalid JSON in request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate with Zod schema
    const validationResult = reviewFlashcardSchema.safeParse(requestBody);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: 'Validation failed',
          details: validationResult.error.errors.map((err) => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { flashcardId, rating } = validationResult.data;

    // Review flashcard
    try {
      const result = await reviewFlashcard(
        locals.supabase,
        flashcardId,
        rating,
        userId
      );

      const response: ReviewFlashcardResponseDto = {
        easinessFactor: result.easinessFactor,
        interval: result.interval,
        repetitions: result.repetitions,
        nextReviewDate: result.nextReviewDate.toISOString(),
        quality: result.quality,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Check if it's a "not found" error
      if (errorMessage.includes('not found') || errorMessage.includes('does not belong')) {
        return new Response(
          JSON.stringify({
            error: 'Not Found',
            message: 'Flashcard not found or does not belong to user',
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      throw error;
    }
  } catch (error) {
    console.error('Error reviewing flashcard:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to review flashcard',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

