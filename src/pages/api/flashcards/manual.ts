// src/pages/api/flashcards/manual.ts
import type { APIRoute } from "astro";
import { z } from "zod";
import type { FlashcardCreatedDto } from "../../../types";
import { createManualFlashcard } from "../../../lib/services/flashcards.service";

// Disable prerendering for API routes
export const prerender = false;

/**
 * Zod schema for validating manual flashcard creation
 */
const createManualFlashcardSchema = z.object({
  front: z.string().min(1).max(200, "Front must be at most 200 characters"),
  back: z.string().min(1).max(500, "Back must be at most 500 characters"),
});

/**
 * POST /api/flashcards/manual
 *
 * Creates a single flashcard manually (without generation)
 * Requires authentication via session
 *
 * @param front - Front text
 * @param back - Back text
 * @returns 201 Created with the created flashcard
 * @returns 400 Bad Request if validation fails
 * @returns 401 Unauthorized if not authenticated
 * @returns 500 Internal Server Error for server errors
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!locals.user) {
      return new Response(JSON.stringify({ error: "Unauthorized", message: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = locals.user.id;

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      return new Response(JSON.stringify({ error: "Bad Request", message: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate with Zod schema
    const validationResult = createManualFlashcardSchema.safeParse(requestBody);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Validation failed",
          details: validationResult.error.errors.map((err) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { front, back } = validationResult.data;

    // Call service to create flashcard
    const createdFlashcard = await createManualFlashcard(locals.supabase, front, back, userId);

    return new Response(JSON.stringify(createdFlashcard), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating manual flashcard:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Failed to create flashcard",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
