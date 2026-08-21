import { cn } from "@/lib/utils";
import { QueuedTerm } from "@shared/spiralQueue";
import type { ReflectionDepth } from "@shared/reflectionDepth";
import { getStageConfig } from "@shared/reflectionDepth";

interface CircularWorkflowProps {
  stages: Record<string, QueuedTerm | null>;
  depth: ReflectionDepth;
  activeStage?: string;
  onStageClick?: (stage: string) => void;
  currentListName?: string;
}

export function CircularWorkflow({
  stages,
  depth,
  activeStage,
  onStageClick,
  currentListName,
}: CircularWorkflowProps) {
  const stageConfigs = getStageConfig(depth);
  
  if (!stageConfigs || stageConfigs.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8">
        No stages configured
      </div>
    );
  }
  
  // Calculate positions for stages in a circle
  // Use a smaller radius on mobile (detected via window width at render time)
  const orbitRadius = typeof window !== "undefined" && window.innerWidth < 640 ? 80 : 120;
  const getStagePosition = (index: number, total: number) => {
    // Start from top (12 o'clock) and go clockwise
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    const x = Math.cos(angle) * orbitRadius;
    const y = Math.sin(angle) * orbitRadius;
    return { x, y };
  };

  const renderStage = (
    stageConfig: ReturnType<typeof getStageConfig>[number],
    index: number,
    term: QueuedTerm | null
  ) => {
    const position = getStagePosition(index, stageConfigs.length);
    const isActive = activeStage === stageConfig.id;
    const isEmpty = !term;

    return (
      <div
        key={stageConfig.id}
        className={cn(
          "absolute transition-all duration-300",
          onStageClick && !isEmpty && "cursor-pointer hover:scale-110"
        )}
        style={{
          left: `calc(50% + ${position.x}px)`,
          top: `calc(50% + ${position.y}px)`,
          transform: "translate(-50%, -50%)",
        }}
        onClick={() => onStageClick && !isEmpty && onStageClick(stageConfig.id)}
      >
        <div
          className={cn(
            "w-20 h-20 sm:w-32 sm:h-32 rounded-full border-4 flex flex-col items-center justify-center p-1.5 sm:p-3 text-center transition-all",
            isEmpty
              ? "border-border/30 bg-muted/20"
              : "border-primary bg-card shadow-lg",
            isActive && "ring-4 ring-primary/30"
          )}
          style={{
            borderColor: term ? `hsl(${term.listHue} 70% 50%)` : undefined,
          }}
        >
          <div className="text-xs font-semibold text-muted-foreground mb-1">
            {stageConfig.shortLabel}
          </div>
          {term ? (
            <>
              <div
                className="w-2 h-2 rounded-full mb-1"
                style={{ backgroundColor: `hsl(${term.listHue} 70% 50%)` }}
              />
              <div className="text-sm font-medium line-clamp-2">{term.term}</div>
            </>
          ) : (
            <div className="text-xs text-muted-foreground">Not active</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full max-w-[340px] sm:max-w-md mx-auto" style={{ height: "clamp(280px, 70vw, 400px)" }}>
      {/* Center circle */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30 flex items-center justify-center p-1">
          <div className="text-center">
            {currentListName ? (
              <>
                <div className="text-[9px] font-semibold text-muted-foreground leading-tight uppercase tracking-wide">
                  {depth}-Step
                </div>
                <div
                  className="text-[11px] font-bold text-primary leading-tight mt-0.5 line-clamp-2"
                  title={currentListName}
                >
                  {currentListName}
                </div>
              </>
            ) : (
              <>
                <div className="text-xs font-semibold text-muted-foreground">
                  {depth}-Step
                </div>
                <div className="text-lg font-bold text-primary">Spiral</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Render stages */}
      {stageConfigs.map((config, index) => {
        const term = stages[config.id] || null;
        return renderStage(config, index, term);
      })}

      {/* Connection lines */}
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ width: "100%", height: "100%" }}
      >
        {stageConfigs.map((_, index) => {
          const start = getStagePosition(index, stageConfigs.length);
          const end = getStagePosition((index + 1) % stageConfigs.length, stageConfigs.length);
          return (
            <line
              key={index}
              x1={`calc(50% + ${start.x}px)`}
              y1={`calc(50% + ${start.y}px)`}
              x2={`calc(50% + ${end.x}px)`}
              y2={`calc(50% + ${end.y}px)`}
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="4 4"
              className="text-border/30"
            />
          );
        })}
      </svg>
    </div>
  );
}
