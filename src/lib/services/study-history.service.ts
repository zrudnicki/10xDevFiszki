/**
 * Study History Service
 * 
 * Tracks and analyzes user's learning patterns and study history
 * Provides metrics for user performance and learning efficiency
 */

// Study session record types
interface StudySessionRecord {
  id: string;
  startTime: string;
  endTime: string;
  totalCards: number;
  learnedCards: number;
  reviewCards: number;
  completionRate: number;
  averageTimePerCard: number;
  collectionId?: string;
  categoryId?: string;
}

interface CardInteractionRecord {
  flashcardId: string;
  sessionId: string;
  status: 'learned' | 'review';
  viewDuration: number;
  decisionTime: number;
  timestamp: string;
}

// Storage keys
const STORAGE_KEYS = {
  STUDY_SESSIONS: 'fiszki_study_sessions',
  CARD_INTERACTIONS: 'fiszki_card_interactions'
};

// Maximum number of sessions to store locally (oldest will be dropped)
const MAX_STORED_SESSIONS = 50;
const MAX_STORED_INTERACTIONS = 500;

/**
 * Records a completed study session
 * @param sessionData Session metrics and data
 */
export function recordStudySession(sessionData: {
  startTime: number;
  endTime: number;
  totalCards: number;
  learnedCards: number;
  reviewCards: number;
  averageTimePerCard: number;
  collectionId?: string;
  categoryId?: string;
}): string {
  try {
    const sessionId = crypto.randomUUID();
    
    const sessionRecord: StudySessionRecord = {
      id: sessionId,
      startTime: new Date(sessionData.startTime).toISOString(),
      endTime: new Date(sessionData.endTime).toISOString(),
      totalCards: sessionData.totalCards,
      learnedCards: sessionData.learnedCards,
      reviewCards: sessionData.reviewCards,
      completionRate: sessionData.totalCards > 0 
        ? (sessionData.learnedCards + sessionData.reviewCards) / sessionData.totalCards * 100 
        : 0,
      averageTimePerCard: sessionData.averageTimePerCard,
      collectionId: sessionData.collectionId,
      categoryId: sessionData.categoryId
    };
    
    // Get existing sessions
    const existingSessions = getSavedSessions();
    
    // Add new session
    existingSessions.unshift(sessionRecord);
    
    // Limit the number of stored sessions
    const limitedSessions = existingSessions.slice(0, MAX_STORED_SESSIONS);
    
    // Save updated sessions
    localStorage.setItem(STORAGE_KEYS.STUDY_SESSIONS, JSON.stringify(limitedSessions));
    
    console.log(`[StudyHistory] Recorded study session ${sessionId} with ${sessionData.totalCards} cards`);
    return sessionId;
  } catch (error) {
    console.error('[StudyHistory] Error recording study session:', error);
    return '';
  }
}

/**
 * Records individual flashcard interactions during a study session
 * @param sessionId ID of the current study session
 * @param interactions List of card interactions to record
 */
export function recordCardInteractions(
  sessionId: string,
  interactions: Array<{
    flashcardId: string;
    status: 'learned' | 'review';
    viewDuration: number;
    decisionTime: number;
  }>
): void {
  try {
    if (!sessionId || interactions.length === 0) {
      return;
    }
    
    // Get existing interactions
    const existingInteractions = getSavedCardInteractions();
    
    // Create new interaction records
    const newInteractions: CardInteractionRecord[] = interactions.map(interaction => ({
      flashcardId: interaction.flashcardId,
      sessionId,
      status: interaction.status,
      viewDuration: interaction.viewDuration,
      decisionTime: interaction.decisionTime,
      timestamp: new Date().toISOString()
    }));
    
    // Add new interactions
    const updatedInteractions = [...newInteractions, ...existingInteractions];
    
    // Limit the number of stored interactions
    const limitedInteractions = updatedInteractions.slice(0, MAX_STORED_INTERACTIONS);
    
    // Save updated interactions
    localStorage.setItem(STORAGE_KEYS.CARD_INTERACTIONS, JSON.stringify(limitedInteractions));
    
    console.log(`[StudyHistory] Recorded ${newInteractions.length} card interactions for session ${sessionId}`);
  } catch (error) {
    console.error('[StudyHistory] Error recording card interactions:', error);
  }
}

/**
 * Get saved study sessions
 * @returns List of saved study sessions
 */
export function getSavedSessions(): StudySessionRecord[] {
  try {
    const sessionsJson = localStorage.getItem(STORAGE_KEYS.STUDY_SESSIONS);
    return sessionsJson ? JSON.parse(sessionsJson) : [];
  } catch (error) {
    console.error('[StudyHistory] Error getting saved sessions:', error);
    return [];
  }
}

/**
 * Get saved card interactions
 * @returns List of saved card interactions
 */
export function getSavedCardInteractions(): CardInteractionRecord[] {
  try {
    const interactionsJson = localStorage.getItem(STORAGE_KEYS.CARD_INTERACTIONS);
    return interactionsJson ? JSON.parse(interactionsJson) : [];
  } catch (error) {
    console.error('[StudyHistory] Error getting saved card interactions:', error);
    return [];
  }
}

/**
 * Get learning analytics for the user's study history
 * @returns Object with various analytics metrics
 */
export function getStudyAnalytics() {
  try {
    const sessions = getSavedSessions();
    const interactions = getSavedCardInteractions();
    
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalCards: 0,
        successRate: 0,
        averageTimePerCard: 0,
        recentTrend: 0,
        hasData: false
      };
    }
    
    // Calculate overall stats
    const totalCards = sessions.reduce((sum, session) => sum + session.totalCards, 0);
    const totalLearned = sessions.reduce((sum, session) => sum + session.learnedCards, 0);
    const totalReviewed = sessions.reduce((sum, session) => sum + session.reviewCards, 0);
    
    // Overall success rate
    const successRate = (totalCards > 0) 
      ? (totalLearned / (totalLearned + totalReviewed)) * 100 
      : 0;
    
    // Average time per card
    const averageTimePerCard = sessions.reduce((sum, session) => {
      return sum + (session.averageTimePerCard * session.totalCards);
    }, 0) / totalCards;
    
    // Calculate trend based on most recent 5 sessions vs previous 5
    let recentTrend = 0;
    if (sessions.length >= 10) {
      const recent5 = sessions.slice(0, 5);
      const previous5 = sessions.slice(5, 10);
      
      const recentSuccessRate = recent5.reduce((sum, s) => sum + (s.learnedCards / (s.learnedCards + s.reviewCards)), 0) / 5;
      const previousSuccessRate = previous5.reduce((sum, s) => sum + (s.learnedCards / (s.learnedCards + s.reviewCards)), 0) / 5;
      
      recentTrend = recentSuccessRate - previousSuccessRate;
    }
    
    return {
      totalSessions: sessions.length,
      totalCards,
      successRate,
      averageTimePerCard,
      recentTrend,
      hasData: true
    };
  } catch (error) {
    console.error('[StudyHistory] Error calculating study analytics:', error);
    return {
      totalSessions: 0,
      totalCards: 0,
      successRate: 0,
      averageTimePerCard: 0,
      recentTrend: 0,
      hasData: false
    };
  }
} 