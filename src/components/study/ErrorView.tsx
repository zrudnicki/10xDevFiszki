import React from 'react';
import { AlertCircle, RefreshCw, Home, Wifi, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorViewProps {
  error: string;
  onRetry: () => void;
}

/**
 * Component displayed when there's an error in the study session
 * Shows error message and provides a retry option
 */
export const ErrorView: React.FC<ErrorViewProps> = ({
  error,
  onRetry
}) => {
  // Determine the error type to show targeted help
  const isAuthError = error.toLowerCase().includes('unauthorized') || 
                     error.toLowerCase().includes('authentication') ||
                     error.toLowerCase().includes('401') ||
                     error.toLowerCase().includes('session');
  
  const isNetworkError = error.toLowerCase().includes('network') || 
                        error.toLowerCase().includes('failed to fetch') ||
                        error.toLowerCase().includes('timeout') ||
                        error.toLowerCase().includes('connection');

  const isTimeoutError = error.toLowerCase().includes('timeout') ||
                        error.toLowerCase().includes('timed out');

  const goToHome = () => {
    console.log("Navigating to home...");
    window.location.href = '/';
  };
  
  const goToLogin = () => {
    console.log("Navigating to login...");
    window.location.href = '/login?redirect=/study';
  };

  const handleRetry = () => {
    console.log("Retrying after error:", error);
    onRetry();
  };

  return (
    <Card className="max-w-md mx-auto shadow-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-destructive/10">
            {isAuthError ? (
              <ShieldAlert className="h-8 w-8 text-destructive" />
            ) : isNetworkError ? (
              <Wifi className="h-8 w-8 text-destructive" />
            ) : (
              <AlertCircle className="h-8 w-8 text-destructive" />
            )}
          </div>
        </div>
        <CardTitle>Wystąpił problem</CardTitle>
        <CardDescription>
          {isAuthError ? "Problem z autoryzacją" :
           isNetworkError ? "Problem z połączeniem" :
           isTimeoutError ? "Przekroczono czas oczekiwania" :
           "Nie udało się załadować fiszek do nauki"}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="bg-muted p-3 rounded-md text-sm mb-4">
          {error || 'Nieznany błąd. Spróbuj ponownie później.'}
        </div>
        
        {isAuthError && (
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">Sugestie:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Twoja sesja mogła wygasnąć</li>
              <li>Zaloguj się ponownie, aby kontynuować</li>
              <li>Sprawdź czy masz odpowiednie uprawnienia</li>
            </ul>
          </div>
        )}
        
        {isNetworkError && (
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">Sugestie:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Sprawdź połączenie z internetem</li>
              <li>Serwer może być tymczasowo niedostępny</li>
              <li>Spróbuj odświeżyć stronę lub wrócić później</li>
              <li>Sprawdź czy nie masz włączonego trybu offline</li>
            </ul>
          </div>
        )}
        
        {isTimeoutError && (
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">Sugestie:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Serwer może być przeciążony</li>
              <li>Spróbuj ponownie za chwilę</li>
              <li>Sprawdź swoje połączenie z internetem</li>
            </ul>
          </div>
        )}
        
        {!isAuthError && !isNetworkError && !isTimeoutError && (
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">Sugestie:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Odśwież stronę i spróbuj ponownie</li>
              <li>Sprawdź czy masz dostęp do tej kolekcji</li>
              <li>Jeśli problem utrzymuje się, wróć do strony głównej</li>
              <li>Sprawdź czy masz odpowiednie uprawnienia</li>
            </ul>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-center gap-3">
        <Button onClick={handleRetry} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Spróbuj ponownie
        </Button>
        
        {isAuthError ? (
          <Button onClick={goToLogin} variant="outline" className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            Zaloguj ponownie
          </Button>
        ) : (
          <Button onClick={goToHome} variant="outline" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Strona główna
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}; 