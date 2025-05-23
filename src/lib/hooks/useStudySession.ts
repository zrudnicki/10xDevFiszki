import { useState, useEffect, useCallback, useRef } from "react";
import type { 
  SessionViewState, 
  SessionOptions, 
  SessionFlashcardViewModel,
  FlashcardDueDto,
  FlashcardReviewStatus
} from "@/types";
import { useLocalStorageSession } from "./useLocalStorageSession";
import { addToOfflineQueue, processOfflineQueue, hasQueuedRequests } from "../utils/offlineQueue";

// Analytics event types
export type StudyEvent = 
  | 'session_start'
  | 'session_complete'
  | 'session_pause'
  | 'session_resume'
  | 'card_flip'
  | 'card_marked_learned'
  | 'card_marked_review';

// Session metrics for performance tracking
interface SessionMetrics {
  startTime: number;
  endTime: number | null;
  totalCards: number;
  cardsLearned: number;
  cardsToReview: number;
  timePerCard: {
    [cardId: string]: {
      viewStartTime: number;
      viewDuration: number | null;
      flipTime: number | null;
      flipDuration: number | null;
      decisionTime: number | null;
    }
  };
  totalPauseDuration: number;
  pauseStartTime: number | null;
}

// Funkcja mapująca DTO na ViewModel
const mapFlashcardDueToViewModel = (
  dto: FlashcardDueDto,
  collectionName?: string,
  categoryName?: string
): SessionFlashcardViewModel => ({
  id: dto.id,
  front: dto.front,
  back: dto.back,
  collection_id: dto.collection_id,
  category_id: dto.category_id,
  is_flipped: false,
  review_status: null,
  collection_name: collectionName,
  category_name: categoryName
});

// Częstotliwość automatycznego zapisu sesji (10 sekund)
const AUTO_SAVE_INTERVAL = 10000;

// Częstotliwość sprawdzania i procesowania kolejki offline (30 sekund)
const QUEUE_PROCESS_INTERVAL = 30000;

