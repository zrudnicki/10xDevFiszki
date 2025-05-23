import type { FlashcardReviewStatus } from "@/types";

/**
 * SM-2 Algorithm parameters
 * These control how quickly the intervals between repetitions grow
 */
const SM2_PARAMS = {
  INITIAL_EASINESS: 2.5,   // Initial easiness factor
  MIN_EASINESS: 1.3,       // Minimum easiness factor
  INITIAL_INTERVAL: 1,     // Initial interval (in days) for first review
  LEARNED_INTERVAL_FACTOR: 6  // Factor to multiply intervals for "learned" status
};

/**
 * Represents the quality of recall from 0 to 5:
 * 0: Complete blackout
 * 1: Incorrect response; the correct answer remembered
 * 2: Incorrect response; the correct answer seemed easy to recall
 * 3: Correct response after significant hesitation
 * 4: Correct response with some hesitation
 * 5: Perfect response
 */
export type RecallQuality = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Parameters needed for calculating the next review date
 */
export interface SpacedRepetitionParams {
  easinessFactor: number;
  intervalDays: number;
  repetitionNumber: number;
}

/**
 * Result of the spaced repetition calculation
 */
export interface SpacedRepetitionResult {
  nextReviewDate: Date;
  newEasinessFactor: number;
  newIntervalDays: number;
  newRepetitionNumber: number;
  wasSuccessful: boolean;
}

/**
 * Map our binary review status to recall quality
 * @param status The review status (learned or review)
 * @returns The equivalent SM-2 recall quality
 */
export function mapStatusToQuality(status: "learned" | "review"): RecallQuality {
  // Map learned to a high quality (4) and review to a low quality (2)
  return status === "learned" ? 4 : 2;
}

/**
 * Calculate the next review date based on the SM-2 algorithm
 * @param status Whether the flashcard was marked as learned or needs review
 * @param params Current spaced repetition parameters
 * @returns New spaced repetition parameters and next review date
 */
export function calculateNextReviewDate(
  status: "learned" | "review",
  params: SpacedRepetitionParams = { 
    easinessFactor: 2.5,  // Default easiness factor
    intervalDays: 1,      // Default interval in days
    repetitionNumber: 0   // Default repetition number
  }
): SpacedRepetitionResult {
  // Convert our binary status to SM-2 quality rating (0-5)
  const quality = mapStatusToQuality(status);
  
  // Extract params with defaults for new cards
  const { easinessFactor, intervalDays, repetitionNumber } = params;
  
  // Clone the parameters to avoid modifying the input
  let newEasinessFactor = easinessFactor;
  let newIntervalDays = intervalDays;
  let newRepetitionNumber = repetitionNumber;
  
  // Check if the response was considered successful (quality >= 3 in SM-2)
  const wasSuccessful = quality >= 3;
  
  if (wasSuccessful) {
    // Response was good, update the easiness factor
    newEasinessFactor = easinessFactor + (0.1 - (5 - quality) * 0.08);
    newEasinessFactor = Math.max(1.3, newEasinessFactor); // Minimum E-Factor is 1.3
    
    // Increment repetition number
    newRepetitionNumber = repetitionNumber + 1;
    
    // Calculate new interval based on repetition number
    if (newRepetitionNumber === 1) {
      newIntervalDays = 1; // First successful review
    } else if (newRepetitionNumber === 2) {
      newIntervalDays = 6; // Second successful review
    } else {
      // For subsequent reviews, multiply the previous interval by the easiness factor
      newIntervalDays = Math.round(intervalDays * newEasinessFactor);
    }
  } else {
    // Response was poor, reduce easiness factor
    newEasinessFactor = easinessFactor - 0.2;
    newEasinessFactor = Math.max(1.3, newEasinessFactor); // Ensure minimum
    
    // Reset repetition number and interval
    newRepetitionNumber = 0;
    newIntervalDays = 1;
  }
  
  // Calculate the next review date
  const now = new Date();
  const nextReviewDate = new Date(now);
  nextReviewDate.setDate(now.getDate() + newIntervalDays);
  
  return {
    nextReviewDate,
    newEasinessFactor,
    newIntervalDays,
    newRepetitionNumber,
    wasSuccessful
  };
}

/**
 * Given a date, format it for display in the UI
 * @param date The date to format
 * @returns Formatted date string like "Today", "Tomorrow", or "in 3 days"
 */
export function formatNextReviewDate(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dateCopy = new Date(date);
  dateCopy.setHours(0, 0, 0, 0);
  
  const diffTime = dateCopy.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return "Dziś";
  } else if (diffDays === 1) {
    return "Jutro";
  } else if (diffDays > 1 && diffDays <= 30) {
    return `za ${diffDays} dni`;
  } else {
    return date.toLocaleDateString('pl-PL');
  }
}

/**
 * Calculate statistics for a set of flashcards to provide learning progress information
 * 
 * @param reviewHistories Array of review histories for flashcards
 * @returns Object containing statistics about learning progress
 */
export function calculateLearningStats(reviewHistories: any[]) {
  if (!reviewHistories || reviewHistories.length === 0) {
    return {
      masteredCount: 0,
      inProgressCount: 0, 
      newCount: 0,
      averageEasiness: 0,
      completionPercentage: 0
    };
  }
  
  // Count cards by state
  const masteredCount = reviewHistories.filter(h => h.interval_days >= 30).length;
  const inProgressCount = reviewHistories.filter(h => h.review_count > 0 && h.interval_days < 30).length;
  const newCount = reviewHistories.filter(h => h.review_count === 0).length;
  
  // Calculate average easiness
  const totalEasiness = reviewHistories.reduce((sum, h) => sum + (h.easiness_factor || SM2_PARAMS.INITIAL_EASINESS), 0);
  const averageEasiness = totalEasiness / reviewHistories.length;
  
  // Calculate overall completion percentage
  const completionPercentage = Math.round((masteredCount / reviewHistories.length) * 100);
  
  return {
    masteredCount,
    inProgressCount,
    newCount,
    averageEasiness,
    completionPercentage
  };
} 