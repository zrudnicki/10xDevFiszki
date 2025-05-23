import { useState, useEffect, useCallback, useRef } from "react";
import { FlashcardDisplay } from "./FlashcardDisplay";
import { FlashcardControls } from "./FlashcardControls";
import { SessionProgress } from "./SessionProgress";
import { SessionActions } from "./SessionActions";
import { SessionSummary } from "./SessionSummary";
import { useStudySession } from "@/lib/hooks/useStudySession";
import { useKeyboardNavigation } from "@/lib/hooks/useKeyboardNavigation";
import { useStudyMetrics } from "@/lib/hooks/useStudyMetrics";
import { ConnectionStatusBanner } from "./study/ConnectionStatusBanner";
import { ErrorView } from "./study/ErrorView";
import { NoFlashcardsView } from "./study/NoFlashcardsView";
import { PauseOverlay } from "./study/PauseOverlay";
import { KeyboardShortcutsHelp } from "./study/KeyboardShortcutsHelp";
import { FlashcardTransition } from "./study/FlashcardTransition";
import { StudySessionStats } from "./study/StudySessionStats";
import { StudyStrategySelector } from "./study/StudyStrategySelector";
import type { StudyStrategy } from "./study/StudyStrategySelector";
import { Badge } from "@/components/ui/badge";
import { Loader2, HelpCircle } from "lucide-react";
import type { SessionOptions, FlashcardReviewStatus } from "@/types";

interface StudySessionProps {
  collectionId?: string;
  categoryId?: string;
  limit?: number;
}

