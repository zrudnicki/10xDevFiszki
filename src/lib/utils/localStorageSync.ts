import type { SessionViewState, SessionFlashcardViewModel } from "@/types";

// Storage keys
const STORAGE_KEYS = {
  CURRENT_SESSION: 'fiszki_current_session',
  SESSION_TIMESTAMP: 'fiszki_session_timestamp',
  SESSION_OPTIONS: 'fiszki_session_options'
};

// Maximum age for stored session (24 hours)
const MAX_SESSION_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Saves the current study session state to localStorage
 * @param state The current study session state
 */
export function saveSessionState(state: SessionViewState): void {
  try {
    // Don't save if the session is already completed
    if (state.is_completed) {
      return;
    }
    
    // Save the state with a timestamp
    localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(state));
    localStorage.setItem(STORAGE_KEYS.SESSION_TIMESTAMP, Date.now().toString());
    
    console.log('[LocalStorageSync] Session state saved');
  } catch (error) {
    console.error('[LocalStorageSync] Error saving session state:', error);
  }
}

/**
 * Loads the saved study session state from localStorage if available
 * @returns The saved session state or null if none exists or expired
 */
export function loadSessionState(): SessionViewState | null {
  try {
    // Check if we have a saved session
    const savedStateJson = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
    const timestampStr = localStorage.getItem(STORAGE_KEYS.SESSION_TIMESTAMP);
    
    if (!savedStateJson || !timestampStr) {
      return null;
    }
    
    // Check if the session is too old
    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();
    
    if (now - timestamp > MAX_SESSION_AGE_MS) {
      console.log('[LocalStorageSync] Saved session expired, clearing');
      clearSessionState();
      return null;
    }
    
    // Parse the saved state
    const savedState: SessionViewState = JSON.parse(savedStateJson);
    
    console.log('[LocalStorageSync] Session state loaded');
    return savedState;
  } catch (error) {
    console.error('[LocalStorageSync] Error loading session state:', error);
    return null;
  }
}

/**
 * Clears the saved study session state from localStorage
 */
export function clearSessionState(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
    localStorage.removeItem(STORAGE_KEYS.SESSION_TIMESTAMP);
    console.log('[LocalStorageSync] Session state cleared');
  } catch (error) {
    console.error('[LocalStorageSync] Error clearing session state:', error);
  }
}

/**
 * Saves the session options to localStorage
 * @param options The session options (collection_id, category_id, limit)
 */
export function saveSessionOptions(options: any): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSION_OPTIONS, JSON.stringify(options));
  } catch (error) {
    console.error('[LocalStorageSync] Error saving session options:', error);
  }
}

/**
 * Loads the saved session options from localStorage
 * @returns The saved session options or null if none exist
 */
export function loadSessionOptions(): any | null {
  try {
    const optionsJson = localStorage.getItem(STORAGE_KEYS.SESSION_OPTIONS);
    return optionsJson ? JSON.parse(optionsJson) : null;
  } catch (error) {
    console.error('[LocalStorageSync] Error loading session options:', error);
    return null;
  }
}

/**
 * Checks if there is a saved session that can be resumed
 * @returns True if there is a valid saved session
 */
export function hasSavedSession(): boolean {
  try {
    const savedStateJson = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
    const timestampStr = localStorage.getItem(STORAGE_KEYS.SESSION_TIMESTAMP);
    
    if (!savedStateJson || !timestampStr) {
      return false;
    }
    
    // Check if the session is too old
    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();
    
    if (now - timestamp > MAX_SESSION_AGE_MS) {
      clearSessionState();
      return false;
    }
    
    const savedState: SessionViewState = JSON.parse(savedStateJson);
    
    // Only return true if session is not completed
    return !savedState.is_completed;
  } catch (error) {
    console.error('[LocalStorageSync] Error checking for saved session:', error);
    return false;
  }
} 