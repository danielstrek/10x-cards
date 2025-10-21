// src/pages/api/generations.ts
import type { APIRoute } from 'astro';
import { z } from 'zod';
import type { CreateGenerationResponseDto } from '../../types';
import { createGeneration } from '../../lib/services/generations.service';

// Disable prerendering for API routes
export const prerender = false;

/**
 * Zod schema for validating generation request
 */
const createGenerationSchema = z.object({
  sourceText: z
    .string()
    .min(1000, 'Source text must be at least 1000 characters')
    .max(10000, 'Source text must be at most 10000 characters'),
  model: z
    .string()
    .min(1, 'Model is required')
    .default('gpt-4'),
});

/**
 * POST /api/generations
 * 
 * Creates a new generation by sending source text to LLM and returns flashcard proposals
 * Requires authentication via Bearer token
 * 
 * @param sourceText - Text to generate flashcards from (1000-10000 characters)
 * @param model - LLM model to use (e.g., 'gpt-4', 'gpt-3.5-turbo')
 * @returns 201 Created with generation details and flashcard proposals
 * @returns 400 Bad Request if validation fails
 * @returns 401 Unauthorized if not authenticated
 * @returns 429 Too Many Requests if rate limit exceeded
 * @returns 502 Bad Gateway if LLM API fails
 * @returns 500 Internal Server Error for other server errors
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Check authentication
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized', 
          message: 'Missing or invalid authorization header' 
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Get the user from the token
    const { data: { user }, error: authError } = await locals.supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized', 
          message: 'Invalid or expired token' 
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;

    // Step 2: Parse and validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          error: 'Bad Request', 
          message: 'Invalid JSON in request body' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate with Zod schema
    const validationResult = createGenerationSchema.safeParse(requestBody);

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

    const dto = validationResult.data;

    // Step 3: Get OpenRouter API key from environment
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      console.error('OPENROUTER_API_KEY is not configured');
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: 'Service configuration error',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: Call service to create generation
    try {
      const generationResponse = await createGeneration(
        locals.supabase,
        dto,
        userId,
        apiKey
      );

      // Step 5: Return success response
      const response: CreateGenerationResponseDto = generationResponse;

      return new Response(JSON.stringify(response), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Check if it's an LLM API error
      if (errorMessage.includes('OpenRouter API error')) {
        return new Response(
          JSON.stringify({
            error: 'Bad Gateway',
            message: 'Failed to communicate with AI service',
            details: errorMessage,
          }),
          { status: 502, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check if it's a rate limit error
      if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        return new Response(
          JSON.stringify({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please try again later.',
          }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Generic service error
      console.error('Error creating generation:', error);
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: 'Failed to generate flashcards',
          details: errorMessage,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    // Catch-all for unexpected errors
    console.error('Unexpected error in POST /api/generations:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

