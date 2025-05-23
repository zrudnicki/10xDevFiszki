import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Check, Clock, RotateCcw, BrainCircuit } from 'lucide-react';

interface StudySessionStatsProps {
  totalCards: number;
  learnedCards: number;
  reviewCards: number;
  reviewingCard: number;
  averageTimePerCard?: number;
  longestStreak?: number;
}

/**
 * Component that displays statistics about the current study session
 * and overall learning progress
 */
export const StudySessionStats: React.FC<StudySessionStatsProps> = ({
  totalCards,
  learnedCards,
  reviewCards,
  reviewingCard,
  averageTimePerCard,
  longestStreak
}) => {
  const completedCards = learnedCards + reviewCards;
  const completionPercentage = totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0;
  const learnedPercentage = totalCards > 0 ? Math.round((learnedCards / totalCards) * 100) : 0;
  const cardsRemaining = totalCards - completedCards;
  
  // Format average time in seconds or minutes
  const formattedAvgTime = () => {
    if (!averageTimePerCard) return '0s';
    
    const seconds = Math.round(averageTimePerCard / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">Statystyki sesji</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar showing session completion */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Postęp: {completionPercentage}%</span>
            <span>{completedCards}/{totalCards} fiszek</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>
        
        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
          <div className="flex flex-col items-center text-center">
            <div className="p-2 rounded-full bg-green-100 mb-1">
              <Check className="h-4 w-4 text-green-600" />
            </div>
            <span className="text-lg font-semibold">{learnedCards}</span>
            <span className="text-xs text-muted-foreground">Przyswojone</span>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="p-2 rounded-full bg-amber-100 mb-1">
              <RotateCcw className="h-4 w-4 text-amber-600" />
            </div>
            <span className="text-lg font-semibold">{reviewCards}</span>
            <span className="text-xs text-muted-foreground">Do powtórki</span>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="p-2 rounded-full bg-blue-100 mb-1">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-lg font-semibold">{formattedAvgTime()}</span>
            <span className="text-xs text-muted-foreground">Średni czas</span>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="p-2 rounded-full bg-purple-100 mb-1">
              <BrainCircuit className="h-4 w-4 text-purple-600" />
            </div>
            <span className="text-lg font-semibold">{longestStreak || 0}</span>
            <span className="text-xs text-muted-foreground">Najdłuższa seria</span>
          </div>
        </div>
        
        {/* Current card indicator */}
        <div className="pt-2">
          <div className="text-sm flex justify-between mb-1">
            <span>Obecna fiszka:</span>
            <span>{reviewingCard + 1} z {totalCards}</span>
          </div>
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${((reviewingCard + 1) / totalCards) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Learning efficiency */}
        {totalCards > 0 && (
          <div className="pt-2 flex items-center justify-between">
            <span className="text-sm">Skuteczność</span>
            <div className="text-sm font-medium flex items-center gap-1">
              {learnedPercentage}%
              <span className={learnedPercentage >= 70 ? 'text-green-500' : learnedPercentage >= 40 ? 'text-amber-500' : 'text-red-500'}>
                {learnedPercentage >= 70 ? '😊' : learnedPercentage >= 40 ? '😐' : '😔'}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 