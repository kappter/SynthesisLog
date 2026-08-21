import { Textarea } from "@/components/ui/textarea";
import { AIChatPanel, type ChatMessage } from "./AIChatPanel";
import { QueuedTerm } from "@shared/spiralQueue";
import { getStageConfig, type ReflectionDepth } from "@shared/reflectionDepth";

interface StageFormProps {
  stage: string;
  term: QueuedTerm | null;
  value: string;
  onChange: (value: string) => void;
  rating: number;
  onRatingChange: (rating: number) => void;
  reflectionId: number | null;
  activeTermSet: QueuedTerm[];
  depth: ReflectionDepth;
  // AI feature toggle
  aiEnabled: boolean;
  // Lifted AI chat state — owned by parent, keyed per tile
  aiMessages: ChatMessage[];
  onAiMessagesChange: (msgs: ChatMessage[]) => void;
  aiExpanded: boolean;
  onAiExpandedChange: (expanded: boolean) => void;
  aiInput: string;
  onAiInputChange: (v: string) => void;
}

export function StageForm({
  stage,
  term,
  value,
  onChange,
  rating,
  onRatingChange,
  reflectionId,
  activeTermSet,
  depth,
  aiEnabled,
  aiMessages,
  onAiMessagesChange,
  aiExpanded,
  onAiExpandedChange,
  aiInput,
  onAiInputChange,
}: StageFormProps) {
  const stageConfigs = getStageConfig(depth);
  const stageConfig = stageConfigs.find((s) => s.id === stage);

  if (!stageConfig) return null;

  const hue = term?.listHue ?? 35;
  const stageColor = `oklch(0.55 0.15 ${hue})`;
  const stageBgLight = `oklch(0.96 0.03 ${hue})`;
  const dotActive = `oklch(0.50 0.18 ${hue})`;

  if (!term) {
    return (
      <div className="rounded-lg p-4 opacity-50" style={{ backgroundColor: stageBgLight }}>
        <h3 className="font-semibold text-sm" style={{ color: stageColor }}>
          {stageConfig.label} – <span className="text-muted-foreground">Not active today</span>
        </h3>
      </div>
    );
  }

  return (
    <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: stageBgLight }}>
      <h3 className="font-semibold" style={{ color: stageColor }}>
        {stageConfig.label} – <span className="font-bold">{term.term}</span>
      </h3>

      {/* AI Chat Panel — only shown when AI features are enabled */}
      {aiEnabled && (
        <AIChatPanel
          reflectionId={reflectionId}
          stage={stage}
          focalTerm={term.term}
          activeTermSet={activeTermSet}
          stageHue={hue}
          messages={aiMessages}
          onMessagesChange={onAiMessagesChange}
          isExpanded={aiExpanded}
          onExpandedChange={onAiExpandedChange}
          inputValue={aiInput}
          onInputChange={onAiInputChange}
        />
      )}

      {/* Reflection Textarea — user's own notes only */}
      <Textarea
        id={`reflection-${stage}`}
        name={`reflection-${stage}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={stageConfig.placeholder}
        className="min-h-[120px] bg-background/80"
      />

      {/* Importance Rating — 1–10 dot picker */}
      <div className="pt-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground shrink-0">Importance:</span>
          <div className="flex items-center gap-1" role="group" aria-label="Importance rating 1 to 10">
            {Array.from({ length: 10 }, (_, i) => {
              const val = i + 1;
              const filled = val <= rating;
              return (
                <button
                  key={val}
                  type="button"
                  aria-label={`Rate ${val}`}
                  onClick={() => onRatingChange(val === rating ? 0 : val)}
                  className="rounded-full transition-transform hover:scale-125 focus:outline-none focus-visible:ring-2"
                  style={{
                    width: filled ? "14px" : "10px",
                    height: filled ? "14px" : "10px",
                    background: filled ? dotActive : "oklch(0.80 0.04 " + hue + ")",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  title={`${val}/10`}
                />
              );
            })}
          </div>
          {rating > 0 && (
            <span
              className="text-xs font-bold tabular-nums"
              style={{ color: dotActive }}
            >
              {rating}/10
            </span>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          How significant is this term to you right now? (click again to clear)
        </p>
      </div>
    </div>
  );
}
