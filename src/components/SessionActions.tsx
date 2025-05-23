import { Button } from "@/components/ui/button";
import { Pause, Play, StopCircle } from "lucide-react";
import { memo } from "react";

interface SessionActionsProps {
  isPaused: boolean;
  onPauseResume: () => void;
  onEnd: () => void;
}

/**
 * Component for session control actions like pause/resume and end session
 */
export const SessionActions = memo(({
  isPaused,
  onPauseResume,
  onEnd
}: SessionActionsProps) => {
  return (
    <div className="flex justify-between items-center">
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        onClick={onPauseResume}
      >
        {isPaused ? (
          <>
            <Play className="h-4 w-4" />
            <span>Wznów</span>
          </>
        ) : (
          <>
            <Pause className="h-4 w-4" />
            <span>Wstrzymaj</span>
          </>
        )}
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-red-600 flex items-center gap-2"
        onClick={onEnd}
      >
        <StopCircle className="h-4 w-4" />
        <span>Zakończ sesję</span>
      </Button>
    </div>
  );
});

SessionActions.displayName = "SessionActions"; 