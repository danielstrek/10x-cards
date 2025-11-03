// src/pages/api/flashcards/[id].ts
import type { APIRoute } from 'astro';
import { z } from 'zod';
import type { FlashcardDetailDto, UpdateFlashcardDto } from '../../../types';
import { 
  getFlashcardById, 
  updateFlashcard, 
  deleteFlashcard 
} from '../../../lib/services/flashcards.service';

// Disable prerendering for API routes
export const prerender = false;

/**
 * Zod schema for validating flashcard update
 */
const updateFlashcardSchema = z.object({
  front: z.string().min(1).max(200, 'Front must be at most 200 characters'),
  back: z.string().min(1).max(500, 'Back must be at most 500 characters'),
});

/**
 * GET /api/flashcards/[id]
 * 
 * Retrieves a single flashcard by ID
 * Requires authentication via session
 * 
 * @param id - Flashcard ID from URL
 * @returns 200 OK with flashcard details
 * @returns 401 Unauthorized if not authenticated
 * @returns 404 Not Found if flashcard doesn't exist or doesn't belong to user
 * @returns 500 Internal Server Error for server errors
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Check authentication
    if (!locals.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Not authenticated' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const flashcardId = parseInt(params.id || '');

    if (isNaN(flashcardId)) {
      return new Response(
        JSON.stringify({ error: 'Bad Request', message: 'Invalid flashcard ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = locals.user.id;

    // Call service to get flashcard
    const flashcard = await getFlashcardById(locals.supabase, flashcardId, userId);

    if (!flashcard) {
      return new Response(
        JSON.stringify({ error: 'Not Found', message: 'Flashcard not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(flashcard), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching flashcard:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to fetch flashcard',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * PUT /api/flashcards/[id]
 * 
 * Updates a flashcard
 * Requires authentication via session
 * 
 * @param id - Flashcard ID from URL
 * @param front - Updated front text
 * @param back - Updated back text
 * @returns 200 OK with updated flashcard
 * @returns 400 Bad Request if validation fails
 * @returns 401 Unauthorized if not authenticated
 * @returns 404 Not Found if flashcard doesn't exist or doesn't belong to user
 * @returns 500 Internal Server Error for server errors
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    // Check authentication
    if (!locals.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Not authenticated' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const flashcardId = parseInt(params.id || '');

    if (isNaN(flashcardId)) {
      return new Response(
        JSON.stringify({ error: 'Bad Request', message: 'Invalid flashcard ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

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
    const validationResult = updateFlashcardSchema.safeParse(requestBody);

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

    const userId = locals.user.id;
    const dto: UpdateFlashcardDto = validationResult.data;

    // Call service to update flashcard
    const updatedFlashcard = await updateFlashcard(
      locals.supabase, 
      flashcardId, 
      dto, 
      userId
    );

    if (!updatedFlashcard) {
      return new Response(
        JSON.stringify({ error: 'Not Found', message: 'Flashcard not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(updatedFlashcard), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating flashcard:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to update flashcard',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * DELETE /api/flashcards/[id]
 * 
 * Deletes a flashcard
 * Requires authentication via session
 * 
 * @param id - Flashcard ID from URL
 * @returns 204 No Content on success
 * @returns 401 Unauthorized if not authenticated
 * @returns 404 Not Found if flashcard doesn't exist or doesn't belong to user
 * @returns 500 Internal Server Error for server errors
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Check authentication
    if (!locals.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Not authenticated' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const flashcardId = parseInt(params.id || '');

    if (isNaN(flashcardId)) {
      return new Response(
        JSON.stringify({ error: 'Bad Request', message: 'Invalid flashcard ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = locals.user.id;

    // Call service to delete flashcard
    const deleted = await deleteFlashcard(locals.supabase, flashcardId, userId);

    if (!deleted) {
      return new Response(
        JSON.stringify({ error: 'Not Found', message: 'Flashcard not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting flashcard:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to delete flashcard',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

