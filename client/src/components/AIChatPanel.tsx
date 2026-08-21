import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { Loader2, Send, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";
import type { QueuedTerm } from "@shared/spiralQueue";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AIChatPanelProps {
  reflectionId: number | null;
  stage: string;
  focalTerm: string;
  activeTermSet: QueuedTerm[];
  stageHue: number;
  // Lifted state — parent owns messages and expanded state
  messages: ChatMessage[];
  onMessagesChange: (msgs: ChatMessage[]) => void;
  isExpanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  // Input state also lifted so it doesn't reset on re-render
  inputValue: string;
  onInputChange: (v: string) => void;
}

export function AIChatPanel({
  reflectionId,
  stage,
  focalTerm,
  activeTermSet,
  stageHue,
  messages,
  onMessagesChange,
  isExpanded,
  onExpandedChange,
  inputValue,
  onInputChange,
}: AIChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (data) => {
      onMessagesChange([
        ...messages,
        { role: "assistant", content: data.message },
      ]);
    },
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getDefaultPrompt = () => {
    const termNames = activeTermSet.map((t) => t.term);
    const otherTerms = termNames.filter((t) => t !== focalTerm).join(", ");

    switch (stage) {
      case "history":
        return `Tell me a story about "${focalTerm}" - where did it come from, who championed it, and what problem was it solving? What surprised you most about its origins?`;
      case "concrete":
      case "concrete_abstract":
        return `Paint me a picture: What does "${focalTerm}" look like in action? Give me a specific example I could observe, then zoom out - what's the abstract principle underneath?`;
      case "abstract":
        return `What's the big idea behind "${focalTerm}"? If you had to explain the theoretical framework to someone who's never encountered it, what metaphor or analogy would you use?`;
      case "amalgam":
      case "amalgamation":
        return `Imagine "${focalTerm}" having a conversation with ${otherTerms}. What unexpected connections emerge? Where do they clash, and where do they harmonize?`;
      case "motion":
        return `If ${termNames.join(", ")} were ingredients in a recipe, what would you create? Propose a concrete project, experiment, or practice that brings these concepts to life.`;
      default:
        return `What insights emerge when you reflect on "${focalTerm}" in relation to today's other terms?`;
    }
  };

  const handleSend = () => {
    if (!inputValue.trim() || !reflectionId) return;

    const userMessage = inputValue.trim();
    onMessagesChange([...messages, { role: "user", content: userMessage }]);
    onInputChange("");

    chatMutation.mutate({
      reflectionId,
      stage,
      message: userMessage,
      context: {
        focalTerm,
        activeTermSet: activeTermSet.map((t) => t.term),
      },
    });
  };

  const handleQuickPrompt = () => {
    onInputChange(getDefaultPrompt());
  };

  const stageColor = `oklch(0.55 0.15 ${stageHue})`;
  const stageBgLight = `oklch(0.95 0.03 ${stageHue})`;

  return (
    <div className="border rounded-lg overflow-hidden" style={{ borderColor: stageColor }}>
      {/* Header - always visible */}
      <button
        onClick={() => onExpandedChange(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium transition-colors hover:bg-accent/50"
        style={{ backgroundColor: isExpanded ? stageBgLight : "transparent" }}
      >
        <span className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" style={{ color: stageColor }} />
          AI Assistant
          {messages.length > 0 && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-mono"
              style={{ backgroundColor: stageColor, color: "white" }}
            >
              {messages.filter((m) => m.role === "assistant").length}
            </span>
          )}
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div className="border-t" style={{ borderColor: stageColor }}>
          {/* Messages area */}
          <ScrollArea className="h-48 p-3" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Ask AI for insights about &ldquo;{focalTerm}&rdquo;</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleQuickPrompt}
                  title="Get a thoughtful prompt to deepen your reflection"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Spark an idea
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "text-sm rounded-lg p-2",
                      msg.role === "user"
                        ? "bg-primary/10 ml-8"
                        : "bg-muted mr-8"
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <Streamdown>{msg.content}</Streamdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                ))}
                {chatMutation.isPending && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking...
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input area */}
          <div className="border-t p-2 space-y-2" style={{ borderColor: stageColor }}>
            {/* AI content isolation notice */}
            <p className="text-[10px] text-muted-foreground italic">
              AI responses are for exploration only and are not saved to your notes or exported.
            </p>
            <div className="flex gap-2">
              <Textarea
                id={`ai-input-${stage}`}
                name={`ai-input-${stage}`}
                value={inputValue}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder="Ask about this term..."
                className="min-h-[60px] text-sm resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!inputValue.trim() || chatMutation.isPending || !reflectionId}
                style={{ backgroundColor: stageColor }}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {!reflectionId && (
              <p className="text-xs text-muted-foreground">
                Save your reflection first to enable AI chat
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
