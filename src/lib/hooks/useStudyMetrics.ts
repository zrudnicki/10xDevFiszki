import { useState, useEffect, useCallback } from 'react';
import type { FlashcardReviewStatus } from '@/types';

interface CardMetrics {
  id: string;
  viewStartTime: number;
  viewDuration: number | null;
  flipTime: number | null;
  flipDuration: number | null;
  decisionTime: number | null;
  decision: FlashcardReviewStatus | null;
}

interface SessionMetrics {
  sessionStartTime: number;
  sessionEndTime: number | null;
  totalCards: number;
  reviewedCards: number;
  learnedCards: number;
  reviewCards: number;
  averageTimePerCard: number;
  totalStudyTime: number;
  longestStreak: number;
  cardMetrics: Record<string, CardMetrics>;
  currentStreak: number;
}

interface UseStudyMetricsProps {
  totalCards: number;
  onSessionComplete?: (metrics: SessionMetrics) => void;
}

/**
 * Custom hook for tracking study session metrics and analytics
 * Provides data about user's study patterns, speeds, and effectiveness
 */
export function useStudyMetrics({ totalCards, onSessionComplete }: UseStudyMetricsProps) {
  const [metrics, setMetrics] = useState<SessionMetrics>({
    sessionStartTime: Date.now(),
    sessionEndTime: null,
    totalCards,
    reviewedCards: 0,
    learnedCards: 0,
    reviewCards: 0,
    averageTimePerCard: 0,
    totalStudyTime: 0,
    longestStreak: 0,
    currentStreak: 0,
    cardMetrics: {}
  });
  
  // Initialize a card's metrics when it's first viewed
  const startCardView = useCallback((cardId: string) => {
    setMetrics(prev => {
      // Skip if we already have metrics for this card
      if (prev.cardMetrics[cardId]) return prev;
      
      const now = Date.now();
      return {
        ...prev,
        cardMetrics: {
          ...prev.cardMetrics,
          [cardId]: {
            id: cardId,
            viewStartTime: now,
            viewDuration: null,
            flipTime: null,
            flipDuration: null,
            decisionTime: null,
            decision: null
          }
        }
      };
    });
  }, []);
  
  // Record when a card is flipped
  const recordFlip = useCallback((cardId: string) => {
    setMetrics(prev => {
      const cardMetric = prev.cardMetrics[cardId];
      if (!cardMetric) return prev;
      
      const now = Date.now();
      return {
        ...prev,
        cardMetrics: {
          ...prev.cardMetrics,
          [cardId]: {
            ...cardMetric,
            flipTime: now,
            flipDuration: now - cardMetric.viewStartTime
          }
        }
      };
    });
  }, []);
  
  // Record when a decision is made on a card (learned or review)
  const recordDecision = useCallback((cardId: string, decision: FlashcardReviewStatus) => {
    setMetrics(prev => {
      const cardMetric = prev.cardMetrics[cardId];
      if (!cardMetric) return prev;
      
      const now = Date.now();
      const newMetrics = {
        ...prev,
        reviewedCards: prev.reviewedCards + 1,
        cardMetrics: {
          ...prev.cardMetrics,
          [cardId]: {
            ...cardMetric,
            decisionTime: cardMetric.flipTime ? now - cardMetric.flipTime : null,
            viewDuration: now - cardMetric.viewStartTime,
            decision
          }
        }
      };
      
      // Update learned/review counters
      if (decision === 'learned') {
        newMetrics.learnedCards += 1;
        newMetrics.currentStreak += 1;
      } else {
        newMetrics.reviewCards += 1;
        newMetrics.currentStreak = 0;
      }
      
      // Update longest streak if needed
      if (newMetrics.currentStreak > newMetrics.longestStreak) {
        newMetrics.longestStreak = newMetrics.currentStreak;
      }
      
      // Calculate average time per card
      const cardsWithTime = Object.values(newMetrics.cardMetrics)
        .filter(card => card.viewDuration !== null);
      
      if (cardsWithTime.length > 0) {
        const totalTime = cardsWithTime.reduce((sum, card) => 
          sum + (card.viewDuration || 0), 0);
        newMetrics.averageTimePerCard = totalTime / cardsWithTime.length;
        newMetrics.totalStudyTime = totalTime;
      }
      
      return newMetrics;
    });
  }, []);
  
  // Complete the session and finalize metrics
  const completeSession = useCallback(() => {
    setMetrics(prev => {
      const completedMetrics = {
        ...prev,
        sessionEndTime: Date.now()
      };
      
      // Calculate total session time
      completedMetrics.totalStudyTime = completedMetrics.sessionEndTime - 
        completedMetrics.sessionStartTime;
      
      // Call completion callback if provided
      if (onSessionComplete) {
        onSessionComplete(completedMetrics);
      }
      
      return completedMetrics;
    });
  }, [onSessionComplete]);
  
  // Generate a report object for analytics
  const getMetricsReport = useCallback(() => {
    const {
      totalCards,
      reviewedCards,
      learnedCards,
      reviewCards,
      averageTimePerCard,
      totalStudyTime,
      longestStreak,
      sessionStartTime,
      sessionEndTime
    } = metrics;
    
    const learnedPercentage = totalCards > 0 ? (learnedCards / totalCards) * 100 : 0;
    const completionPercentage = totalCards > 0 ? (reviewedCards / totalCards) * 100 : 0;
    
    return {
      totalCards,
      reviewedCards,
      learnedCards,
      learnedPercentage,
      reviewCards,
      completionPercentage,
      averageTimePerCard,
      totalStudyTime,
      longestStreak,
      sessionDuration: sessionEndTime ? sessionEndTime - sessionStartTime : null,
      isCompleted: sessionEndTime !== null
    };
  }, [metrics]);
  
  // Reset all metrics
  const resetMetrics = useCallback(() => {
    setMetrics({
      sessionStartTime: Date.now(),
      sessionEndTime: null,
      totalCards,
      reviewedCards: 0,
      learnedCards: 0,
      reviewCards: 0,
      averageTimePerCard: 0,
      totalStudyTime: 0,
      longestStreak: 0,
      currentStreak: 0,
      cardMetrics: {}
    });
  }, [totalCards]);
  
  return {
    metrics: getMetricsReport(),
    startCardView,
    recordFlip,
    recordDecision,
    completeSession,
    resetMetrics
  };
} 