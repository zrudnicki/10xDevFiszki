import { Calendar, Clock, ArrowRightCircle } from "lucide-react";
import { formatNextReviewDate } from "@/lib/services/spaced-repetition";
import type { FlashcardReviewStatus } from "@/types";

interface FlashcardReviewIndicatorProps {
  status: FlashcardReviewStatus | null;
  nextReviewAt: string | null;
  showNextReview?: boolean;
}

export const FlashcardReviewIndicator = ({
  status,
  nextReviewAt,
  showNextReview = true
}: FlashcardReviewIndicatorProps) => {
  if (!status) {
    return null;
  }
  
  // Convert ISO date string to Date object
  const nextReviewDate = nextReviewAt ? new Date(nextReviewAt) : null;
  
  // Format the next review date for display
  const formattedNextReview = nextReviewDate 
    ? formatNextReviewDate(nextReviewDate)
    : null;
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
      {/* Status indicator */}
      <div 
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
          status === "learned" 
            ? "bg-green-50 text-green-700 border border-green-200" 
            : "bg-amber-50 text-amber-700 border border-amber-200"
        }`}
      >
        {status === "learned" ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            <span>Przyswojone</span>
          </>
        ) : (
          <>
            <ArrowRightCircle className="h-3.5 w-3.5" />
            <span>Do powtórki</span>
          </>
        )}
      </div>
      
      {/* Next review date (optional) */}
      {showNextReview && nextReviewDate && formattedNextReview && (
        <div className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>Następna powtórka: {formattedNextReview}</span>
        </div>
      )}
    </div>
  );
}; 