/**
 * Spaced Repetition Service
 * 
 * Implementation of the SM-2 algorithm for spaced repetition
 * based on the algorithm by Piotr Wozniak
 * 
 * Quality scale:
 * 0 - Complete blackout, wrong answer
 * 1 - Wrong answer, but recognized the correct answer
 * 2 - Wrong answer, but upon seeing the correct answer it felt familiar
 * 3 - Correct answer, but required significant effort to recall
 * 4 - Correct answer, after some hesitation
 * 5 - Correct answer, perfect recall
 */

interface SpacedRepetitionParams {
  quality: number; // 0-5 rating of recall quality
  currentEasinessFactor: number;
  currentIntervalDays: number;
  reviewsCount: number;
}

interface SpacedRepetitionResult {
  nextReviewDate: Date;
  easinessFactor: number;
  intervalDays: number;
  reviewsCount: number;
}

/**
 * Calculate the next review date using the SM-2 spaced repetition algorithm
 */
export function calculateNextReview(params: SpacedRepetitionParams): SpacedRepetitionResult {
  const { quality, currentEasinessFactor, currentIntervalDays, reviewsCount } = params;
  
  // Ensure quality is within bounds
  const boundedQuality = Math.max(0, Math.min(5, quality));
  
  // Calculate new easiness factor (EF)
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  let newEasinessFactor = currentEasinessFactor + (0.1 - (5 - boundedQuality) * 
    (0.08 + (5 - boundedQuality) * 0.02));
  
  // Ensure EF doesn't go below 1.3
  newEasinessFactor = Math.max(1.3, newEasinessFactor);
  
  // Count this review
  const newReviewsCount = reviewsCount + 1;
  
  // Calculate new interval based on performance
  let newIntervalDays: number;
  
  if (boundedQuality < 3) {
    // If quality is less than 3, reset interval to 1 day (card needs relearning)
    newIntervalDays = 1;
  } else {
    // Otherwise, apply the standard SM-2 interval calculation
    if (newReviewsCount === 1) {
      // First successful review: 1 day
      newIntervalDays = 1;
    } else if (newReviewsCount === 2) {
      // Second successful review: 6 days
      newIntervalDays = 6;
    } else {
      // Subsequent reviews: interval = previous interval * EF
      newIntervalDays = Math.round(currentIntervalDays * newEasinessFactor);
    }
  }
  
  // Cap the interval at 365 days (configurable)
  newIntervalDays = Math.min(newIntervalDays, 365);
  
  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newIntervalDays);
  
  return {
    nextReviewDate,
    easinessFactor: newEasinessFactor,
    intervalDays: newIntervalDays,
    reviewsCount: newReviewsCount
  };
}

/**
 * Get a human-readable description of when the next review is scheduled
 */
export function getNextReviewDescription(nextReviewDate: Date): string {
  const now = new Date();
  const diffTime = nextReviewDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) {
    return 'Dziś';
  } else if (diffDays === 1) {
    return 'Jutro';
  } else if (diffDays < 7) {
    return `Za ${diffDays} dni`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Za ${weeks} ${weeks === 1 ? 'tydzień' : weeks < 5 ? 'tygodnie' : 'tygodni'}`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `Za ${months} ${months === 1 ? 'miesiąc' : months < 5 ? 'miesiące' : 'miesięcy'}`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `Za ${years} ${years === 1 ? 'rok' : years < 5 ? 'lata' : 'lat'}`;
  }
} 