import { type ChangeEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface TextareaWithCounterProps {
  value: string;
  onChange: (value: string) => void;
  minLength: number;
  maxLength: number;
  placeholder?: string;
  error?: string;
}

export function TextareaWithCounter({
  value,
  onChange,
  minLength,
  maxLength,
  placeholder,
  error,
}: TextareaWithCounterProps) {
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const isTooShort = value.length < minLength;
  const isTooLong = value.length > maxLength;
  const isValid = !isTooShort && !isTooLong;

  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          "min-h-[200px] resize-y",
          isTooShort && "border-yellow-500 focus-visible:ring-yellow-500",
          isTooLong && "border-red-500 focus-visible:ring-red-500",
          isValid && "border-green-500 focus-visible:ring-green-500"
        )}
      />
      <div className="flex justify-between text-sm">
        <div className="space-x-2">
          <span
            className={cn(
              isTooShort ? "text-yellow-500" : "text-muted-foreground",
              isValid && "text-green-500"
            )}
          >
            Min: {value.length}/{minLength}
          </span>
          <span
            className={cn(
              isTooLong ? "text-red-500" : "text-muted-foreground",
              isValid && "text-green-500"
            )}
          >
            Max: {value.length}/{maxLength}
          </span>
        </div>
        {error && <span className="text-red-500">{error}</span>}
      </div>
    </div>
  );
} 