export const StudySession = ({
  collectionId,
  categoryId,
  limit
}: StudySessionProps) => {
  const navigate = (path: string) => {
    window.location.href = path;
  };
  
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [transitionDirection, setTransitionDirection] = useState<"left" | "right" | null>(null);
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [studyStrategy, setStudyStrategy] = useState<StudyStrategy>("spaced-repetition");
  const [isStrategySelectVisible, setIsStrategySelectVisible] = useState<boolean>(true);
  const prevIndexRef = useRef<number>(0);
  
  const options: SessionOptions = {
    collection_id: collectionId,
    category_id: categoryId,
    limit: limit || 20, // domyślny limit 20 fiszek
    strategy: studyStrategy
  };

  const {
    state,
    pendingSync,
    markFlashcard,
    flipCard,
    togglePause,
    endSession,
    resetSession,
    loadFlashcards,
    syncOfflineData
  } = useStudySession(options);

  // Initialize metrics tracking
  const { 
    metrics,
    startCardView,
    recordFlip,
    recordDecision,
    completeSession
  } = useStudyMetrics({
    totalCards: state.flashcards.length,
    onSessionComplete: (finalMetrics) => {
      console.log("Session completed with metrics:", finalMetrics);
      // Here we could send the metrics to an analytics endpoint
    }
  });

  // Track current card for metrics
  useEffect(() => {
    if (!state.is_loading && state.flashcards.length > 0 && state.current_index < state.flashcards.length) {
      const currentCard = state.flashcards[state.current_index];
      startCardView(currentCard.id);
    }
  }, [state.current_index, state.is_loading, state.flashcards, startCardView]);

  // Sprawdzenie preferencji użytkownika dotyczących redukcji ruchu
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Monitorowanie stanu połączenia
  useEffect(() => {
    const handleOnline = () => {
      setIsOfflineMode(false);
    };
    
    const handleOffline = () => {
      setIsOfflineMode(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Sprawdzenie początkowego stanu
    setIsOfflineMode(!navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitorowanie zmiany indeksu dla animacji kierunku
  useEffect(() => {
    if (prevIndexRef.current !== state.current_index && state.flashcards.length > 0) {
      const direction = state.flashcards[state.current_index]?.review_status === "learned" ? "right" : "left";
      setTransitionDirection(direction);
      prevIndexRef.current = state.current_index;
    }
  }, [state.current_index, state.flashcards]);

  // Obsługa skrótów klawiaturowych
  useKeyboardNavigation(
    () => {
      flipCard();
      if (!state.flashcards[state.current_index]?.is_flipped) {
        recordFlip(state.flashcards[state.current_index].id);
      }
    },
    () => handleMarkFlashcard("learned"),
    () => handleMarkFlashcard("review"),
    !state.is_completed && !state.is_paused,
    {
      onHelp: () => setIsHelpOpen(!isHelpOpen),
      onPause: () => togglePause()
    }
  );

  // Metoda do powrotu do dashboardu
  const handleBackToDashboard = () => {
    navigate('/');
  };

  // Metoda do przejścia do tworzenia fiszek
  const handleCreateFlashcards = () => {
    navigate('/flashcards/create');
  };

  // Metoda do ponownego połączenia
  const handleConnectionRetry = () => {
    // Sprawdzenie czy jest połączenie, jeśli tak - synchronizuj dane
    if (navigator.onLine) {
      syncOfflineData();
      setIsOfflineMode(false);
    }
  };

  // Metoda do oznaczania fiszki z określeniem kierunku
  const handleMarkFlashcard = (status: FlashcardReviewStatus) => {
    setTransitionDirection(status === "learned" ? "right" : "left");
    
    // Record metrics before marking the card
    if (state.current_index < state.flashcards.length) {
      recordDecision(state.flashcards[state.current_index].id, status);
    }
    
    markFlashcard(status);
    
    // If this was the last card, complete the session metrics
    if (state.current_index >= state.flashcards.length - 1) {
      completeSession();
    }
  };

  // Metoda do zmiany strategii nauki
  const handleStrategyChange = (strategy: StudyStrategy) => {
    setStudyStrategy(strategy);
  };

  // Metoda do rozpoczęcia sesji po wyborze strategii
  const handleStartSession = () => {
    setIsStrategySelectVisible(false);
    loadFlashcards();
  };

  // Track if we've attempted to start a session
  const [hasAttemptedStart, setHasAttemptedStart] = useState<boolean>(false);

  // Jeśli wyświetlamy wybór strategii
  if (isStrategySelectVisible) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <StudyStrategySelector
          selectedStrategy={studyStrategy}
          onStrategyChange={handleStrategyChange}
          onStartSession={() => {
            setHasAttemptedStart(true);
            handleStartSession();
          }}
          isLoading={hasAttemptedStart && state.is_loading}
        />
      </div>
    );
  }

  // Jeśli trwa ładowanie
  if (state.is_loading) {
    const [showRetryButton, setShowRetryButton] = useState(false);
    
    // Show retry button after 5 seconds of loading
    useEffect(() => {
      const timeoutId = setTimeout(() => {
        setShowRetryButton(true);
      }, 5000);
      
      return () => clearTimeout(timeoutId);
    }, []);
    
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground mb-4">Ładowanie fiszek...</p>
        
        {showRetryButton && (
          <button 
            onClick={() => {
              console.log("Retrying session load...");
              resetSession();
              loadFlashcards();
            }} 
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            Spróbuj ponownie
          </button>
        )}
      </div>
    );
  }

  // Jeśli wystąpił błąd
  if (state.error) {
    console.error("Study session error:", state.error);
    return (
      <ErrorView 
        error={state.error} 
        onRetry={() => {
          console.log("Retrying after error...");
          resetSession();
          loadFlashcards();
        }}
        onBackToDashboard={handleBackToDashboard}
      />
    );
  }

  // Jeśli nie ma fiszek
  if (state.flashcards.length === 0) {
    return (
      <NoFlashcardsView
        onCreateFlashcards={handleCreateFlashcards}
        onBackToDashboard={handleBackToDashboard}
      />
    );
  }

  // Jeśli sesja jest zakończona
  if (state.is_completed) {
    return (
      <SessionSummary
        stats={state.stats}
        onStartNewSession={() => {
          console.log("Starting new session...");
          resetSession();
          setIsStrategySelectVisible(true);
        }}
        onBackToDashboard={handleBackToDashboard}
      />
    );
  }

  // Główny widok sesji
  return (
    <div className="relative">
      <ConnectionStatusBanner
        isOffline={isOfflineMode}
        onRetry={handleConnectionRetry}
        pendingSync={pendingSync}
      />

      <div className="flex justify-between items-center mb-4">
        <SessionProgress
          current={state.current_index + 1}
          total={state.flashcards.length}
          stats={state.stats}
        />
          <button 
          onClick={() => setIsHelpOpen(!isHelpOpen)}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
          <HelpCircle className="h-5 w-5" />
          </button>
        </div>
        
      <FlashcardTransition direction={transitionDirection}>
        <FlashcardDisplay
          flashcard={state.flashcards[state.current_index]}
          onFlip={() => {
            flipCard();
            if (!state.flashcards[state.current_index]?.is_flipped) {
              recordFlip(state.flashcards[state.current_index].id);
            }
          }}
          isReducedMotion={isReducedMotion}
        />
      </FlashcardTransition>

      <FlashcardControls
          onMarkLearned={() => handleMarkFlashcard("learned")}
          onMarkReview={() => handleMarkFlashcard("review")}
        isDisabled={state.is_paused}
        />
        
          <SessionActions
        onPause={() => {
          console.log("Pausing session...");
          togglePause();
        }}
        onEnd={() => {
          console.log("Ending session...");
          endSession();
        }}
            isPaused={state.is_paused}
      />

      {isHelpOpen && (
        <KeyboardShortcutsHelp onClose={() => setIsHelpOpen(false)} />
      )}

      {state.is_paused && (
        <PauseOverlay
          onResume={() => {
            console.log("Resuming session...");
            togglePause();
          }}
          onEnd={endSession}
          />
      )}
      </div>
  );
}; 