// SM-2 Algorithm for spaced repetition
// https://en.wikipedia.org/wiki/SuperMemo#Algorithm_SM-2

export type Rating = 0 | 1 | 2 | 3 | 4 | 5

export interface SpacedRepetitionData {
  easeFactor: number
  interval: number
  repetitions: number
  dueDate: Date
  lastReviewed: Date
}

export function calculateNextReview(rating: Rating, currentData: SpacedRepetitionData): SpacedRepetitionData {
  const { easeFactor, interval, repetitions } = currentData

  // If rating is less than 3, reset repetitions
  if (rating < 3) {
    return {
      easeFactor,
      interval: 1,
      repetitions: 0,
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
      lastReviewed: new Date(),
    }
  }

  // Calculate new ease factor
  // EF := EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const newEaseFactor = Math.max(1.3, easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02)))

  // Calculate new interval
  let newInterval: number
  const newRepetitions = repetitions + 1

  if (newRepetitions === 1) {
    newInterval = 1 // 1 day
  } else if (newRepetitions === 2) {
    newInterval = 6 // 6 days
  } else {
    newInterval = Math.round(interval * newEaseFactor)
  }

  // Calculate due date
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + newInterval)

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    dueDate,
    lastReviewed: new Date(),
  }
}

export function getInitialSpacedRepetitionData(): SpacedRepetitionData {
  return {
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    dueDate: new Date(),
    lastReviewed: new Date(),
  }
}
