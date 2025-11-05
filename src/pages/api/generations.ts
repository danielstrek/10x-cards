// src/pages/api/generations.ts
import type { APIRoute } from "astro";
import { z } from "zod";
import type { CreateGenerationResponseDto } from "../../types";
import { createGeneration } from "../../lib/services/generations.service";
import { OpenRouterService } from "../../lib/services/openrouter.service";
import {
  OpenRouterAuthError,
  OpenRouterRateLimitError,
  OpenRouterModelError,
  OpenRouterNetworkError,
  OpenRouterAPIError,
} from "../../lib/services/openrouter.errors";

export const prerender = false;

/**
 * Schemat walidacji dla requestu generacji
 */
const createGenerationSchema = z.object({
  sourceText: z
    .string()
    .min(1000, "Source text must be at least 1000 characters")
    .max(10000, "Source text must be at most 10000 characters"),
  model: z.string().min(1, "Model is required").default("openai/gpt-4o-2024-08-06"),
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
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Missing or invalid authorization header",
        }),
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
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Invalid or expired token",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
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
          error: "Bad Request",
          message: "Invalid JSON in request body",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate with Zod schema
    const validationResult = createGenerationSchema.safeParse(requestBody);

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

    // Krok 3: Pobierz klucz API OpenRouter
    const apiKey = import.meta.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error("OPENROUTER_API_KEY is not configured");
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Service configuration error",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Loguj informację o konfiguracji (bez ujawniania klucza)
    console.log("[API] OpenRouter configured:", {
      hasApiKey: !!apiKey,
      keyPrefix: apiKey.substring(0, 7) + "...",
      model: dto.model,
      textLength: dto.sourceText.length,
    });

    // Krok 4: Utwórz instancję usługi OpenRouter
    const openRouterService = new OpenRouterService({
      apiKey,
      defaultModel: "openai/gpt-4o-2024-08-06",
      appInfo: {
        referer: "https://10x-cards.app",
        title: "10x Cards",
      },
      timeout: 60000,
      retryConfig: {
        maxRetries: 3,
        retryDelay: 1000,
        retryableStatuses: [429, 500, 502, 503, 504],
      },
    });

    // Krok 5: Wywołaj serwis generacji
    try {
      const generationResponse = await createGeneration(locals.supabase, dto, userId, openRouterService);

      const response: CreateGenerationResponseDto = generationResponse;

      return new Response(JSON.stringify(response), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      // Obsługa błędów OpenRouter
      if (error instanceof OpenRouterAuthError) {
        console.error("OpenRouter auth error:", error.message);
        return new Response(
          JSON.stringify({
            error: "Internal Server Error",
            message: "AI service configuration error",
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      if (error instanceof OpenRouterRateLimitError) {
        return new Response(
          JSON.stringify({
            error: "Too Many Requests",
            message: "AI service rate limit exceeded. Please try again later.",
            retryAfter: error.retryAfter,
          }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      }

      if (error instanceof OpenRouterModelError) {
        return new Response(
          JSON.stringify({
            error: "Bad Request",
            message: `Model error: ${error.message}`,
            modelId: error.modelId,
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      if (error instanceof OpenRouterNetworkError) {
        return new Response(
          JSON.stringify({
            error: "Bad Gateway",
            message: "Failed to communicate with AI service",
          }),
          { status: 502, headers: { "Content-Type": "application/json" } }
        );
      }

      if (error instanceof OpenRouterAPIError) {
        return new Response(
          JSON.stringify({
            error: "Bad Gateway",
            message: `AI service error: ${error.message}`,
            statusCode: error.statusCode,
          }),
          { status: 502, headers: { "Content-Type": "application/json" } }
        );
      }

      // Inne błędy
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Error creating generation:", error);

      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Failed to generate flashcards",
          details: errorMessage,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    // Catch-all for unexpected errors
    console.error("Unexpected error in POST /api/generations:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