export const useStudySession = (options?: SessionOptions) => {
  // Initial state for the study session
  const initialState: SessionViewState = {
    is_loading: true,
    is_submitting: false,
    is_completed: false,
    is_paused: false,
    current_index: 0,
    flashcards: [],
    error: null,
    stats: { 
      total: 0, 
      learned: 0, 
      to_review: 0 
    }
  };
  
  const [state, setState] = useState<SessionViewState>(initialState);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [pendingSync, setPendingSync] = useState<boolean>(false);
  const optionsRef = useRef(options);
  const autoSaveTimerRef = useRef<number | null>(null);
  const queueProcessTimerRef = useRef<number | null>(null);
  
  // Performance tracking metrics
  const [metrics, setMetrics] = useState<SessionMetrics>({
    startTime: Date.now(),
    endTime: null,
    totalCards: 0,
    cardsLearned: 0,
    cardsToReview: 0,
    timePerCard: {},
    totalPauseDuration: 0,
    pauseStartTime: null
  });
  
  const { 
    loadSession, 
    saveSession, 
    pendingSync: localStoragePendingSync, 
    addToPendingSync, 
    removeFromPendingSync, 
    clearSession 
  } = useLocalStorageSession();
  
  // Track study event for analytics
  const trackEvent = useCallback((event: StudyEvent, data?: any) => {
    try {
      // Simple logging for now, could be expanded to send to analytics service
      console.log(`Study Event: ${event}`, data);
      
      // Update metrics based on event type
      setMetrics(prev => {
        const updatedMetrics = { ...prev };
        
        switch (event) {
          case 'session_start':
            updatedMetrics.startTime = Date.now();
            break;
            
          case 'session_complete':
            updatedMetrics.endTime = Date.now();
            updatedMetrics.cardsLearned = data?.learned || 0;
            updatedMetrics.cardsToReview = data?.toReview || 0;
            updatedMetrics.totalCards = data?.total || 0;
            
            // Save study metrics to localStorage
            try {
              localStorage.setItem('last_study_metrics', JSON.stringify(updatedMetrics));
            } catch (e) {
              console.warn('Failed to save study metrics', e);
            }
            break;
            
          case 'session_pause':
            updatedMetrics.pauseStartTime = Date.now();
            break;
            
          case 'session_resume':
            if (updatedMetrics.pauseStartTime) {
              const pauseDuration = Date.now() - updatedMetrics.pauseStartTime;
              updatedMetrics.totalPauseDuration += pauseDuration;
              updatedMetrics.pauseStartTime = null;
            }
            break;
            
          case 'card_flip':
            if (data?.cardId) {
              const cardId = data.cardId;
              if (!updatedMetrics.timePerCard[cardId]) {
                updatedMetrics.timePerCard[cardId] = {
                  viewStartTime: Date.now(),
                  viewDuration: null,
                  flipTime: Date.now(),
                  flipDuration: null,
                  decisionTime: null
                };
              } else {
                updatedMetrics.timePerCard[cardId].flipTime = Date.now();
              }
            }
            break;
            
          case 'card_marked_learned':
          case 'card_marked_review':
            if (data?.cardId) {
              const cardId = data.cardId;
              if (updatedMetrics.timePerCard[cardId]) {
                const cardMetrics = updatedMetrics.timePerCard[cardId];
                
                // Calculate decision time (time from flip to marking)
                if (cardMetrics.flipTime) {
                  cardMetrics.decisionTime = Date.now() - cardMetrics.flipTime;
                }
                
                // Calculate total view duration
                cardMetrics.viewDuration = Date.now() - cardMetrics.viewStartTime;
              }
            }
            break;
        }
        
        return updatedMetrics;
      });
    } catch (error) {
      console.warn('Failed to track study event', error);
    }
  }, []);
  
  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Load flashcards from API
  const loadFlashcards = useCallback(async () => {
    // Prevent multiple simultaneous API calls
    if (state.is_loading) {
      console.log("Already loading flashcards, skipping...");
      return;
    }
    
    console.log("Starting to load flashcards with options:", optionsRef.current);
    setState(prev => ({ ...prev, is_loading: true, error: null }));

    // Add a timeout to prevent infinite loading state
    const timeoutId = setTimeout(() => {
      setState(prev => {
        if (prev.is_loading) {
          console.error("Loading timed out after 10 seconds");
          return {
            ...prev,
            is_loading: false,
            error: "Loading timed out. Please try again."
          };
        }
        return prev;
      });
    }, 10000); // 10 seconds timeout
    
    try {
      // Check if we have a saved session to restore
      const savedSession = loadSession();
      if (savedSession && savedSession.flashcards.length > 0) {
        console.log("Found saved session, restoring...");
        clearTimeout(timeoutId); // Clear timeout if we load from cache
        setState(savedSession);
        
        // Track session resume from saved state
        trackEvent('session_start', { 
          resumed: true, 
          cardCount: savedSession.flashcards.length 
        });
        
        return;
      }
      
      // Build query parameters
      const params = new URLSearchParams();
      if (optionsRef.current?.collection_id) {
        params.append('collectionId', optionsRef.current.collection_id);
      }
      if (optionsRef.current?.category_id) {
        params.append('categoryId', optionsRef.current.category_id);
      }
      if (optionsRef.current?.limit) {
        params.append('limit', optionsRef.current.limit.toString());
      }
      if (optionsRef.current?.strategy) {
        params.append('strategy', optionsRef.current.strategy);
      }
      
      console.log("Fetching flashcards from API with params:", params.toString());
      const response = await fetch(`/api/flashcards/due?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API error:", errorData);
        throw new Error(errorData.message || `Failed to load flashcards: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Received flashcards:", data);

      if (!data.flashcards || data.flashcards.length === 0) {
        console.log("No flashcards available");
        setState(prev => ({
          ...prev,
          is_loading: false,
          error: "No flashcards available for study."
        }));
        return;
      }

      // Map DTOs to ViewModels
      const flashcards = data.flashcards.map((dto: FlashcardDueDto) =>
        mapFlashcardDueToViewModel(
          dto,
          data.collection_name,
          data.category_name
        )
      );
      
      // Update state with loaded flashcards
      const newState = {
        is_loading: false,
        is_submitting: false,
        is_completed: false,
        is_paused: false,
        current_index: 0,
        flashcards,
        error: null,
        stats: {
          total: flashcards.length,
          learned: 0,
          to_review: 0
        }
      };
      
      setState(newState);
      
      // Save session to localStorage
      saveSession(newState);
      
      // Track session start
      trackEvent('session_start', { 
        cardCount: flashcards.length,
        collectionId: optionsRef.current?.collection_id,
        categoryId: optionsRef.current?.category_id
      });
      
    } catch (error) {
      console.error("Error loading flashcards:", error);
      setState(prev => ({ 
        ...prev, 
        is_loading: false, 
        error: error instanceof Error ? error.message : "Failed to load flashcards" 
      }));
    } finally {
      clearTimeout(timeoutId);
    }
  }, [state.is_loading, loadSession, saveSession, trackEvent]);
  
  // Mark a flashcard with a review status (learned or review)
  const markFlashcard = useCallback(async (status: FlashcardReviewStatus) => {
    if (state.is_submitting || state.flashcards.length === 0) return;
    
    const currentIndex = state.current_index;
    const currentFlashcard = state.flashcards[currentIndex];
    
    setState(prev => ({ ...prev, is_submitting: true }));
    
    // Track the marking event
    trackEvent(
      status === 'learned' ? 'card_marked_learned' : 'card_marked_review',
      { cardId: currentFlashcard.id }
    );
    
    try {
      // Update flashcard in state
      const updatedFlashcards = [...state.flashcards];
      updatedFlashcards[currentIndex] = {
        ...updatedFlashcards[currentIndex],
        review_status: status
      };
      
      // Update stats
      const updatedStats = { ...state.stats };
      if (status === "learned") {
        updatedStats.learned += 1;
      } else {
        updatedStats.to_review += 1;
      }
      
      // Check if this is the last flashcard
      const isLastCard = currentIndex >= state.flashcards.length - 1;
      const nextIndex = isLastCard ? currentIndex : currentIndex + 1;
      
      // If moving to next card, set up timing for next card
      if (!isLastCard) {
        setMetrics(prev => {
          const nextCardId = state.flashcards[nextIndex].id;
          const now = Date.now();
          
          const timePerCard = { ...prev.timePerCard };
          timePerCard[nextCardId] = {
            viewStartTime: now,
            viewDuration: null,
            flipTime: null,
            flipDuration: null,
            decisionTime: null
          };
          
          return { ...prev, timePerCard };
        });
      } else {
        // If session is completed, track completion
        trackEvent('session_complete', {
          learned: updatedStats.learned,
          toReview: updatedStats.to_review,
          total: updatedStats.total
        });
      }
      
      const newState = {
        ...state,
        is_submitting: false,
        is_completed: isLastCard,
        current_index: nextIndex,
        flashcards: updatedFlashcards,
        stats: updatedStats
      };
      
      setState(newState);
      saveSession(newState);
      
      // If offline, add to pending sync
      if (isOffline) {
        addToPendingSync(currentFlashcard.id, status);
      } else {
        // Send update to server
        await updateFlashcardStatus(currentFlashcard.id, status);
      }
      
    } catch (error) {
      console.error("Error marking flashcard:", error);
      setState(prev => ({ ...prev, is_submitting: false }));
    }
  }, [state, isOffline, addToPendingSync, saveSession, trackEvent]);
  
  // Send flashcard review status to the server
  const updateFlashcardStatus = async (flashcardId: string, status: FlashcardReviewStatus) => {
    try {
      const response = await fetch(`/api/flashcards/${flashcardId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update flashcard status: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error updating flashcard status:", error);
      
      // If API request fails, add to pending sync
      if (!isOffline) {
        addToPendingSync(flashcardId, status);
      }
      
      throw error;
    }
  };
  
  // Synchronize pending flashcard status updates when back online
  const syncOfflineData = useCallback(async () => {
    if (isOffline || localStoragePendingSync.length === 0) return;
    
    const syncedIds: string[] = [];
    
    for (const item of localStoragePendingSync) {
      try {
        await updateFlashcardStatus(item.flashcardId, item.status);
        syncedIds.push(item.flashcardId);
      } catch (error) {
        console.error(`Failed to sync flashcard ${item.flashcardId}:`, error);
      }
    }
    
    // Remove successfully synced items
    if (syncedIds.length > 0) {
      removeFromPendingSync(syncedIds);
    }
  }, [isOffline, localStoragePendingSync, removeFromPendingSync]);
  
  // Sync when coming back online
  useEffect(() => {
    if (!isOffline && localStoragePendingSync.length > 0) {
      syncOfflineData();
    }
  }, [isOffline, localStoragePendingSync, syncOfflineData]);
  
  // Flip the current flashcard
  const flipCard = useCallback(() => {
    if (state.flashcards.length === 0) return;
    
    const currentFlashcard = state.flashcards[state.current_index];
    const isCurrentlyFlipped = currentFlashcard.is_flipped;
    
    // Track card flip event
    trackEvent('card_flip', { 
      cardId: currentFlashcard.id,
      toFront: isCurrentlyFlipped,
      toBack: !isCurrentlyFlipped
    });
    
    setState(prev => {
      const updatedFlashcards = [...prev.flashcards];
      updatedFlashcards[prev.current_index] = {
        ...updatedFlashcards[prev.current_index],
        is_flipped: !updatedFlashcards[prev.current_index].is_flipped
      };
      
      const newState = {
        ...prev,
        flashcards: updatedFlashcards
      };
      
      saveSession(newState);
      return newState;
    });
  }, [state.flashcards, state.current_index, saveSession, trackEvent]);
  
  // Toggle pause state
  const togglePause = useCallback(() => {
    setState(prev => {
      const newIsPaused = !prev.is_paused;
      
      // Track pause/resume event
      trackEvent(newIsPaused ? 'session_pause' : 'session_resume');
      
      const newState = {
        ...prev,
        is_paused: newIsPaused
      };
      
      saveSession(newState);
      return newState;
    });
  }, [saveSession, trackEvent]);
  
  // End the current session
  const endSession = useCallback(() => {
    // Track session completion
    trackEvent('session_complete', {
      learned: state.stats.learned,
      toReview: state.stats.to_review,
      total: state.stats.total,
      completed: true,
      wasManuallyEnded: true
    });
    
    setState(prev => {
      const newState = {
        ...prev,
        is_completed: true,
        is_paused: false
      };
      
      saveSession(newState);
      return newState;
    });
  }, [state.stats, saveSession, trackEvent]);
  
  // Reset the session to start over
  const resetSession = useCallback(() => {
    clearSession();
    setState(initialState);
    loadFlashcards();
  }, [clearSession, initialState, loadFlashcards]);
  
  // Ref to track if we've attempted loading
  const hasAttemptedLoad = useRef(false);
  
  // Load flashcards on initial mount - only once
  useEffect(() => {
    // Only load once on initial mount
    if (!hasAttemptedLoad.current) {
      hasAttemptedLoad.current = true;
      loadFlashcards();
    }
  }, []); // Empty dependency array to ensure it only runs once
  
  // Automatyczny zapis sesji co określony czas
  const setupAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      window.clearInterval(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = window.setInterval(() => {
      if (!state.is_loading && !state.is_completed && state.flashcards.length > 0) {
        saveSession(state, optionsRef.current || {});
      }
    }, AUTO_SAVE_INTERVAL);

    // Dodatkowo zapisujemy przy zamknięciu strony
    const handleBeforeUnload = () => {
      if (!state.is_loading && !state.is_completed && state.flashcards.length > 0) {
        saveSession(state, optionsRef.current || {});
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (autoSaveTimerRef.current) {
        window.clearInterval(autoSaveTimerRef.current);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [state, saveSession]);

  // Skonfiguruj timer dla przetwarzania kolejki offline
  const setupQueueProcessing = useCallback(() => {
    if (queueProcessTimerRef.current) {
      window.clearInterval(queueProcessTimerRef.current);
    }

    // Natychmiast sprawdź, czy są oczekujące żądania
    syncOfflineData();

    // Ustaw interwał do regularnego sprawdzania
    queueProcessTimerRef.current = window.setInterval(() => {
      syncOfflineData();
    }, QUEUE_PROCESS_INTERVAL);

    // Dodatkowo słuchaj zmiany stanu online
    const handleOnline = () => {
      syncOfflineData();
    };

    window.addEventListener('online', handleOnline);

    return () => {
      if (queueProcessTimerRef.current) {
        window.clearInterval(queueProcessTimerRef.current);
      }
      window.removeEventListener('online', handleOnline);
    };
  }, [syncOfflineData]);

  // Efekt inicjalizujący sesję
  useEffect(() => {
    // Aktualizacja referencji do opcji
    optionsRef.current = options;
    
    // Skonfiguruj automatyczny zapis
    const cleanupAutoSave = setupAutoSave();
    
    // Skonfiguruj przetwarzanie kolejki offline
    const cleanupQueueProcessing = setupQueueProcessing();
    
    // Hook czyszczący
    return () => {
      cleanupAutoSave();
      cleanupQueueProcessing();
    };
  }, [loadFlashcards, setupAutoSave, setupQueueProcessing, options]);

  // Get study metrics (for export or display)
  const getSessionMetrics = useCallback(() => {
    const totalStudyTime = metrics.endTime 
      ? metrics.endTime - metrics.startTime - metrics.totalPauseDuration 
      : Date.now() - metrics.startTime - metrics.totalPauseDuration;
    
    const avgTimePerCard = metrics.totalCards > 0 
      ? totalStudyTime / metrics.totalCards 
      : 0;
    
    return {
      totalStudyTime,
      avgTimePerCard,
      totalCards: metrics.totalCards,
      cardsLearned: metrics.cardsLearned,
      cardsToReview: metrics.cardsToReview,
      completionRate: metrics.totalCards > 0 
        ? (metrics.cardsLearned + metrics.cardsToReview) / metrics.totalCards * 100 
        : 0
    };
  }, [metrics]);

  return {
    state,
    pendingSync: localStoragePendingSync.length > 0,
    metrics: getSessionMetrics(),
    markFlashcard,
    flipCard,
    togglePause,
    endSession,
    resetSession,
    loadFlashcards,
    syncOfflineData
  };
}; 