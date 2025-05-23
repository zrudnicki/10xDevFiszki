import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { FlashcardDisplay } from "../FlashcardDisplay";
import type { SessionFlashcardViewModel } from "@/types";

interface FlashcardTransitionProps {
  flashcard: SessionFlashcardViewModel;
  isFlipped: boolean;
  onFlip: () => void;
  transitionDirection: "left" | "right" | null;
  isReducedMotion: boolean;
}

/**
 * Component for handling smooth animations between flashcards
 * Uses direction-based transitions based on user's review decision
 */
export const FlashcardTransition: React.FC<FlashcardTransitionProps> = ({
  flashcard,
  isFlipped,
  onFlip,
  transitionDirection,
  isReducedMotion
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [currentCard, setCurrentCard] = useState(flashcard);
  const [key, setKey] = useState(flashcard.id);
  
  // When the flashcard changes, trigger the exit animation
  useEffect(() => {
    if (flashcard.id !== currentCard.id && transitionDirection && !isReducedMotion) {
      setIsExiting(true);
      
      // After a short delay, update the card and trigger entrance animation
      const timer = setTimeout(() => {
        setCurrentCard(flashcard);
        setKey(flashcard.id);
        setIsExiting(false);
      }, 300); // Match this timing with CSS transition duration
      
      return () => clearTimeout(timer);
    } else {
      setCurrentCard(flashcard);
      setKey(flashcard.id);
    }
  }, [flashcard, currentCard.id, transitionDirection, isReducedMotion]);
  
  const getTransitionClasses = () => {
    if (isReducedMotion || !transitionDirection) {
      return "";
    }
    
    if (isExiting) {
      return transitionDirection === "right" 
        ? "animate-slide-out-right"
        : "animate-slide-out-left";
    }
    
    return transitionDirection === "right"
      ? "animate-slide-in-left"
      : "animate-slide-in-right";
  };
  
  // Direction indicator that appears briefly during transition
  const DirectionIndicator = ({ direction }: { direction: "left" | "right" | null }) => {
    if (!direction || isReducedMotion) return null;

    const iconClassName = cn(
      "absolute top-1/2 transform -translate-y-1/2 rounded-full p-2",
      direction === "right" 
        ? "right-4 bg-green-100 text-green-600" 
        : "left-4 bg-red-100 text-red-600"
    );

    return (
      <div className={iconClassName}>
        {direction === "right" ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5" />
            <path d="M5 12l7-7 7 7" />
          </svg>
        )}
      </div>
    );
  };

  return (
    <div className="relative">
      <div
        key={key}
        className={cn(
          "transition-all duration-300",
          getTransitionClasses()
        )}
      >
        <FlashcardDisplay
          flashcard={currentCard}
          isFlipped={isFlipped}
          onFlip={onFlip}
        />
        <DirectionIndicator direction={transitionDirection} />
      </div>
    </div>
  );
}; 