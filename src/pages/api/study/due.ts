// src/pages/api/study/due.ts
import type { APIRoute } from "astro";
import { getDueFlashcards, getStudyStatistics } from "../../../lib/services/study.service";
import type { StudyFlashcardDto, StudyStatisticsDto } from "../../../types";

// Disable prerendering for API routes
export const prerender = false;

/**
 * GET /api/study/due
 *
 * Retrieves flashcards due for review
 * Requires authentication via session
 *
 * @param limit - Optional query parameter for max cards (default: 20)
 * @returns 200 OK with array of due flashcards and statistics
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

    // Parse query parameters
    const limit = parseInt(url.searchParams.get("limit") || "20");

    // Validate limit
    if (limit < 1 || limit > 100) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Limit must be between 1 and 100",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch due flashcards and statistics
    const [dueFlashcards, statistics] = await Promise.all([
      getDueFlashcards(locals.supabase, userId, limit),
      getStudyStatistics(locals.supabase, userId),
    ]);

    // Map to DTOs
    const flashcardsDto: StudyFlashcardDto[] = dueFlashcards.map((fc) => ({
      id: fc.id,
      front: fc.front,
      back: fc.back,
      easinessFactor: fc.easiness_factor,
      interval: fc.interval,
      repetitions: fc.repetitions,
      nextReviewDate: fc.next_review_date,
    }));

    const statisticsDto: StudyStatisticsDto = {
      total: statistics.total,
      due: statistics.due,
      reviewedToday: statistics.reviewedToday,
    };

    return new Response(
      JSON.stringify({
        flashcards: flashcardsDto,
        statistics: statisticsDto,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching due flashcards:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Failed to fetch due flashcards",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
