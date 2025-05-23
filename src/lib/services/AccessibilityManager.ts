/**
 * Accessibility Manager Service
 * 
 * Provides utilities for keyboard navigation, focus management, and
 * screen reader announcements to improve accessibility in the study session.
 */

// Interface for the focus trap
interface FocusTrapOptions {
  rootElement: HTMLElement;
  initialFocusElement?: HTMLElement;
  onEscape?: () => void;
}

/**
 * Manager for handling accessibility concerns in the flashcard study session
 */
export class AccessibilityManager {
  private _announcementElement: HTMLElement | null = null;
  private _activeElement: Element | null = null;
  private _focusTrapRoot: HTMLElement | null = null;
  private _focusableElements: HTMLElement[] = [];
  private _keydownListener: ((e: KeyboardEvent) => void) | null = null;
  
  /**
   * Initialize the accessibility manager
   */
  constructor() {
    // Create or get the live region for announcements
    this._setupAnnouncementRegion();
    
    // Save the currently focused element to restore later
    this._activeElement = document.activeElement;
  }
  
  /**
   * Clean up event listeners and restore focus
   */
  public dispose(): void {
    this._removeFocusTrap();
    
    // Restore focus to the element that was active before
    if (this._activeElement instanceof HTMLElement) {
      this._activeElement.focus();
    }
    
    // Remove the announcement region
    if (this._announcementElement && document.body.contains(this._announcementElement)) {
      document.body.removeChild(this._announcementElement);
    }
  }
  
  /**
   * Set up the live region for screen reader announcements
   */
  private _setupAnnouncementRegion(): void {
    // Check if the announcement region already exists
    let element = document.getElementById('study-session-announcer');
    
    if (!element) {
      // Create the live region
      element = document.createElement('div');
      element.id = 'study-session-announcer';
      element.className = 'sr-only';
      element.setAttribute('role', 'status');
      element.setAttribute('aria-live', 'polite');
      element.setAttribute('aria-atomic', 'true');
      
      document.body.appendChild(element);
    }
    
    this._announcementElement = element;
  }
  
  /**
   * Make an announcement for screen readers
   * @param message The message to announce
   * @param priority Whether to use assertive (urgent) or polite priority
   */
  public announce(message: string, priority: 'assertive' | 'polite' = 'polite'): void {
    if (!this._announcementElement) {
      this._setupAnnouncementRegion();
    }
    
    if (this._announcementElement) {
      // Set the priority
      this._announcementElement.setAttribute('aria-live', priority);
      
      // Clear the element first, then set message
      // This is a technique to ensure screen readers announce again
      // even if the message is the same
      this._announcementElement.textContent = '';
      
      // Use setTimeout to ensure screen readers pick up the new content
      setTimeout(() => {
        if (this._announcementElement) {
          this._announcementElement.textContent = message;
        }
      }, 50);
    }
  }
  
  /**
   * Create a focus trap to keep focus within the study session
   * @param options Options for the focus trap
   */
  public createFocusTrap(options: FocusTrapOptions): void {
    const { rootElement, initialFocusElement, onEscape } = options;
    
    // First, remove any existing focus trap
    this._removeFocusTrap();
    
    this._focusTrapRoot = rootElement;
    
    // Find all focusable elements
    this._focusableElements = this._getFocusableElements(rootElement);
    
    if (this._focusableElements.length === 0) {
      console.warn('[AccessibilityManager] No focusable elements found in focus trap');
      return;
    }
    
    // Set up keyboard listener
    this._keydownListener = (e: KeyboardEvent) => {
      // Handle escape key to exit the trap if configured
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault();
        onEscape();
        return;
      }
      
      // Handle tab key to trap focus
      if (e.key === 'Tab' && this._focusableElements.length > 0) {
        // Get the first and last focusable element
        const firstElement = this._focusableElements[0];
        const lastElement = this._focusableElements[this._focusableElements.length - 1];
        
        // If shift+tab on first element, move to last element
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
        // If tab on last element, move to first element
        else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    // Add the keydown listener
    document.addEventListener('keydown', this._keydownListener);
    
    // Set initial focus
    if (initialFocusElement && this._focusableElements.includes(initialFocusElement)) {
      initialFocusElement.focus();
    } else if (this._focusableElements.length > 0) {
      this._focusableElements[0].focus();
    }
  }
  
  /**
   * Remove the active focus trap
   */
  private _removeFocusTrap(): void {
    if (this._keydownListener) {
      document.removeEventListener('keydown', this._keydownListener);
      this._keydownListener = null;
    }
    
    this._focusTrapRoot = null;
    this._focusableElements = [];
  }
  
  /**
   * Get all focusable elements within a container
   * @param rootElement The container element
   * @returns Array of focusable elements
   */
  private _getFocusableElements(rootElement: HTMLElement): HTMLElement[] {
    // Selectors for focusable elements
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'details',
      '[tabindex]:not([tabindex="-1"])'
    ];
    
    // Find all focusable elements
    const elements = Array.from(
      rootElement.querySelectorAll<HTMLElement>(focusableSelectors.join(','))
    );
    
    // Filter out elements with display: none or visibility: hidden
    return elements.filter(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
  }
  
  /**
   * Announce the flashcard status
   * @param isFlipped Whether the card is flipped
   * @param front Front text of the card
   * @param back Back text of the card
   */
  public announceFlashcard(isFlipped: boolean, front: string, back: string): void {
    if (isFlipped) {
      this.announce(`Odpowiedź: ${back}`, 'polite');
    } else {
      this.announce(`Pytanie: ${front}`, 'polite');
    }
  }
  
  /**
   * Announce study session progress
   * @param current Current card index
   * @param total Total number of cards
   * @param learned Number of learned cards
   * @param toReview Number of cards marked for review
   */
  public announceProgress(current: number, total: number, learned: number, toReview: number): void {
    const remaining = total - (learned + toReview);
    this.announce(
      `Fiszka ${current + 1} z ${total}. Przyswojonych: ${learned}, do powtórki: ${toReview}, pozostało: ${remaining}`,
      'polite'
    );
  }
  
  /**
   * Announce when a card is marked with a status
   * @param status The status (learned or review)
   */
  public announceReviewStatus(status: 'learned' | 'review'): void {
    const message = status === 'learned' 
      ? 'Oznaczono jako przyswojone' 
      : 'Oznaczono do powtórki';
    
    this.announce(message, 'polite');
  }
  
  /**
   * Announce session completion
   * @param total Total number of cards
   * @param learned Number of learned cards
   * @param toReview Number of cards marked for review
   */
  public announceSessionCompleted(total: number, learned: number, toReview: number): void {
    const successRate = total > 0 ? Math.round((learned / total) * 100) : 0;
    
    this.announce(
      `Sesja zakończona. Przejrzano ${total} fiszek. Przyswojono ${learned} (${successRate}%), do powtórki ${toReview}.`,
      'assertive'
    );
  }
} 