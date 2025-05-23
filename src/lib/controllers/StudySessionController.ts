import type { SessionOptions, SessionViewState, FlashcardReviewStatus, FlashcardDueDto } from "@/types";
import { saveSessionState, loadSessionState, clearSessionState, hasSavedSession } from "../utils/localStorageSync";
import { addToOfflineQueue, processOfflineQueue, hasQueuedRequests } from "../utils/offlineQueue";
import { recordStudySession, recordCardInteractions } from "../services/study-history.service";

/**
 * Controller responsible for coordinating study session state, API calls,
 * offline behavior, and persistence.
 */
export class StudySessionController {
  private _state: SessionViewState;
  private _options: SessionOptions;
  private _isOffline: boolean;
  private _pendingSync: boolean;
  private _sessionStartTime: number;
  private _cardMetrics: Record<string, {
    viewStartTime: number;
    viewDuration: number | null;
    flipTime: number | null;
    decisionTime: number | null;
  }>;
  private _autoSaveTimer: ReturnType<typeof setInterval> | null = null;
  private _syncTimer: ReturnType<typeof setInterval> | null = null;
  
  // Callbacks
  private _onStateChange: (state: SessionViewState) => void;
  private _onSyncStatusChange: (isPending: boolean) => void;
  
  /**
   * Create a new StudySessionController
   * @param options Study session options
   * @param onStateChange Callback when state changes
   * @param onSyncStatusChange Callback when sync status changes
   */
  constructor(
    options: SessionOptions,
    onStateChange: (state: SessionViewState) => void,
    onSyncStatusChange: (isPending: boolean) => void
  ) {
    this._options = options;
    this._onStateChange = onStateChange;
    this._onSyncStatusChange = onSyncStatusChange;
    this._isOffline = !navigator.onLine;
    this._pendingSync = false;
    this._sessionStartTime = Date.now();
    this._cardMetrics = {};
    
    // Initialize with default state
    this._state = {
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
    
    // Set up listeners for online/offline status
    window.addEventListener('online', this._handleOnline.bind(this));
    window.addEventListener('offline', this._handleOffline.bind(this));
    
    // Set up auto-save interval
    this._startAutoSave();
  }
  
  /**
   * Initialize the controller - either load saved session or fetch new data
   */
  public async initialize(): Promise<void> {
    try {
      // Check if there's a saved session first
      if (hasSavedSession()) {
        const savedState = loadSessionState();
        if (savedState) {
          this._state = savedState;
          this._updateState();
          console.log('[StudySessionController] Resumed session from localStorage');
        } else {
          await this._loadFlashcards();
        }
      } else {
        await this._loadFlashcards();
      }
    } catch (error) {
      console.error('[StudySessionController] Error initializing:', error);
      this._state.error = 'Failed to initialize study session';
      this._state.is_loading = false;
      this._updateState();
    }
  }
  
  /**
   * Clean up event listeners and timers
   */
  public dispose(): void {
    window.removeEventListener('online', this._handleOnline.bind(this));
    window.removeEventListener('offline', this._handleOffline.bind(this));
    
    this._stopAutoSave();
    if (this._syncTimer) {
      clearInterval(this._syncTimer);
      this._syncTimer = null;
    }
  }
  
  /**
   * Load flashcards from the API or use cached data if offline
   */
  private async _loadFlashcards(): Promise<void> {
    this._state.is_loading = true;
    this._updateState();
    
    try {
      // Build API URL with options
      let url = '/api/flashcards/due';
      const params = new URLSearchParams();
      
      if (this._options.collection_id) {
        params.append('collection_id', this._options.collection_id);
      }
      
      if (this._options.category_id) {
        params.append('category_id', this._options.category_id);
      }
      
      if (this._options.limit) {
        params.append('limit', this._options.limit.toString());
      }
      
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      // Fetch flashcards from API
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch flashcards: ${response.statusText}`);
      }
      
      const data: FlashcardDueDto[] = await response.json();
      
      if (data.length === 0) {
        this._state.is_loading = false;
        this._state.error = 'No flashcards due for review';
        this._updateState();
        return;
      }
      
      // Convert API data to session flashcards
      this._state.flashcards = data.map(card => ({
        id: card.id,
        front: card.front,
        back: card.back,
        collection_id: card.collection_id,
        category_id: card.category_id,
        is_flipped: false,
        review_status: null,
        collection_name: card.collection_name || undefined,
        category_name: card.category_name || undefined
      }));
      
      // Update stats
      this._state.stats.total = this._state.flashcards.length;
      this._state.is_loading = false;
      
      // Initialize metrics for each card
      this._state.flashcards.forEach(card => {
        this._cardMetrics[card.id] = {
          viewStartTime: 0,
          viewDuration: null,
          flipTime: null,
          decisionTime: null
        };
      });
      
      // If this is a new session, record the start time
      this._sessionStartTime = Date.now();
      
      // Start view time for the first card
      if (this._state.flashcards.length > 0) {
        const firstCardId = this._state.flashcards[0].id;
        this._cardMetrics[firstCardId].viewStartTime = Date.now();
      }
      
      this._updateState();
      
      // Save initial state
      this._saveState();
      
    } catch (error) {
      console.error('[StudySessionController] Error loading flashcards:', error);
      this._state.is_loading = false;
      this._state.error = 'Failed to load flashcards';
      this._updateState();
    }
  }
  
  /**
   * Flip the current flashcard
   */
  public flipCard(): void {
    const currentIndex = this._state.current_index;
    if (currentIndex >= this._state.flashcards.length) {
      return;
    }
    
    const card = this._state.flashcards[currentIndex];
    
    // Record flip time for metrics
    if (!card.is_flipped && this._cardMetrics[card.id]) {
      this._cardMetrics[card.id].flipTime = Date.now();
    }
    
    // Update the flipped state
    this._state.flashcards[currentIndex] = {
      ...card,
      is_flipped: !card.is_flipped
    };
    
    this._updateState();
    this._saveState();
  }
  
  /**
   * Mark the current flashcard with a review status
   * @param status The review status (learned or review)
   */
  public async markFlashcard(status: FlashcardReviewStatus): Promise<void> {
    const currentIndex = this._state.current_index;
    if (currentIndex >= this._state.flashcards.length) {
      return;
    }
    
    // Set submitting state
    this._state.is_submitting = true;
    this._updateState();
    
    try {
      const card = this._state.flashcards[currentIndex];
      
      // Calculate and store metrics for this card
      if (this._cardMetrics[card.id]) {
        const metrics = this._cardMetrics[card.id];
        const now = Date.now();
        
        // Calculate total view duration
        metrics.viewDuration = now - metrics.viewStartTime;
        
        // Calculate decision time (time from flip to decision)
        if (metrics.flipTime) {
          metrics.decisionTime = now - metrics.flipTime;
        }
      }
      
      // Update the card status
      this._state.flashcards[currentIndex] = {
        ...card,
        review_status: status
      };
      
      // Update statistics
      if (status === 'learned') {
        this._state.stats.learned++;
      } else {
        this._state.stats.to_review++;
      }
      
      // Send to API or queue if offline
      if (this._isOffline) {
        addToOfflineQueue(
          `/api/flashcards/${card.id}/review`,
          'POST',
          { status }
        );
        this._setPendingSync(true);
      } else {
        try {
          const response = await fetch(`/api/flashcards/${card.id}/review`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
          });
          
          if (!response.ok) {
            console.warn(`[StudySessionController] Failed to update flashcard status: ${response.statusText}`);
            // Queue for retry
            addToOfflineQueue(
              `/api/flashcards/${card.id}/review`,
              'POST',
              { status }
            );
            this._setPendingSync(true);
          }
        } catch (error) {
          console.error('[StudySessionController] Error submitting flashcard review:', error);
          // Queue for retry
          addToOfflineQueue(
            `/api/flashcards/${card.id}/review`,
            'POST',
            { status }
          );
          this._setPendingSync(true);
        }
      }
      
      // Move to next card or complete session
      if (currentIndex < this._state.flashcards.length - 1) {
        this._state.current_index++;
        
        // Start tracking metrics for the next card
        const nextCardId = this._state.flashcards[this._state.current_index].id;
        if (this._cardMetrics[nextCardId]) {
          this._cardMetrics[nextCardId].viewStartTime = Date.now();
        }
      } else {
        this._completeSession();
      }
      
      this._state.is_submitting = false;
      this._updateState();
      this._saveState();
      
    } catch (error) {
      console.error('[StudySessionController] Error marking flashcard:', error);
      this._state.is_submitting = false;
      this._updateState();
    }
  }
  
  /**
   * Toggle pause state of the session
   */
  public togglePause(): void {
    this._state.is_paused = !this._state.is_paused;
    this._updateState();
    this._saveState();
  }
  
  /**
   * End the current session
   */
  public endSession(): void {
    this._completeSession();
  }
  
  /**
   * Mark the session as completed and record stats
   */
  private _completeSession(): void {
    this._state.is_completed = true;
    this._updateState();
    
    // Record session completion in study history
    const sessionEndTime = Date.now();
    const sessionDuration = sessionEndTime - this._sessionStartTime;
    
    // Calculate average time per card
    let totalCardTime = 0;
    let countedCards = 0;
    
    Object.values(this._cardMetrics).forEach(metrics => {
      if (metrics.viewDuration !== null) {
        totalCardTime += metrics.viewDuration;
        countedCards++;
      }
    });
    
    const averageTimePerCard = countedCards > 0 ? totalCardTime / countedCards : 0;
    
    // Record session in history
    const sessionId = recordStudySession({
      startTime: this._sessionStartTime,
      endTime: sessionEndTime,
      totalCards: this._state.stats.total,
      learnedCards: this._state.stats.learned,
      reviewCards: this._state.stats.to_review,
      averageTimePerCard,
      collectionId: this._options.collection_id,
      categoryId: this._options.category_id
    });
    
    // Record individual card interactions
    const cardInteractions = Object.entries(this._cardMetrics)
      .filter(([_, metrics]) => metrics.viewDuration !== null)
      .map(([cardId, metrics]) => {
        const card = this._state.flashcards.find(c => c.id === cardId);
        return {
          flashcardId: cardId,
          status: card?.review_status || 'review',
          viewDuration: metrics.viewDuration || 0,
          decisionTime: metrics.decisionTime || 0
        };
      });
    
    recordCardInteractions(sessionId, cardInteractions);
    
    // Clean up
    clearSessionState();
    this._stopAutoSave();
  }
  
  /**
   * Reset the session
   */
  public resetSession(): void {
    clearSessionState();
    this._state = {
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
    this._cardMetrics = {};
    this._sessionStartTime = Date.now();
    this._updateState();
    
    // Load flashcards for a new session
    this._loadFlashcards();
  }
  
  /**
   * Synchronize offline data when back online
   */
  public async syncOfflineData(): Promise<void> {
    if (!navigator.onLine || !hasQueuedRequests()) {
      return;
    }
    
    this._setPendingSync(true);
    
    try {
      const result = await processOfflineQueue();
      console.log('[StudySessionController] Sync results:', result);
    } catch (error) {
      console.error('[StudySessionController] Error syncing offline data:', error);
    } finally {
      this._setPendingSync(!hasQueuedRequests());
    }
  }
  
  /**
   * Update the state and notify listeners
   */
  private _updateState(): void {
    if (this._onStateChange) {
      this._onStateChange({ ...this._state });
    }
  }
  
  /**
   * Save current state to localStorage
   */
  private _saveState(): void {
    if (!this._state.is_completed) {
      saveSessionState(this._state);
    }
  }
  
  /**
   * Start auto-save timer
   */
  private _startAutoSave(): void {
    if (this._autoSaveTimer) {
      return;
    }
    
    this._autoSaveTimer = setInterval(() => {
      this._saveState();
    }, 10000); // Save every 10 seconds
  }
  
  /**
   * Stop auto-save timer
   */
  private _stopAutoSave(): void {
    if (this._autoSaveTimer) {
      clearInterval(this._autoSaveTimer);
      this._autoSaveTimer = null;
    }
  }
  
  /**
   * Handle online status change
   */
  private _handleOnline(): void {
    this._isOffline = false;
    
    // Try to sync data when back online
    this.syncOfflineData();
  }
  
  /**
   * Handle offline status change
   */
  private _handleOffline(): void {
    this._isOffline = true;
  }
  
  /**
   * Update pending sync status and notify listeners
   */
  private _setPendingSync(isPending: boolean): void {
    this._pendingSync = isPending;
    if (this._onSyncStatusChange) {
      this._onSyncStatusChange(isPending);
    }
  }
  
  /**
   * Get current state
   */
  public get state(): Readonly<SessionViewState> {
    return this._state;
  }
  
  /**
   * Get session options
   */
  public get options(): Readonly<SessionOptions> {
    return this._options;
  }
  
  /**
   * Get pending sync status
   */
  public get pendingSync(): boolean {
    return this._pendingSync;
  }
  
  /**
   * Get offline status
   */
  public get isOffline(): boolean {
    return this._isOffline;
  }
} 