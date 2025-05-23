import { useState, useCallback, useEffect } from "react";
import type { SessionViewState, FlashcardReviewStatus, SessionOptions } from "@/types";

interface PendingSyncItem {
  flashcardId: string;
  status: FlashcardReviewStatus;
  timestamp: number;
}

// Check if code is running in browser environment
const isBrowser = () => typeof window !== "undefined" && typeof localStorage !== "undefined";

/**
 * Hook for managing study session persistence in local storage
 * Allows saving and loading session state, and tracking flashcards that need to be synced
 */
export const useLocalStorageSession = () => {
  // Storage keys
  const STORAGE_KEYS = {
    SESSION_STATE: 'fiszki_study_session_state',
    SESSION_OPTIONS: 'fiszki_study_session_options',
    PENDING_SYNC: 'fiszki_pending_sync_items'
  };
  
  // State for pending sync items
  const [pendingSync, setPendingSync] = useState<PendingSyncItem[]>([]);
  
  // Initialize state on mount (client-side only)
  useEffect(() => {
    if (isBrowser()) {
      try {
        const storedItems = localStorage.getItem(STORAGE_KEYS.PENDING_SYNC);
        if (storedItems) {
          setPendingSync(JSON.parse(storedItems));
        }
      } catch (error) {
        console.warn('Failed to load pending sync items from localStorage:', error);
      }
    }
  }, []);
  
  /**
   * Save current session state to local storage
   */
  const saveSession = useCallback((state: SessionViewState, options?: SessionOptions) => {
    if (!isBrowser()) return;
    
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION_STATE, JSON.stringify(state));
      
      if (options) {
        localStorage.setItem(STORAGE_KEYS.SESSION_OPTIONS, JSON.stringify(options));
      }
    } catch (error) {
      console.warn('Failed to save session to localStorage:', error);
    }
  }, []);
  
  /**
   * Load session state from local storage
   */
  const loadSession = useCallback((): SessionViewState | null => {
    if (!isBrowser()) return null;
    
    try {
      const storedState = localStorage.getItem(STORAGE_KEYS.SESSION_STATE);
      return storedState ? JSON.parse(storedState) : null;
    } catch (error) {
      console.warn('Failed to load session from localStorage:', error);
      return null;
    }
  }, []);
  
  /**
   * Load session options from local storage
   */
  const loadSessionOptions = useCallback((): SessionOptions | null => {
    if (!isBrowser()) return null;
    
    try {
      const storedOptions = localStorage.getItem(STORAGE_KEYS.SESSION_OPTIONS);
      return storedOptions ? JSON.parse(storedOptions) : null;
    } catch (error) {
      console.warn('Failed to load session options from localStorage:', error);
      return null;
    }
  }, []);
  
  /**
   * Clear session data from local storage
   */
  const clearSession = useCallback(() => {
    if (!isBrowser()) return;
    
    try {
      localStorage.removeItem(STORAGE_KEYS.SESSION_STATE);
      localStorage.removeItem(STORAGE_KEYS.SESSION_OPTIONS);
    } catch (error) {
      console.warn('Failed to clear session from localStorage:', error);
    }
  }, []);
  
  /**
   * Add a flashcard to the pending sync queue
   */
  const addToPendingSync = useCallback((flashcardId: string, status: FlashcardReviewStatus) => {
    setPendingSync(prev => {
      // Check if already exists and update it
      const exists = prev.some(item => item.flashcardId === flashcardId);
      
      const updatedItems = exists
        ? prev.map(item => 
            item.flashcardId === flashcardId 
              ? { ...item, status, timestamp: Date.now() } 
              : item
          )
        : [...prev, { flashcardId, status, timestamp: Date.now() }];
      
      // Save to localStorage
      if (isBrowser()) {
        try {
          localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(updatedItems));
        } catch (error) {
          console.warn('Failed to save pending sync items to localStorage:', error);
        }
      }
      
      return updatedItems;
    });
  }, []);
  
  /**
   * Remove flashcards from the pending sync queue
   */
  const removeFromPendingSync = useCallback((flashcardIds: string[]) => {
    setPendingSync(prev => {
      const updatedItems = prev.filter(item => !flashcardIds.includes(item.flashcardId));
      
      // Save to localStorage
      if (isBrowser()) {
        try {
          localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(updatedItems));
        } catch (error) {
          console.warn('Failed to update pending sync items in localStorage:', error);
        }
      }
      
      return updatedItems;
    });
  }, []);
  
  return {
    loadSession,
    saveSession,
    loadSessionOptions,
    clearSession,
    pendingSync,
    addToPendingSync,
    removeFromPendingSync
  };
}; 