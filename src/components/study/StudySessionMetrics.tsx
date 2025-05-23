import { PieChart, Clock, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";

interface SessionMetricsProps {
  totalCards: number;
  learnedCards: number;
  toReviewCards: number;
  averageDecisionTime?: number;
  sessionDuration: number;
}

export const StudySessionMetrics = ({
  totalCards,
  learnedCards,
  toReviewCards,
  averageDecisionTime = 0,
  sessionDuration
}: SessionMetricsProps) => {
  // Format session duration as mm:ss
  const [formattedDuration, setFormattedDuration] = useState("00:00");
  
  useEffect(() => {
    // Calculate minutes and seconds
    const minutes = Math.floor(sessionDuration / 60000);
    const seconds = Math.floor((sessionDuration % 60000) / 1000);
    
    // Format with leading zeros
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');
    
    setFormattedDuration(`${formattedMinutes}:${formattedSeconds}`);
  }, [sessionDuration]);

  // Calculate completion percentage
  const completionPercentage = totalCards > 0 
    ? Math.round((learnedCards + toReviewCards) / totalCards * 100) 
    : 0;
  
  // Calculate success rate
  const successRate = (learnedCards + toReviewCards) > 0
    ? Math.round((learnedCards / (learnedCards + toReviewCards)) * 100)
    : 0;
    
  // Format average decision time in seconds
  const formattedDecisionTime = (averageDecisionTime / 1000).toFixed(1);

  return (
    <div className="bg-white border rounded-lg p-5 shadow-sm">
      <h3 className="font-medium text-lg mb-4">Statystyki sesji</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Performance metrics */}
        <div className="flex items-center gap-3 border-b pb-3 md:border-b-0 md:border-r md:pr-3">
          <div className="bg-blue-50 p-2 rounded-full">
            <PieChart className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Skuteczność</div>
            <div className="font-semibold text-xl">{successRate}%</div>
            <div className="text-xs text-muted-foreground">
              <span className="text-green-600 font-medium">{learnedCards}</span> przyswojonych / 
              <span className="text-amber-600 font-medium"> {toReviewCards}</span> do powtórki
            </div>
          </div>
        </div>
        
        {/* Time metrics */}
        <div className="flex items-center gap-3 border-b pb-3 md:border-b-0 md:border-r md:pr-3">
          <div className="bg-indigo-50 p-2 rounded-full">
            <Clock className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Czas</div>
            <div className="font-semibold text-xl">{formattedDuration}</div>
            <div className="text-xs text-muted-foreground">
              Śr. czas decyzji: {formattedDecisionTime}s
            </div>
          </div>
        </div>
        
        {/* Progress metrics */}
        <div className="flex items-center gap-3">
          <div className="bg-violet-50 p-2 rounded-full">
            <BarChart3 className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Postęp</div>
            <div className="font-semibold text-xl">{completionPercentage}%</div>
            <div className="text-xs text-muted-foreground">
              {learnedCards + toReviewCards}/{totalCards} fiszek
            </div>
          </div>
        </div>
      </div>
      
      {/* Visual progress bar */}
      <div className="mt-4">
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div 
            className="bg-gradient-to-r from-green-500 to-blue-500 h-2.5 rounded-full"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}; 