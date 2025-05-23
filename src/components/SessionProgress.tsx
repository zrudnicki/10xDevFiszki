import { memo } from "react";
import { Progress } from "@/components/ui/progress";
import { ProgressHeatmap } from "./study/ProgressHeatmap";

interface SessionProgressProps {
  currentIndex: number;
  totalFlashcards: number;
  learned: number;
  toReview: number;
  showHeatmap?: boolean;
}

export const SessionProgress = memo(({
  currentIndex,
  totalFlashcards,
  learned,
  toReview,
  showHeatmap = true
}: SessionProgressProps) => {
  // Oblicz wartość procentową postępu
  const progressValue = totalFlashcards > 0 
    ? Math.round(((currentIndex + 1) / totalFlashcards) * 100)
    : 0;

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="font-medium">{currentIndex + 1}</span>
          <span>/</span>
          <span>{totalFlashcards}</span>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
            <span>{learned}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
            <span>{toReview}</span>
          </div>
        </div>
      </div>
      
      {showHeatmap ? (
        <ProgressHeatmap 
          totalCount={totalFlashcards}
          learnedCount={learned}
          toReviewCount={toReview}
          currentIndex={currentIndex}
          className="mb-1"
        />
      ) : (
        <Progress value={progressValue} className="h-2" />
      )}
    </div>
  );
});

SessionProgress.displayName = "SessionProgress"; 