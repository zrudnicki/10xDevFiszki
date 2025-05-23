import { useEffect } from "react";

/**
 * Hook for handling keyboard navigation in the study session
 * 
 * @param onFlip Function to call when the user presses space to flip a card
 * @param onLearned Function to call when the user presses right arrow to mark as learned
 * @param onReview Function to call when the user presses left arrow to mark for review
 * @param isEnabled Whether keyboard navigation is enabled (used to disable during pause/completion)
 */
export const useKeyboardNavigation = (
  onFlip: () => void,
  onLearned: () => void,
  onReview: () => void,
  isEnabled: boolean = true
) => {
  useEffect(() => {
    if (!isEnabled) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent handling if pressed in form elements
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      switch (e.key) {
        case ' ': // Space key
          e.preventDefault();
          onFlip();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onLearned();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onReview();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onFlip, onLearned, onReview, isEnabled]);
}; 