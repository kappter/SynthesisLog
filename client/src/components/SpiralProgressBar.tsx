import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { SpiralSegment } from "@shared/spiralQueue";

interface SpiralProgressBarProps {
  segments: SpiralSegment[];
  currentDay: number;
  totalDays: number;
  isTransitionZone: boolean;
}

export function SpiralProgressBar({
  segments,
  currentDay,
  totalDays,
  isTransitionZone,
}: SpiralProgressBarProps) {
  const segmentWidths = useMemo(() => {
    if (segments.length === 0) return [];
    
    // Calculate the width percentage for each segment
    return segments.map((seg) => ({
      ...seg,
      widthPercent: (seg.termCount / totalDays) * 100,
    }));
  }, [segments, totalDays]);

  const progressPercent = ((currentDay - 1) / Math.max(1, totalDays - 1)) * 100;

  return (
    <div className="space-y-2">
      {/* Day labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Day 1</span>
        <span>Day {currentDay} of {totalDays}</span>
        <span>Day {totalDays}</span>
      </div>

      {/* Progress track with segments */}
      <div className="relative h-3 rounded-full overflow-hidden bg-muted">
        {/* Segment backgrounds */}
        <div className="absolute inset-0 flex">
          {segmentWidths.map((seg, i) => (
            <div
              key={seg.listId + i}
              className="h-full transition-all duration-300"
              style={{
                width: `${seg.widthPercent}%`,
                backgroundColor: `oklch(0.85 0.08 ${seg.listHue})`,
              }}
            />
          ))}
          {/* Wind-down area (last 3 days) */}
          <div
            className="h-full bg-muted-foreground/20"
            style={{ width: `${(3 / totalDays) * 100}%` }}
          />
        </div>

        {/* Progress fill */}
        <div className="absolute inset-0 flex">
          {segmentWidths.map((seg, i) => {
            // Calculate how much of this segment is filled
            const segStartPercent = segmentWidths
              .slice(0, i)
              .reduce((sum, s) => sum + s.widthPercent, 0);
            const segEndPercent = segStartPercent + seg.widthPercent;
            
            let fillPercent = 0;
            if (progressPercent >= segEndPercent) {
              fillPercent = 100;
            } else if (progressPercent > segStartPercent) {
              fillPercent = ((progressPercent - segStartPercent) / seg.widthPercent) * 100;
            }

            return (
              <div
                key={seg.listId + i + "-fill"}
                className="h-full overflow-hidden"
                style={{ width: `${seg.widthPercent}%` }}
              >
                <div
                  className={cn(
                    "h-full transition-all duration-500",
                    isTransitionZone && i === segmentWidths.length - 1 && "animate-pulse"
                  )}
                  style={{
                    width: `${fillPercent}%`,
                    backgroundColor: `oklch(0.55 0.15 ${seg.listHue})`,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Current position indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-foreground/80 transition-all duration-300"
          style={{ left: `${progressPercent}%` }}
        />
      </div>

      {/* Segment legend */}
      {segments.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          {segments.map((seg, i) => (
            <div key={seg.listId + i} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: `oklch(0.55 0.15 ${seg.listHue})` }}
              />
              <span className="text-muted-foreground">{seg.listName}</span>
            </div>
          ))}
        </div>
      )}

      {/* Transition zone indicator */}
      {isTransitionZone && (
        <div className="flex items-center gap-2 text-sm text-primary animate-pulse">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span>Approaching list end – ready to continue the spiral?</span>
        </div>
      )}
    </div>
  );
}
