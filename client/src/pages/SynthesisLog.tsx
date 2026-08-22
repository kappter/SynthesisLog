import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircularWorkflow } from "@/components/CircularWorkflow";
import { SpiralProgressBar } from "@/components/SpiralProgressBar";
import { StageForm } from "@/components/StageForm";
import { ListSelectorMulti } from "@/components/ListSelectorMulti";
import { ReflectionCalendar } from "@/components/ReflectionCalendar";
import { PrintableWorksheet } from "@/components/PrintableWorksheet";
import TOKPathwaysPanel from "@/components/TOKPathwaysPanel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { SpiralMode } from "@shared/spiralTypes";
import type { ChatMessage } from "@/components/AIChatPanel";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Download,
  Upload,
  Sun,
  Moon,
  RefreshCw,
  X,
  Printer,
  CalendarDays,
  MoreHorizontal,
  FileJson,
  FileText,
  Sparkles,
  BrainCircuit,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/ThemeContext";
import {
  QueuedTerm,
  buildSpiralQueue,
  calculateSegments,
  getQueueForDay,
  getStagesForDay,
  getTotalDays,
  isInTransitionZone,
  type ConceptWeightMap,
  applyWeightDecay,
  recordTermSelected,
  recordHighRating,
  recordManualReference,
  getTopWeightedTerms,
  detectReferencedTerms,
} from "@shared/spiralQueue";
import { PRESET_LISTS } from "@shared/presets";
import type { ReflectionDepth } from "@shared/reflectionDepth";
import { getStageConfig } from "@shared/reflectionDepth";
import { generateIcsCalendar } from "@shared/icsCalendar";
import { isStaticMode } from "@/lib/staticMode";

interface SpiralState {
  segments: Array<{
    listId: string;
    listName: string;
    listHue: number;
    terms: string[];
  }>;
  shuffledTerms: QueuedTerm[];
  currentDay: number;
  startDate: string | null;
  mode: SpiralMode;
  reflectionDepth: ReflectionDepth;
}

interface ReflectionState {
  [stageId: string]: string;
}

interface RatingsState {
  [stageId: string]: number; // 0 = unrated, 1–10
}

