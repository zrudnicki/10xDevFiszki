import { type ReactNode } from "react";

interface GeneratorHeaderProps {
  title: string;
  description?: string;
  currentStep: number;
  totalSteps: number;
  children?: ReactNode;
}

export function GeneratorHeader({ title, description, currentStep, totalSteps, children }: GeneratorHeaderProps) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground mt-2">{description}</p>}
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Krok {currentStep} z {totalSteps}</span>
        {children}
      </div>
    </div>
  );
} 