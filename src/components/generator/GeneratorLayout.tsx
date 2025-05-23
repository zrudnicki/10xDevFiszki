import { type ReactNode } from "react";
import { Progress } from "@/components/ui/progress";

interface GeneratorLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
}

export function GeneratorLayout({ children, currentStep, totalSteps }: GeneratorLayoutProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Progress value={progress} className="h-2" />
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
} 