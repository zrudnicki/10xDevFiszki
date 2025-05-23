import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  RotateCcw, 
  Home, 
  CheckCircle, 
  ArrowUpCircle 
} from "lucide-react";
import { memo } from "react";

interface SessionSummaryProps {
  stats: {
    total: number;
    learned: number;
    toReview: number;
  };
  onStartNewSession: () => void;
  onBackToDashboard: () => void;
}

export const SessionSummary = memo(({
  stats,
  onStartNewSession,
  onBackToDashboard
}: SessionSummaryProps) => {
  // Calculate percentages for the stats
  const learnedPercentage = stats.total > 0 
    ? Math.round((stats.learned / stats.total) * 100) 
    : 0;
  
  const reviewPercentage = stats.total > 0 
    ? Math.round((stats.toReview / stats.total) * 100) 
    : 0;

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 max-w-md mx-auto text-center">
      <div className="mb-6 p-3 bg-primary/10 rounded-full">
        <BookOpen className="h-10 w-10 text-primary" />
      </div>
      
      <h2 className="text-2xl font-bold mb-2">Sesja zakończona!</h2>
      <p className="text-muted-foreground mb-8">
        Gratulacje! Udało Ci się przejrzeć wszystkie fiszki w tej sesji.
      </p>
      
      <div className="w-full bg-card p-6 rounded-lg shadow-sm border mb-8">
        <h3 className="font-semibold mb-4">Podsumowanie sesji</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Przyswojone</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{stats.learned}</span>
              <span className="text-xs text-muted-foreground">({learnedPercentage}%)</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-red-500" />
              <span>Do powtórki</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{stats.toReview}</span>
              <span className="text-xs text-muted-foreground">({reviewPercentage}%)</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center font-medium pt-2 border-t">
            <span>Łącznie</span>
            <span>{stats.total}</span>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col gap-3 w-full">
        <Button onClick={onStartNewSession} className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          <span>Rozpocznij nową sesję</span>
        </Button>
        
        <Button variant="outline" onClick={onBackToDashboard} className="flex items-center gap-2">
          <Home className="h-4 w-4" />
          <span>Wróć do pulpitu</span>
        </Button>
      </div>
    </div>
  );
});

SessionSummary.displayName = "SessionSummary"; 