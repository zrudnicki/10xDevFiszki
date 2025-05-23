import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Brain, Clock, Zap, Layers, Shuffle } from "lucide-react";

export type StudyStrategy = 
  | "spaced-repetition" 
  | "new-first" 
  | "due-first" 
  | "random" 
  | "cram";

interface StudyStrategyOption {
  id: StudyStrategy;
  name: string;
  description: string;
  IconComponent: React.ElementType;
}

interface StudyStrategySelectorProps {
  selectedStrategy: StudyStrategy;
  onStrategyChange: (strategy: StudyStrategy) => void;
  onStartSession: () => void;
  isLoading?: boolean;
}

/**
 * Component that allows users to select different study strategies
 * and explains each mode's benefits and approach
 */
const StudyStrategySelectorComponent: React.FC<StudyStrategySelectorProps> = ({
  selectedStrategy,
  onStrategyChange,
  onStartSession,
  isLoading = false
}) => {
  // Memoize strategies to avoid recreation on each render
  const strategies = useMemo<StudyStrategyOption[]>(() => [
    {
      id: "spaced-repetition",
      name: "Powtórki rozłożone w czasie",
      description: "Optymalny tryb do długotrwałego zapamiętywania. Wykorzystuje algorytm SM-2 do planowania powtórek w optymalnym czasie.",
      IconComponent: Brain
    },
    {
      id: "new-first",
      name: "Nowe fiszki",
      description: "Skup się na nauce nowych fiszek, które nie były jeszcze przeglądane.",
      IconComponent: Layers
    },
    {
      id: "due-first",
      name: "Zaległe powtórki",
      description: "Przejrzyj zaległe fiszki oczekujące na powtórkę, posortowane od najstarszych.",
      IconComponent: Clock
    },
    {
      id: "random",
      name: "Losowa kolejność",
      description: "Przeglądaj fiszki w losowej kolejności, bez uwzględniania historii powtórek.",
      IconComponent: Shuffle
    },
    {
      id: "cram",
      name: "Tryb intensywny",
      description: "Szybkie przeglądanie wszystkich fiszek przed testem lub egzaminem.",
      IconComponent: Zap
    }
  ], []);

  // Find selected option
  const selectedOption = useMemo(() => 
    strategies.find(s => s.id === selectedStrategy) || strategies[0],
    [strategies, selectedStrategy]
  );
  
  // Create plain version of name for avoiding state updates
  const optionName = selectedOption.name;
  const IconComponent = selectedOption.IconComponent;

  // Function to handle selection change with proper type
  const handleValueChange = React.useCallback((value: string) => {
    onStrategyChange(value as StudyStrategy);
  }, [onStrategyChange]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Wybierz strategię nauki</CardTitle>
        <CardDescription>
          Różne metody nauki odpowiadają różnym potrzebom i celom
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Simple select without SelectValue component */}
        <div className="rounded-md border">
          <select 
            className="w-full h-10 px-3 py-2 rounded-md"
            value={selectedStrategy}
            onChange={(e) => handleValueChange(e.target.value)}
          >
            {strategies.map(strategy => (
              <option key={strategy.id} value={strategy.id}>
                {strategy.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="bg-muted p-4 rounded-md">
          <div className="flex items-center gap-3 mb-2">
            <IconComponent className="h-5 w-5" />
            <h3 className="font-medium">{optionName}</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {selectedOption.description}
          </p>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={onStartSession} 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Ładowanie...
            </>
          ) : (
            <>Rozpocznij sesję</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

// Wrap component with memo to prevent unnecessary re-renders
export const StudyStrategySelector = React.memo(StudyStrategySelectorComponent); 