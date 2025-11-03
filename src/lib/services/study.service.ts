// src/lib/services/study.service.ts
import type { SupabaseClient } from '../../db/supabase.client';

/**
 * SM-2 Algorithm for Spaced Repetition
 * Based on SuperMemo 2 algorithm by Piotr Wozniak (1987)
 * 
 * Quality ratings:
 * - 0: Complete blackout
 * - 1: Incorrect response, but correct one remembered
 * - 2: Incorrect response, correct one seemed easy to recall
 * - 3: Correct response, but required significant difficulty
 * - 4: Correct response, after some hesitation
 * - 5: Perfect response
 */

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

export interface SRSData {
  easinessFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
}

export interface ReviewResult extends SRSData {
  quality: ReviewQuality;
}

/**
 * Calculate next review schedule using SM-2 algorithm
 * 
 * @param quality - Quality of the answer (0-5)
 * @param previousEF - Previous easiness factor
 * @param previousInterval - Previous interval in days
 * @param previousRepetitions - Previous number of repetitions
 * @returns New SRS data
 */
export function calculateSM2(
  quality: ReviewQuality,
  previousEF: number = 2.5,
  previousInterval: number = 0,
  previousRepetitions: number = 0
): SRSData {
  let easinessFactor = previousEF;
  let interval = previousInterval;
  let repetitions = previousRepetitions;

  // Calculate new easiness factor
  easinessFactor = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // Ensure EF doesn't go below 1.3
  if (easinessFactor < 1.3) {
    easinessFactor = 1.3;
  }

  // If quality < 3, reset repetitions and interval
  if (quality < 3) {
    repetitions = 0;
    interval = 1; // Review again tomorrow
  } else {
    // Quality >= 3, proceed with normal SM-2
    repetitions += 1;

    if (repetitions === 1) {
      interval = 1; // First successful review: 1 day
    } else if (repetitions === 2) {
      interval = 6; // Second successful review: 6 days
    } else {
      // Subsequent reviews: multiply previous interval by EF
      interval = Math.round(previousInterval * easinessFactor);
    }
  }

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    easinessFactor,
    interval,
    repetitions,
    nextReviewDate,
  };
}

/**
 * Convert quality rating from user-friendly format to SM-2 scale
 * 
 * @param rating - User-friendly rating: 'again', 'hard', 'good', 'easy'
 * @returns SM-2 quality (0-5)
 */
export function ratingToQuality(rating: 'again' | 'hard' | 'good' | 'easy'): ReviewQuality {
  switch (rating) {
    case 'again':
      return 0; // Complete failure
    case 'hard':
      return 3; // Correct but difficult
    case 'good':
      return 4; // Correct with some hesitation
    case 'easy':
      return 5; // Perfect response
    default:
      return 3; // Default to 'good'
  }
}

/**
 * Get due flashcards for study session
 * 
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param limit - Maximum number of cards to return
 * @returns Array of due flashcards
 */
export async function getDueFlashcards(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 20
) {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('flashcards')
    .select('id, front, back, easiness_factor, interval, repetitions, next_review_date')
    .eq('user_id', userId)
    .lte('next_review_date', now)
    .order('next_review_date', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch due flashcards: ${error.message}`);
  }

  return data || [];
}

/**
 * Get count of due flashcards
 * 
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @returns Count of due flashcards
 */
export async function getDueFlashcardsCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const now = new Date().toISOString();

  const { count, error } = await supabase
    .from('flashcards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .lte('next_review_date', now);

  if (error) {
    throw new Error(`Failed to count due flashcards: ${error.message}`);
  }

  return count || 0;
}

/**
 * Review a flashcard and update SRS data
 * 
 * @param supabase - Supabase client instance
 * @param flashcardId - Flashcard ID
 * @param rating - User rating ('again', 'hard', 'good', 'easy')
 * @param userId - User ID
 * @returns Updated SRS data
 */
export async function reviewFlashcard(
  supabase: SupabaseClient,
  flashcardId: number,
  rating: 'again' | 'hard' | 'good' | 'easy',
  userId: string
): Promise<ReviewResult> {
  // First, get current SRS data
  const { data: flashcard, error: fetchError } = await supabase
    .from('flashcards')
    .select('easiness_factor, interval, repetitions, next_review_date')
    .eq('id', flashcardId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !flashcard) {
    throw new Error('Flashcard not found or does not belong to user');
  }

  // Convert rating to quality
  const quality = ratingToQuality(rating);

  // Calculate new SRS data
  const srsData = calculateSM2(
    quality,
    flashcard.easiness_factor,
    flashcard.interval,
    flashcard.repetitions
  );

  // Update flashcard in database
  const { error: updateError } = await supabase
    .from('flashcards')
    .update({
      easiness_factor: srsData.easinessFactor,
      interval: srsData.interval,
      repetitions: srsData.repetitions,
      next_review_date: srsData.nextReviewDate.toISOString(),
      last_reviewed_at: new Date().toISOString(),
    })
    .eq('id', flashcardId)
    .eq('user_id', userId);

  if (updateError) {
    throw new Error(`Failed to update flashcard: ${updateError.message}`);
  }

  return {
    ...srsData,
    quality,
  };
}

/**
 * Get study session statistics
 * 
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @returns Study statistics
 */
export async function getStudyStatistics(
  supabase: SupabaseClient,
  userId: string
) {
  const now = new Date().toISOString();

  // Get total flashcards count
  const { count: totalCount, error: totalError } = await supabase
    .from('flashcards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (totalError) {
    throw new Error(`Failed to get total count: ${totalError.message}`);
  }

  // Get due flashcards count
  const { count: dueCount, error: dueError } = await supabase
    .from('flashcards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .lte('next_review_date', now);

  if (dueError) {
    throw new Error(`Failed to get due count: ${dueError.message}`);
  }

  // Get reviewed today count
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count: reviewedTodayCount, error: reviewedError } = await supabase
    .from('flashcards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('last_reviewed_at', todayStart.toISOString());

  if (reviewedError) {
    throw new Error(`Failed to get reviewed count: ${reviewedError.message}`);
  }

  return {
    total: totalCount || 0,
    due: dueCount || 0,
    reviewedToday: reviewedTodayCount || 0,
  };
}

