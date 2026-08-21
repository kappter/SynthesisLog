import { useMemo } from "react";
import { generateRecommendations, type PathwayRecommendation } from "../../../shared/tokPathways";
import { ExternalLink, BookOpen, Camera, Lightbulb, BarChart3 } from "lucide-react";

interface TOKPathwaysPanelProps {
  /**
   * Map of term → { stageId → rating | null }
   * Passed in from SynthesisLog so the panel reacts to live rating changes.
   */
  termRatings: Record<string, Record<string, number | null>>;
  /** Whether any ratings have been saved yet (controls empty state messaging) */
  hasData: boolean;
}

const AOK_COLORS: Record<string, string> = {
  "Natural Sciences": "bg-emerald-500",
  "Human Sciences": "bg-teal-500",
  "History": "bg-amber-500",
  "The Arts": "bg-rose-500",
  "Mathematics": "bg-indigo-500",
  "Language & Literature": "bg-violet-500",
  "Ethics": "bg-orange-500",
  "Religious Knowledge": "bg-sky-500",
};

const AOK_TEXT: Record<string, string> = {
  "Natural Sciences": "text-emerald-700 dark:text-emerald-300",
  "Human Sciences": "text-teal-700 dark:text-teal-300",
  "History": "text-amber-700 dark:text-amber-300",
  "The Arts": "text-rose-700 dark:text-rose-300",
  "Mathematics": "text-indigo-700 dark:text-indigo-300",
  "Language & Literature": "text-violet-700 dark:text-violet-300",
  "Ethics": "text-orange-700 dark:text-orange-300",
  "Religious Knowledge": "text-sky-700 dark:text-sky-300",
};

export default function TOKPathwaysPanel({ termRatings, hasData }: TOKPathwaysPanelProps) {
  const rec: PathwayRecommendation = useMemo(
    () => generateRecommendations(termRatings),
    [termRatings]
  );

  const hasRecommendations = rec.topTerms.some((t) => t.pathway !== null);

  return (
    <div className="rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-indigo-50/60 dark:bg-indigo-950/30">
        <Lightbulb className="w-4 h-4 text-indigo-500 shrink-0" />
        <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
          TOK Pathways
        </h3>
        <span className="ml-auto text-[10px] text-indigo-400 dark:text-indigo-500 font-medium uppercase tracking-wider">
          IB Assessment Guide
        </span>
      </div>

      <div className="p-4 space-y-5">
        {/* Empty state */}
        {!hasData && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Save your first reflection ratings to see your emerging TOK profile.
          </p>
        )}

        {hasData && !hasRecommendations && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Your concepts don't yet match the TOK pathway database. Keep reflecting — your profile will build as you progress.
          </p>
        )}

        {/* AOK Heat Map */}
        {rec.aokScores.length > 0 && (
          <section>
            <div className="flex items-center gap-1.5 mb-2">
              <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Areas of Knowledge Profile
              </span>
            </div>
            <div className="space-y-1.5">
              {rec.aokScores.slice(0, 6).map(({ aok, pct }) => (
                <div key={aok} className="flex items-center gap-2">
                  <span className="text-[11px] text-foreground/70 w-36 shrink-0 truncate">{aok}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${AOK_COLORS[aok] ?? "bg-primary"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-7 text-right">{pct}%</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Exhibition Prompts */}
        {rec.exhibitionPrompts.length > 0 && (
          <section>
            <div className="flex items-center gap-1.5 mb-2">
              <Camera className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Exhibition Object Directions
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground/70 mb-2 italic">
              Inspiration only — choose your own object that connects to these themes.
            </p>
            <div className="space-y-2">
              {rec.exhibitionPrompts.map(({ prompt, term, aok }, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border/50 bg-background/60 p-2.5"
                >
                  <p className="text-xs text-foreground/90 leading-relaxed">{prompt}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] font-medium text-foreground/50">via</span>
                    <span className="text-[10px] font-semibold text-foreground/70">{term}</span>
                    <span className="text-[10px] text-foreground/40">·</span>
                    <span className={`text-[10px] font-medium ${AOK_TEXT[aok] ?? "text-primary"}`}>
                      {aok}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <a
              href="https://kappter.github.io/portfolio/tok2.html"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center gap-1 text-[11px] text-indigo-500 hover:text-indigo-600 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Open Exhibition Amalgamator →
            </a>
          </section>
        )}

        {/* Essay KQ Frames */}
        {rec.essayKQFrames.length > 0 && (
          <section>
            <div className="flex items-center gap-1.5 mb-2">
              <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Essay Knowledge Question Frames
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground/70 mb-2 italic">
              Adapt these frames to your own prescribed title and argument.
            </p>
            <div className="space-y-2">
              {rec.essayKQFrames.map(({ frame, term, aok }, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border/50 bg-background/60 p-2.5"
                >
                  <p className="text-xs text-foreground/90 leading-relaxed italic">"{frame}"</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] font-medium text-foreground/50">via</span>
                    <span className="text-[10px] font-semibold text-foreground/70">{term}</span>
                    <span className="text-[10px] text-foreground/40">·</span>
                    <span className={`text-[10px] font-medium ${AOK_TEXT[aok] ?? "text-primary"}`}>
                      {aok}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <a
              href="https://kappter.github.io/portfolio/tok3.html"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center gap-1 text-[11px] text-indigo-500 hover:text-indigo-600 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Open Essay Brainstorm Tool →
            </a>
          </section>
        )}

        {/* Top Terms summary */}
        {rec.topTerms.filter((t) => t.weightedScore > 0).length > 0 && (
          <section>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Strongest Concepts (weighted)
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {rec.topTerms
                .filter((t) => t.weightedScore > 0)
                .slice(0, 5)
                .map(({ term, weightedScore, pathway }) => (
                  <span
                    key={term}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border border-border/60 bg-muted/50"
                    title={pathway?.aoks.join(", ") ?? "No AOK mapping"}
                  >
                    {term}
                    <span className="text-muted-foreground/60">{weightedScore.toFixed(1)}</span>
                  </span>
                ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
