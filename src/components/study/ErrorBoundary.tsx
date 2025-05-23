import { Button } from "@/components/ui/button";
import React, { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertOctagon } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component to catch JavaScript errors anywhere in the child component tree
 * Displays a fallback UI instead of crashing the whole application
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      error 
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    
    // You could also log to a more sophisticated error tracking service here
    // e.g., Sentry, LogRocket, etc.
  }

  handleReset = (): void => {
    // Reset the error boundary state
    this.setState({ 
      hasError: false,
      error: null
    });
    
    // Optional: Refresh page to ensure clean state
    // window.location.reload();
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertOctagon className="h-6 w-6 text-red-600" />
          </div>
          
          <h2 className="text-xl font-semibold mb-2">Coś poszło nie tak</h2>
          
          <p className="mb-6 text-muted-foreground">
            Wystąpił nieoczekiwany błąd podczas renderowania komponentów. 
            Spróbuj odświeżyć stronę lub wróć do strony głównej.
          </p>
          
          <div className="flex gap-3">
            <Button onClick={this.handleReset}>
              Spróbuj ponownie
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
            >
              Wróć do strony głównej
            </Button>
          </div>
          
          {this.state.error && (
            <details className="mt-6 text-xs text-left w-full">
              <summary className="cursor-pointer text-muted-foreground">Szczegóły błędu</summary>
              <pre className="mt-2 p-2 bg-muted rounded text-muted-foreground overflow-auto">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
} 