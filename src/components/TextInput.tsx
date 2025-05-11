import * as React from "react"
import { cn } from "../lib/utils"

interface TextInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  minLength?: number
  maxLength?: number
  className?: string
}

export function TextInput({
  value,
  onChange,
  onSubmit,
  minLength = 1000,
  maxLength = 10000,
  className,
}: TextInputProps) {
  const isSubmitDisabled = value.length < minLength || value.length > maxLength
  const isTooLong = value.length > maxLength

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          className={cn(
            "w-full h-64 p-4 rounded-lg border bg-card text-card-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary",
            isTooLong && "border-destructive focus:ring-destructive"
          )}
          placeholder="Wprowadź tekst do wygenerowania fiszek..."
        />
        <div className={cn(
          "absolute bottom-4 right-4 text-sm",
          isTooLong ? "text-destructive" : "text-muted-foreground"
        )}>
          {value.length}/{maxLength} znaków
          {value.length < minLength && ` (min. ${minLength})`}
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={isSubmitDisabled}
        className={cn(
          "w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        Generuj fiszki
      </button>
    </div>
  )
} 