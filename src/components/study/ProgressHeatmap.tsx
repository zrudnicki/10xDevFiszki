import { memo } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProgressHeatmapProps {
  totalCount: number;
  learnedCount: number;
  toReviewCount: number;
  currentIndex: number;
  className?: string;
  maxItems?: number;
}

/**
 * Visual representation of study session progress with color coding
 * Displays cards as a heatmap: green for learned, red for review, gray for remaining
 */
export const ProgressHeatmap = memo(({
  totalCount,
  learnedCount,
  toReviewCount,
  currentIndex,
  className,
  maxItems = 50
}: ProgressHeatmapProps) => {
  // If we have too many items, we'll show a condensed version
  const isCondensed = totalCount > maxItems;
  
  // For condensed view, we calculate how many items to show per group
  const itemsToShow = isCondensed ? maxItems : totalCount;
  const itemsPerGroup = isCondensed ? Math.ceil(totalCount / maxItems) : 1;
  
  // Generate array representation of cards
  const items = Array.from({ length: itemsToShow }, (_, i) => {
    const startIndex = i * itemsPerGroup;
    const endIndex = Math.min(startIndex + itemsPerGroup, totalCount) - 1;
    
    // Check if this group contains the current card
    const containsCurrent = currentIndex >= startIndex && currentIndex <= endIndex;
    
    // Calculate how many learned/review cards are in this group
    const learnedInGroup = isCondensed
      ? calculateItemsInRange(startIndex, endIndex, 0, learnedCount - 1)
      : (i < learnedCount ? 1 : 0);
      
    const reviewInGroup = isCondensed
      ? calculateItemsInRange(startIndex, endIndex, learnedCount, learnedCount + toReviewCount - 1)
      : (i >= learnedCount && i < learnedCount + toReviewCount ? 1 : 0);
    
    // Determine status based on counts
    let status: 'learned' | 'review' | 'remaining' | 'mixed' | 'current' = 'remaining';
    
    if (containsCurrent) {
      status = 'current';
    } else if (learnedInGroup > 0 && reviewInGroup > 0) {
      status = 'mixed';
    } else if (learnedInGroup > 0) {
      status = 'learned';
    } else if (reviewInGroup > 0) {
      status = 'review';
    }
    
    return { status, count: endIndex - startIndex + 1 };
  });
  
  return (
    <div className={cn("w-full py-1", className)}>
      <div className="flex gap-0.5 h-2">
        {items.map((item, index) => (
          <div
            key={index}
            className={cn(
              "flex-1 rounded-sm transition-colors",
              item.status === 'learned' && "bg-green-500",
              item.status === 'review' && "bg-red-500",
              item.status === 'mixed' && "bg-amber-500",
              item.status === 'current' && "bg-blue-500",
              item.status === 'remaining' && "bg-gray-200"
            )}
            title={getTooltipText(item, index, itemsPerGroup)}
          />
        ))}
      </div>
    </div>
  );
});

// Helper function to calculate how many items from a range fall within another range
function calculateItemsInRange(
  rangeStart: number,
  rangeEnd: number,
  itemsStart: number,
  itemsEnd: number
): number {
  if (itemsEnd < rangeStart || itemsStart > rangeEnd) return 0;
  
  const overlapStart = Math.max(rangeStart, itemsStart);
  const overlapEnd = Math.min(rangeEnd, itemsEnd);
  
  return overlapEnd - overlapStart + 1;
}

// Helper function to generate tooltip text
function getTooltipText(
  item: { status: 'learned' | 'review' | 'remaining' | 'mixed' | 'current', count: number },
  index: number,
  itemsPerGroup: number
): string {
  const position = `${index * itemsPerGroup + 1}-${index * itemsPerGroup + item.count}`;
  
  switch (item.status) {
    case 'learned':
      return `Fiszki ${position} (przyswojone)`;
    case 'review':
      return `Fiszki ${position} (do powtórki)`;
    case 'mixed':
      return `Fiszki ${position} (mieszane)`;
    case 'current':
      return `Aktualna fiszka`;
    default:
      return `Fiszki ${position} (pozostałe)`;
  }
}

ProgressHeatmap.displayName = "ProgressHeatmap"; 