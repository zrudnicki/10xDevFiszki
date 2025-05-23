import { ErrorBoundary } from "./study/ErrorBoundary";
import { StudySession } from "./StudySession";
import { memo, useEffect, useRef } from "react";

interface StudySessionWrapperProps {
  collectionId?: string;
  categoryId?: string;
  limit?: number;
}

/**
 * Wrapper component for the StudySession that provides error boundary protection
 * and additional features like session analytics tracking
 */
export const StudySessionWrapper = memo(({ collectionId, categoryId, limit }: StudySessionWrapperProps) => {
  // Use a ref to track if we've already tracked the session
  const hasTrackedSession = useRef(false);
  
  // Track session start on component mount using useEffect for client-side only execution
  useEffect(() => {
    // Only track if we haven't already
    if (hasTrackedSession.current) return;
    
    try {
      // Mark as tracked
      hasTrackedSession.current = true;
      
      // Save session data
      localStorage.setItem("study_session_started", new Date().toISOString());
      localStorage.setItem(
        "study_session_params",
        JSON.stringify({
          collectionId,
          categoryId,
          limit,
        })
      );
    } catch (error) {
      console.warn("Failed to track session start:", error);
    }
  }, [collectionId, categoryId, limit]);

  return (
    <ErrorBoundary>
      <StudySession collectionId={collectionId} categoryId={categoryId} limit={limit} />
    </ErrorBoundary>
  );
});

StudySessionWrapper.displayName = "StudySessionWrapper"; 