export default function SynthesisLog() {
  const { user, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const staticMode = isStaticMode();

  // Spiral state
  const [spiralState, setSpiralState] = useState<SpiralState>({
    segments: [],
    shuffledTerms: [],
    currentDay: 1,
    startDate: null,
    mode: "shuffled",
    reflectionDepth: 4,
  });

  // Build empty reflection/rating state for the current depth
  const emptyReflections = useCallback((depth: ReflectionDepth): ReflectionState => {
    const obj: ReflectionState = {};
    for (const s of getStageConfig(depth)) obj[s.id] = "";
    return obj;
  }, []);
  const emptyRatings = useCallback((depth: ReflectionDepth): RatingsState => {
    const obj: RatingsState = {};
    for (const s of getStageConfig(depth)) obj[s.id] = 0;
    return obj;
  }, []);

  // Current day's reflections
  const [reflections, setReflections] = useState<ReflectionState>(() => emptyReflections(4));

  // Per-stage importance ratings (1–10, 0 = unrated)
  const [ratings, setRatings] = useState<RatingsState>(() => emptyRatings(4));

  // Adaptive concept weights (Blended/Adaptive mode only)
  const [conceptWeights, setConceptWeights] = useState<ConceptWeightMap>(() => {
    const saved = localStorage.getItem("synthesisLog_conceptWeights");
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return {};
  });

  // Persist weights to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("synthesisLog_conceptWeights", JSON.stringify(conceptWeights));
  }, [conceptWeights]);

  // Reflection ID for AI chat (server-provided after save)
  const [reflectionId, setReflectionId] = useState<number | null>(null);
  
  // Stable ID for AI chat that doesn't change on save (prevents remount)
  const stableReflectionId = useMemo(() => spiralState.currentDay, [spiralState.currentDay]);

  // Day input for navigation
  const [dayInput, setDayInput] = useState("1");
  
  // Print worksheet dialog
  const [printWorksheetOpen, setPrintWorksheetOpen] = useState(false);

  // PDF export report type dialog
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfReportType, setPdfReportType] = useState<'standard' | 'ib-tok'>('standard');

  // ── AI Feature Toggle ──────────────────────────────────────────────────────
  const [aiEnabled, setAiEnabled] = useState<boolean>(() => {
    if (isStaticMode()) return false;
    const saved = localStorage.getItem("synthesisLog_aiEnabled");
    return saved === null ? true : saved === "true";
  });
  const toggleAiEnabled = useCallback(() => {
    if (staticMode) {
      toast.message("AI is unavailable in the browser-only static version.");
      return;
    }
    setAiEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("synthesisLog_aiEnabled", String(next));
      return next;
    });
  }, [staticMode]);

  // ── AI Chat Cache ─────────────────────────────────────────────────────────
  // Key format: "day{N}-{stageId}-{term}" — persisted in sessionStorage
  type AiCacheKey = string;
  const buildAiCacheKey = (day: number, stageId: string, term: string): AiCacheKey =>
    `day${day}-${stageId}-${term}`;

  const [aiMessages, setAiMessages] = useState<Record<AiCacheKey, ChatMessage[]>>(() => {
    try {
      const saved = sessionStorage.getItem("synthesisLog_aiChats");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  // Persist AI cache to sessionStorage on every change
  useEffect(() => {
    try {
      sessionStorage.setItem("synthesisLog_aiChats", JSON.stringify(aiMessages));
    } catch { /* quota exceeded — silently skip */ }
  }, [aiMessages]);

  const getAiMessages = useCallback((day: number, stageId: string, term: string): ChatMessage[] => {
    return aiMessages[buildAiCacheKey(day, stageId, term)] ?? [];
  }, [aiMessages]);

  const setAiMessagesForTile = useCallback((day: number, stageId: string, term: string, msgs: ChatMessage[]) => {
    setAiMessages((prev) => ({ ...prev, [buildAiCacheKey(day, stageId, term)]: msgs }));
  }, []);

  // Per-tile expanded + input state (keyed same way)
  const [aiExpanded, setAiExpanded] = useState<Record<AiCacheKey, boolean>>({});
  const [aiInput, setAiInput] = useState<Record<AiCacheKey, string>>({});

  // ── Animation speed ──────────────────────────────────────────────────────
  const [animationSpeed, setAnimationSpeed] = useState<number>(() => {
    const saved = localStorage.getItem("synthesisLog_animSpeed");
    return saved ? parseFloat(saved) : 1;
  });
  const handleAnimSpeedChange = (v: number) => {
    setAnimationSpeed(v);
    localStorage.setItem("synthesisLog_animSpeed", String(v));
  };

  // tRPC mutations
  const saveReflection = trpc.reflection.save.useMutation({
    onSuccess: (data) => {
      setReflectionId(data.reflectionId);
      toast.success("Reflection saved");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Calculate derived values
  const totalDays = useMemo(() => {
    const termCount = spiralState.shuffledTerms.length;
    return termCount > 0 ? getTotalDays(termCount) : 0;
  }, [spiralState.shuffledTerms]);

  const segmentInfo = useMemo(() => {
    return calculateSegments(spiralState.segments);
  }, [spiralState.segments]);

  const currentQueue = useMemo(() => {
    return getQueueForDay(spiralState.shuffledTerms, spiralState.currentDay);
  }, [spiralState.shuffledTerms, spiralState.currentDay]);

  const currentStages = useMemo(() => {
    return getStagesForDay(
      spiralState.shuffledTerms,
      spiralState.currentDay,
      spiralState.reflectionDepth
    );
  }, [spiralState.shuffledTerms, spiralState.currentDay, spiralState.reflectionDepth]);

  const activeTermSet = useMemo(() => {
    // Only show terms that have active stages (not all terms in queue)
    return Object.values(currentStages)
      .filter((t): t is QueuedTerm => t !== null);
  }, [currentStages]);

  const transitionZone = useMemo(() => {
    if (spiralState.segments.length === 0) return false;
    const lastSegment = spiralState.segments[spiralState.segments.length - 1];
    const startDay = spiralState.segments
      .slice(0, -1)
      .reduce((sum, s) => sum + s.terms.length, 1);
    return isInTransitionZone(
      spiralState.currentDay,
      lastSegment.terms.length,
      startDay
    );
  }, [spiralState]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("synthesisLog_spiral");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Add default reflectionDepth for old data
        if (!parsed.reflectionDepth) {
          parsed.reflectionDepth = 4;
        }
        setSpiralState(parsed);
        setDayInput(String(parsed.currentDay));
      } catch (e) {
        console.error("Failed to load saved state:", e);
      }
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (spiralState.segments.length > 0) {
      localStorage.setItem("synthesisLog_spiral", JSON.stringify(spiralState));
    }
  }, [spiralState]);

  // Load reflections + ratings for current day from localStorage
  useEffect(() => {
    const key = `synthesisLog_reflections_day${spiralState.currentDay}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Support both old format (plain strings) and new format ({ text, rating })
        const texts: ReflectionState = {};
        const ratingMap: RatingsState = {};
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof v === "string") {
            texts[k] = v;
            ratingMap[k] = 0;
          } else if (v && typeof v === "object" && "text" in v) {
            texts[k] = (v as { text: string; rating: number }).text;
            ratingMap[k] = (v as { text: string; rating: number }).rating ?? 0;
          }
        }
        setReflections(texts);
        setRatings(ratingMap);
      } catch (e) {
        setReflections(emptyReflections(spiralState.reflectionDepth));
        setRatings(emptyRatings(spiralState.reflectionDepth));
      }
    } else {
      setReflections(emptyReflections(spiralState.reflectionDepth));
      setRatings(emptyRatings(spiralState.reflectionDepth));
    }
  }, [spiralState.currentDay, spiralState.reflectionDepth, emptyReflections, emptyRatings]);

  const handleAddLists = useCallback(
    (
      lists: Array<{ id: string; name: string; hue: number; terms: string[] }>,
      mode: SpiralMode,
      depth: ReflectionDepth
    ) => {
      setSpiralState((prev) => {
        const newSegments = lists.map((list) => ({
          listId: list.id,
          listName: list.name,
          listHue: list.hue,
          terms: list.terms,
        }));

        const allSegments = [...prev.segments, ...newSegments];
        const newQueue = buildSpiralQueue(allSegments, mode);

        return {
          ...prev,
          segments: allSegments,
          shuffledTerms: newQueue,
          startDate: prev.startDate || new Date().toISOString().slice(0, 10),
          mode,
          reflectionDepth: depth,
        };
      });

      if (lists.length === 1) {
        toast.success(`Added "${lists[0].name}" to your spiral`);
      } else {
        toast.success(`Added ${lists.length} lists in ${mode} mode`);
      }
    },
    []
  );

  const handleDayChange = useCallback(
    (newDay: number) => {
      if (newDay >= 1 && newDay <= totalDays) {
        setSpiralState((prev) => ({ ...prev, currentDay: newDay }));
        setDayInput(String(newDay));
      }
    },
    [totalDays]
  );

  const handleSaveReflections = useCallback(() => {
    // Save to localStorage — new format: { [stageId]: { text, rating } }
    const key = `synthesisLog_reflections_day${spiralState.currentDay}`;
    const combined: Record<string, { text: string; rating: number }> = {};
    for (const stageId of Object.keys(reflections)) {
      combined[stageId] = { text: reflections[stageId] || "", rating: ratings[stageId] ?? 0 };
    }
    localStorage.setItem(key, JSON.stringify(combined));

    // --- Adaptive weight updates (Blended mode only) ---
    if (spiralState.mode === "blended") {
      let updatedWeights = { ...conceptWeights };
      const cycle = spiralState.currentDay;
      const allKnownTerms = spiralState.shuffledTerms.map((t) => t.term);

      // +1 for each active term (selected into today's window)
      for (const t of activeTermSet) {
        updatedWeights = recordTermSelected(updatedWeights, t.term, cycle);
      }

      // +2 for any stage with a high rating (≥7)
      for (const [stageId, rating] of Object.entries(ratings)) {
        if (rating >= 7) {
          const term = currentStages[stageId];
          if (term) updatedWeights = recordHighRating(updatedWeights, term.term);
        }
      }

      // +3 for any term mentioned by name in any reflection text
      const allText = Object.values(reflections).join(" ");
      const referenced = detectReferencedTerms(allText, allKnownTerms);
      for (const term of referenced) {
        // Only count as manual reference if the term is NOT already in today's active set
        const isActive = activeTermSet.some((t) => t.term === term);
        if (!isActive) {
          updatedWeights = recordManualReference(updatedWeights, term);
        }
      }

      // Apply decay once per save
      updatedWeights = applyWeightDecay(updatedWeights);
      setConceptWeights(updatedWeights);
    }

    // If user is logged in, also save to server
    if (user && spiralState.segments.length > 0) {
      saveReflection.mutate({
        termBankId: 1, // We'll use a simple ID for now
        dayIndex: spiralState.currentDay,
        termHistory: currentStages.history?.term,
        termConcrete: currentStages.concrete?.term,
        termAmalgam: currentStages.amalgam?.term,
        termMotion: currentStages.motion?.term,
        textHistory: reflections.history || "",
        textConcrete: reflections.concrete || "",
        textAmalgam: reflections.amalgam || "",
        textMotion: reflections.motion || "",
      });
    } else {
      toast.success("Reflection saved locally");
    }
  }, [spiralState, reflections, ratings, currentStages, user, saveReflection]);

  const handleExport = useCallback(() => {
    // Gather all reflections from localStorage (user notes only — no AI content)
    const allReflections: Record<string, ReflectionState> = {};
    for (let i = 1; i <= totalDays; i++) {
      const key = `synthesisLog_reflections_day${i}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        allReflections[`day-${i}`] = JSON.parse(saved);
      }
    }

    // Gather AI chat history from sessionStorage (clearly labelled, separate from notes)
    let aiChats: Record<string, ChatMessage[]> = {};
    try {
      const savedChats = sessionStorage.getItem("synthesisLog_aiChats");
      if (savedChats) aiChats = JSON.parse(savedChats);
    } catch { /* ignore */ }

    const exportData = {
      version: 4,
      exportDate: new Date().toISOString(),
      spiral: spiralState,
      conceptWeights,
      aiEnabled,
      // AI conversations — separate from user notes, clearly labelled
      aiChats,
      reflections: allReflections,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `synthesis-log-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Log exported");
  }, [spiralState, totalDays]);

  const exportPDF = trpc.spiral.exportPDF.useMutation({
    onSuccess: (data) => {
      // Convert base64 to blob and download
      const byteCharacters = atob(data.pdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF exported successfully');
    },
    onError: (error) => {
      toast.error(`Export failed: ${error.message}`);
    },
  });

  // Opens the report-type picker dialog
  const handleExportPDF = useCallback(() => {
    if (spiralState.segments.length === 0) {
      toast.error('No spiral data to export');
      return;
    }
    if (staticMode) {
      toast.message("Static mode uses your browser's Print dialog. Choose ‘Save as PDF’ to create a PDF.");
      setPrintWorksheetOpen(true);
      return;
    }
    setPdfDialogOpen(true);
  }, [spiralState.segments.length, staticMode]);

  // Actually fires the mutation with the chosen report type
  const doExportPDF = useCallback((reportType: 'standard' | 'ib-tok') => {
    if (staticMode) {
      setPdfDialogOpen(false);
      setPrintWorksheetOpen(true);
      return;
    }
    // Gather all reflections from localStorage
    // Flatten each field to a plain string — stored values may be objects like { text: "...", aiSuggestion: "..." }
    const reflections: Record<string, Record<string, string>> = {};
    for (let i = 1; i <= totalDays; i++) {
      const key = `synthesisLog_reflections_day${i}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, unknown>;
        const flat: Record<string, string> = {};
        for (const [field, val] of Object.entries(parsed)) {
          if (typeof val === 'string') {
            flat[field] = val;
          } else if (val && typeof val === 'object' && 'text' in val) {
            flat[field] = String((val as { text: unknown }).text ?? '');
          } else {
            flat[field] = val != null ? JSON.stringify(val) : '';
          }
        }
        reflections[i] = flat;
      }
    }

    exportPDF.mutate({
      segments: spiralState.segments.map((seg, idx) => ({
        listId: seg.listId,
        listName: seg.listName,
        listHue: seg.listHue,
        terms: seg.terms,
        startDay: segmentInfo[idx]?.startDay || 0,
      })),
      reflections,
      startDate: spiralState.startDate || new Date().toISOString(),
      currentDay: spiralState.currentDay,
      reflectionDepth: spiralState.reflectionDepth,
      reportType,
    });
  }, [spiralState, totalDays, segmentInfo, exportPDF, staticMode]);

  const exportCalendar = trpc.spiral.exportCalendar.useMutation({
    onSuccess: (data) => {
      const byteCharacters = atob(data.ics);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Calendar exported! Import the .ics file into Google Calendar.');
    },
    onError: (err) => {
      toast.error('Failed to export calendar: ' + err.message);
    },
  });

  const handleExportCalendar = useCallback(() => {
    if (spiralState.segments.length === 0 || spiralState.shuffledTerms.length === 0) {
      toast.error('No spiral data to export');
      return;
    }
    const startDate = spiralState.startDate || new Date().toISOString().split('T')[0];
    if (staticMode) {
      const ics = generateIcsCalendar({
        allTerms: spiralState.shuffledTerms,
        startDate,
        totalDays,
        reflectionDepth: spiralState.reflectionDepth,
        calendarName: `Synthesis Log — ${spiralState.segments.map(s => s.listName).join(' + ')}`,
        appId: `local-${Date.now()}`,
      });
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'synthesis-log-spiral.ics';
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success('Calendar exported locally. Import the .ics file into your calendar.');
      return;
    }
    exportCalendar.mutate({
      allTerms: spiralState.shuffledTerms,
      startDate,
      totalDays,
      reflectionDepth: spiralState.reflectionDepth,
      calendarName: `Synthesis Log — ${spiralState.segments.map(s => s.listName).join(' + ')}`,
    });
  }, [spiralState, totalDays, exportCalendar, staticMode]);

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be re-imported if needed
    e.target.value = "";

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        // Accept version 2 files; also accept version 1 files with basic spiral data
        const spiral = data.spiral || data;
        if (spiral && spiral.segments && Array.isArray(spiral.segments)) {
          // Restore concept weights if present
          if (data.conceptWeights && typeof data.conceptWeights === "object") {
            setConceptWeights(data.conceptWeights);
            localStorage.setItem("synthesisLog_conceptWeights", JSON.stringify(data.conceptWeights));
          }

          // Restore AI toggle preference
          if (typeof data.aiEnabled === "boolean") {
            setAiEnabled(data.aiEnabled);
            localStorage.setItem("synthesisLog_aiEnabled", String(data.aiEnabled));
          }

          // Restore AI chat history to sessionStorage
          if (data.aiChats && typeof data.aiChats === "object") {
            try {
              sessionStorage.setItem("synthesisLog_aiChats", JSON.stringify(data.aiChats));
              setAiMessages(data.aiChats);
            } catch { /* quota exceeded */ }
          }

          // Ensure required fields have defaults for forward/backward compatibility
          const importedState: SpiralState = {
            segments: spiral.segments,
            shuffledTerms: spiral.shuffledTerms || [],
            currentDay: spiral.currentDay || 1,
            startDate: spiral.startDate || null,
            mode: spiral.mode || "shuffled",
            reflectionDepth: spiral.reflectionDepth || 4,
          };

          // Restore all reflections to localStorage first
          if (data.reflections) {
            Object.entries(data.reflections).forEach(([key, value]) => {
              const dayNum = key.replace("day-", "");
              localStorage.setItem(
                `synthesisLog_reflections_day${dayNum}`,
                JSON.stringify(value)
              );
            });
          }

          // Load current day's reflections immediately
          const importDepth = importedState.reflectionDepth || 4;
          const currentDayKey = `synthesisLog_reflections_day${importedState.currentDay}`;
          const currentDayData = localStorage.getItem(currentDayKey);
          if (currentDayData) {
            try {
              const parsedDay = JSON.parse(currentDayData) as Record<string, unknown>;
              const restoredReflections = emptyReflections(importDepth);
              const restoredRatings = emptyRatings(importDepth);
              for (const [stageId, value] of Object.entries(parsedDay)) {
                if (typeof value === "string") {
                  restoredReflections[stageId] = value;
                } else if (value && typeof value === "object" && "text" in value) {
                  const entry = value as { text?: unknown; rating?: unknown };
                  restoredReflections[stageId] = String(entry.text ?? "");
                  restoredRatings[stageId] = typeof entry.rating === "number" ? entry.rating : 0;
                }
              }
              setReflections(restoredReflections);
              setRatings(restoredRatings);
            } catch {
              setReflections(emptyReflections(importDepth));
              setRatings(emptyRatings(importDepth));
            }
          } else {
            setReflections(emptyReflections(importDepth));
            setRatings(emptyRatings(importDepth));
          }

          setSpiralState(importedState);
          setDayInput(String(importedState.currentDay));

          const dayCount = Object.keys(data.reflections || {}).length;
          toast.success(`Log imported — ${dayCount} day${dayCount !== 1 ? "s" : ""} of reflections restored`);
        } else {
          toast.error("Invalid or incompatible log file. Please use a file exported from Synthesis Log.");
        }
      } catch (err) {
        toast.error("Failed to read log file. Make sure it is a valid .json export.");
      }
    };
    reader.readAsText(file);
  }, [emptyReflections, emptyRatings]);

  // Show getting started if no lists
  if (spiralState.segments.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Synthesis Log</h1>
              <p className="text-muted-foreground text-lg">
                Multi-stage circular reflection on a rotating term bank
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Start Your Learning Spiral</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Choose a term list to begin. Each term will progress through 2-5
                  stages of reflection based on your selected depth: History, Concrete/Abstract, Amalgamation, and Motion.
                </p>
                <ListSelectorMulti onSelectLists={handleAddLists} />

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-4 border-t">
                  <span className="text-sm text-muted-foreground">
                    Or import an existing log:
                  </span>
                  <label htmlFor="import-json-empty" className="cursor-pointer">
                    <Input
                      id="import-json-empty"
                      name="import-json-empty"
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={handleImport}
                    />
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Import JSON
                      </span>
                    </Button>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6 space-y-6">
        {/* Header */}
        <header className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold leading-tight">Synthesis Log</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Multi-stage circular reflection on a rotating term bank{" "}
              <Link href="/about" className="underline underline-offset-2 opacity-60 hover:opacity-100 transition-opacity">About</Link>
            </p>
          </div>

          {/* Action toolbar */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Theme toggle — always visible */}
            <Button variant="ghost" size="icon" onClick={toggleTheme} title={theme === "dark" ? "Switch to light" : "Switch to dark"}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Desktop: show key actions inline */}
            <div className="hidden md:flex items-center gap-1.5">
              {/* AI toggle */}
              <Button
                variant={aiEnabled ? "outline" : "secondary"}
                size="sm"
                onClick={toggleAiEnabled}
                disabled={staticMode}
                title={staticMode ? "AI requires an optional external AI gateway" : aiEnabled ? "Hide AI Assistant" : "Show AI Assistant"}
              >
                {aiEnabled ? <Sparkles className="h-4 w-4 mr-1.5" /> : <BrainCircuit className="h-4 w-4 mr-1.5" />}
                {staticMode ? "AI Unavailable" : aiEnabled ? "AI On" : "AI Off"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <FileJson className="h-4 w-4 mr-1.5" />
                Export JSON
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={!staticMode && exportPDF.isPending}>
                <FileText className="h-4 w-4 mr-1.5" />
                {staticMode ? "Print / PDF" : exportPDF.isPending ? "Generating…" : "Export PDF"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCalendar} disabled={!staticMode && exportCalendar.isPending}>
                <CalendarDays className="h-4 w-4 mr-1.5" />
                {staticMode ? "Calendar" : exportCalendar.isPending ? "Exporting…" : "Calendar"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPrintWorksheetOpen(true)}>
                <Printer className="h-4 w-4 mr-1.5" />
                Print
              </Button>
              <label htmlFor="import-json-toolbar" className="cursor-pointer">
                <Input id="import-json-toolbar" name="import-json-toolbar" type="file" accept=".json" className="hidden" onChange={handleImport} />
                <Button variant="outline" size="sm" asChild>
                  <span><Upload className="h-4 w-4 mr-1.5" />Import</span>
                </Button>
              </label>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (confirm("Clear all data and reset the spiral? This cannot be undone.")) {
                    localStorage.removeItem("synthesisLog_spiral");
                    localStorage.removeItem("synthesisLog_conceptWeights");
                    setSpiralState({ segments: [], shuffledTerms: [], currentDay: 1, startDate: null, mode: "shuffled", reflectionDepth: 4 });
                    setConceptWeights({});
                    setReflections({});
                    setDayInput("1");
                    toast.success("Spiral reset");
                  }
                }}
              >
                <X className="h-4 w-4 mr-1.5" />Clear
              </Button>
            </div>

            {/* Mobile/tablet: overflow menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={toggleAiEnabled} disabled={staticMode}>
                  {aiEnabled ? <Sparkles className="h-4 w-4 mr-2" /> : <BrainCircuit className="h-4 w-4 mr-2" />}
                  {staticMode ? "AI unavailable in static mode" : aiEnabled ? "Hide AI Assistant" : "Show AI Assistant"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExport}>
                  <FileJson className="h-4 w-4 mr-2" />Export JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF} disabled={!staticMode && exportPDF.isPending}>
                  <FileText className="h-4 w-4 mr-2" />{staticMode ? "Print / PDF" : exportPDF.isPending ? "Generating…" : "Export PDF"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCalendar} disabled={!staticMode && exportCalendar.isPending}>
                  <CalendarDays className="h-4 w-4 mr-2" />{staticMode ? "Export Calendar" : exportCalendar.isPending ? "Exporting…" : "Export Calendar"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPrintWorksheetOpen(true)}>
                  <Printer className="h-4 w-4 mr-2" />Print Today
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <label htmlFor="import-json-mobile" className="cursor-pointer w-full flex items-center">
                    <Input id="import-json-mobile" name="import-json-mobile" type="file" accept=".json" className="hidden" onChange={handleImport} />
                    <Upload className="h-4 w-4 mr-2" />Import JSON
                  </label>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => {
                    if (confirm("Clear all data and reset the spiral? This cannot be undone.")) {
                      localStorage.removeItem("synthesisLog_spiral");
                      setSpiralState({ segments: [], shuffledTerms: [], currentDay: 1, startDate: null, mode: "shuffled", reflectionDepth: 4 });
                      setReflections({});
                      setDayInput("1");
                      toast.success("Spiral reset");
                    }
                  }}
                >
                  <X className="h-4 w-4 mr-2" />Clear All Data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Progress Bar */}
        <Card>
          <CardContent className="pt-6">
            <SpiralProgressBar
              segments={segmentInfo}
              currentDay={spiralState.currentDay}
              totalDays={totalDays}
              isTransitionZone={transitionZone}
            />
          </CardContent>
        </Card>

        {/* Day Navigation */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleDayChange(spiralState.currentDay - 1)}
            disabled={spiralState.currentDay <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Day</span>
            <Input
              type="number"
              value={dayInput}
              onChange={(e) => setDayInput(e.target.value)}
              onBlur={() => handleDayChange(parseInt(dayInput) || 1)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleDayChange(parseInt(dayInput) || 1);
                }
              }}
              className="w-20 text-center"
              min={1}
              max={totalDays}
            />
            <span className="text-sm text-muted-foreground">of {totalDays}</span>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => handleDayChange(spiralState.currentDay + 1)}
            disabled={spiralState.currentDay >= totalDays}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Circular Workflow */}
        <div className="flex justify-center">
          <CircularWorkflow
            stages={currentStages}
            depth={spiralState.reflectionDepth}
            currentListName={(() => {
              // Find which segment the current day belongs to
              for (let i = segmentInfo.length - 1; i >= 0; i--) {
                if (spiralState.currentDay >= segmentInfo[i].startDay) {
                  return spiralState.segments[i]?.listName;
                }
              }
              return spiralState.segments[0]?.listName;
            })()}
          />
        </div>



        {/* Today's Four-Term Set */}
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <span className="text-sm font-medium text-muted-foreground">
                Today's {Object.values(currentStages).filter(t => t !== null).length}-term set:
              </span>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                {Object.values(currentStages).filter(t => t !== null).length > 0 ? (
                  Object.values(currentStages)
                    .filter((t): t is QueuedTerm => t !== null)
                    .map((queuedTerm, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: `oklch(0.55 0.15 ${queuedTerm.listHue})`,
                        }}
                      />
                      <span className="text-lg font-semibold">{queuedTerm.term}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-lg font-semibold">—</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stage Forms */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {getStageConfig(spiralState.reflectionDepth).map((stageConfig: { id: string }) => {
            const stageId = stageConfig.id;
            const termLabel = currentStages[stageId]?.term ?? "";
            const cacheKey = `day${spiralState.currentDay}-${stageId}-${termLabel}`;
            return (
              <StageForm
                key={stageId}
                stage={stageId}
                term={currentStages[stageId]}
                value={reflections[stageId] || ""}
                onChange={(v) => setReflections((r) => ({ ...r, [stageId]: v }))}
                rating={ratings[stageId] ?? 0}
                onRatingChange={(r) => setRatings((prev) => ({ ...prev, [stageId]: r }))}
                reflectionId={stableReflectionId}
                activeTermSet={activeTermSet}
                depth={spiralState.reflectionDepth}
                aiEnabled={aiEnabled}
                aiMessages={getAiMessages(spiralState.currentDay, stageId, termLabel)}
                onAiMessagesChange={(msgs) => setAiMessagesForTile(spiralState.currentDay, stageId, termLabel, msgs)}
                aiExpanded={aiExpanded[cacheKey] ?? false}
                onAiExpandedChange={(v) => setAiExpanded((prev) => ({ ...prev, [cacheKey]: v }))}
                aiInput={aiInput[cacheKey] ?? ""}
                onAiInputChange={(v) => setAiInput((prev) => ({ ...prev, [cacheKey]: v }))}
              />
            );
          })}
        </div>

        {/* Save Button */}
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Button className="w-full sm:w-auto" onClick={handleSaveReflections} disabled={saveReflection.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {saveReflection.isPending ? "Saving..." : "Save Reflections"}
          </Button>

          {transitionZone && (
            <ListSelectorMulti onSelectLists={handleAddLists} isTransitionZone />
          )}
        </div>

        {/* Reflection History Calendar */}
        <ReflectionCalendar
          startDate={spiralState.startDate}
          currentDay={spiralState.currentDay}
          segments={spiralState.segments}
          onDayClick={handleDayChange}
        />

        {/* Recurring Concepts Panel — Adaptive/Blended mode only */}
        {spiralState.mode === "blended" && (() => {
          // Build a merged weight map: all known terms at default 1.0, overridden by any saved weights
          const allTerms = spiralState.shuffledTerms;
          if (allTerms.length === 0) return null;

          const mergedWeights: ConceptWeightMap = {};
          for (const t of allTerms) {
            mergedWeights[t.term] = conceptWeights[t.term] ?? {
              dynamicWeight: 1,
              timesSelected: 0,
              timesReferenced: 0,
              lastSeenCycle: 0,
              manualBoost: false,
            };
          }

          const top = getTopWeightedTerms(mergedWeights, 5);
          const maxWeight = Math.max(...top.map((x) => x.weight.dynamicWeight), 1);

          return (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
                  Recurring Concepts
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    — adaptive tracking active · top {top.length} of {allTerms.length} terms
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {top.map(({ term, weight }) => {
                    const pct = Math.min(100, Math.round((weight.dynamicWeight / maxWeight) * 100));
                    const hasActivity = weight.timesSelected > 0 || weight.timesReferenced > 0;
                    return (
                      <div
                        key={term}
                        className={`flex flex-col gap-1 px-3 py-2 rounded-lg border min-w-[120px] ${
                          hasActivity
                            ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
                            : "bg-muted/40 border-border"
                        }`}
                      >
                        <span className={`text-sm font-semibold ${
                          hasActivity ? "text-amber-900 dark:text-amber-200" : "text-foreground"
                        }`}>{term}</span>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-amber-200 dark:bg-amber-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                hasActivity ? "bg-amber-500" : "bg-muted-foreground/30"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-amber-700 dark:text-amber-400 tabular-nums">
                            {weight.dynamicWeight.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {hasActivity
                            ? `${weight.timesSelected}× selected · ${weight.timesReferenced}× referenced`
                            : "not yet engaged"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* TOK Pathways Panel — live AOK heat map, Exhibition prompts, Essay KQ frames */}
        {(() => {
          if (spiralState.shuffledTerms.length === 0) return null;
          // Build termRatings: { term → { stageId → rating | null } } from all days in localStorage
          const termRatings: Record<string, Record<string, number | null>> = {};
          for (let day = 1; day <= totalDays; day++) {
            const key = `synthesisLog_reflections_day${day}`;
            const saved = localStorage.getItem(key);
            if (!saved) continue;
            let parsed: Record<string, unknown>;
            try { parsed = JSON.parse(saved); } catch { continue; }
            // Get the stage→term assignment for this day
            const stages = getStagesForDay(spiralState.shuffledTerms, day, spiralState.reflectionDepth);
            for (const [stageId, queuedTerm] of Object.entries(stages)) {
              if (!queuedTerm) continue;
              const term = queuedTerm.term;
              const rawVal = parsed[stageId];
              let rating: number | null = null;
              if (typeof rawVal === "number") {
                rating = rawVal > 0 ? rawVal : null;
              } else if (rawVal && typeof rawVal === "object" && "rating" in rawVal) {
                const r = (rawVal as { rating: number }).rating;
                rating = r > 0 ? r : null;
              }
              if (!termRatings[term]) termRatings[term] = {};
              // Keep the highest rating seen for this term+stage combination
              if (rating !== null) {
                const existing = termRatings[term][stageId];
                termRatings[term][stageId] = existing == null ? rating : Math.max(existing, rating);
              } else if (!(stageId in termRatings[term])) {
                termRatings[term][stageId] = null;
              }
            }
          }
          const hasData = Object.values(termRatings).some((stages) =>
            Object.values(stages).some((r) => r !== null && r > 0)
          );
          return <TOKPathwaysPanel termRatings={termRatings} hasData={hasData} />;
        })()}

        {/* Term Bank Manager */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Term Bank</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {spiralState.segments.map((seg, i) => (
                <div
                  key={seg.listId + i}
                  className="flex items-center gap-2 px-3 py-1 rounded-full text-sm"
                  style={{
                    backgroundColor: `oklch(0.92 0.05 ${seg.listHue})`,
                    color: `oklch(0.35 0.12 ${seg.listHue})`,
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: `oklch(0.55 0.15 ${seg.listHue})` }}
                  />
                  {seg.listName} ({seg.terms.length})
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <ListSelectorMulti
                onSelectLists={handleAddLists}
                isTransitionZone
              />
            </div>

            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                View all terms ({spiralState.shuffledTerms.length})
              </summary>
              <pre className="mt-2 p-3 bg-muted rounded-lg text-xs max-h-48 overflow-auto">
                {spiralState.shuffledTerms.map((t) => t.term).join("\n")}
              </pre>
            </details>
          </CardContent>
        </Card>
      </div>
      
      {/* Printable Worksheet Dialog */}
      <PrintableWorksheet
        open={printWorksheetOpen}
        onOpenChange={setPrintWorksheetOpen}
        currentDay={spiralState.currentDay}
        totalDays={totalDays}
        activeTermSet={activeTermSet}
        currentStages={currentStages}
        reflectionDepth={spiralState.reflectionDepth}
      />

      {/* PDF Report Type Picker Dialog */}
      <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export PDF Report</DialogTitle>
            <DialogDescription>
              Choose the report format that best fits your purpose.
            </DialogDescription>
          </DialogHeader>

          <RadioGroup
            value={pdfReportType}
            onValueChange={(v) => setPdfReportType(v as 'standard' | 'ib-tok')}
            className="space-y-3 py-2"
          >
            <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/40 cursor-pointer transition-colors">
              <RadioGroupItem value="standard" id="pdf-standard" className="mt-0.5" />
              <Label htmlFor="pdf-standard" className="cursor-pointer space-y-1">
                <span className="font-semibold block">Standard Report</span>
                <span className="text-sm text-muted-foreground block">
                  Full reflection log with daily entries, stage ratings, and motion proposals.
                </span>
              </Label>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/40 cursor-pointer transition-colors">
              <RadioGroupItem value="ib-tok" id="pdf-ib-tok" className="mt-0.5" />
              <Label htmlFor="pdf-ib-tok" className="cursor-pointer space-y-1">
                <span className="font-semibold block">IB TOK Report</span>
                <span className="text-sm text-muted-foreground block">
                  Includes all standard content plus an <strong>Assessment Pathways</strong> section:
                  AOK heat map, Exhibition object directions, and Essay KQ frames derived from your
                  highest-rated concepts.
                </span>
              </Label>
            </div>
          </RadioGroup>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPdfDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setPdfDialogOpen(false);
                doExportPDF(pdfReportType);
              }}
              disabled={exportPDF.isPending}
            >
              <FileText className="h-4 w-4 mr-2" />
              {exportPDF.isPending ? 'Generating…' : 'Export PDF'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
