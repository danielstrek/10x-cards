// src/pages/api/flashcards.ts
import type { APIRoute } from "astro";
import { z } from "zod";
import type { BulkCreateFlashcardsResponseDto, FlashcardListResponseDto } from "../../types";
import { bulkCreateFlashcards, getUserFlashcards } from "../../lib/services/flashcards.service";

// Disable prerendering for API routes
export const prerender = false;

/**
 * Zod schema for validating flashcard input
 */
const flashcardSchema = z.object({
  front: z.string().min(1).max(200, "Front must be at most 200 characters"),
  back: z.string().min(1).max(500, "Back must be at most 500 characters"),
  source: z.enum(["ai-full", "ai-edited", "manual"]),
});

/**
 * Zod schema for validating bulk create flashcards request
 */
const bulkCreateFlashcardsSchema = z.object({
  generationId: z.number().int().positive(),
  flashcards: z
    .array(flashcardSchema)
    .min(1, "At least one flashcard is required")
    .max(100, "Maximum 100 flashcards per request"),
});

/**
 * POST /api/flashcards
 *
 * Creates flashcards in bulk for a given generation
 * Requires authentication via Bearer token
 *
 * @param generationId - ID of the generation to associate flashcards with
 * @param flashcards - Array of flashcard objects to create
 * @returns 201 Created with the created flashcards
 * @returns 400 Bad Request if validation fails
 * @returns 401 Unauthorized if not authenticated
 * @returns 404 Not Found if generation doesn't exist or doesn't belong to user
 * @returns 500 Internal Server Error for server errors
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Check authentication
    // Get the authorization header
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "Missing or invalid authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Get the user from the token
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized", message: "Invalid or expired token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Step 2: Parse and validate request body
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
    const validationResult = bulkCreateFlashcardsSchema.safeParse(requestBody);

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

    const dto = validationResult.data;

    // Step 3: Call service to create flashcards
    try {
      const createdFlashcards = await bulkCreateFlashcards(locals.supabase, dto, userId);

      // Step 4: Return success response
      const response: BulkCreateFlashcardsResponseDto = {
        created: createdFlashcards,
      };

      return new Response(JSON.stringify(response), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      // Handle service-level errors
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Check if it's a "not found" error
      if (errorMessage.includes("not found") || errorMessage.includes("does not belong")) {
        return new Response(
          JSON.stringify({
            error: "Not Found",
            message: "Generation not found or does not belong to user",
          }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      // Generic database/service error
      console.error("Error creating flashcards:", error);
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Failed to create flashcards",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    // Catch-all for unexpected errors
    console.error("Unexpected error in POST /api/flashcards:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * GET /api/flashcards
 *
 * Retrieves all flashcards for the authenticated user
 * Requires authentication via session
 *
 * @returns 200 OK with paginated list of flashcards
 * @returns 401 Unauthorized if not authenticated
 * @returns 500 Internal Server Error for server errors
 */
export const GET: APIRoute = async ({ locals, url }) => {
  try {
    // Check authentication
    if (!locals.user) {
      return new Response(JSON.stringify({ error: "Unauthorized", message: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = locals.user.id;

    // Parse query parameters for pagination
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid pagination parameters",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Call service to get flashcards
    const response = await getUserFlashcards(locals.supabase, userId, page, limit);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching flashcards:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Failed to fetch flashcards",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
