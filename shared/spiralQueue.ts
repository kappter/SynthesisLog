/**
 * Spiral Queue Logic for Perpetual Term Rotation with Variable Depth
 *
 * Supports 2, 3, 4, and 5-step reflection models with different rotation speeds.
 * Blended mode is "Adaptive" — concepts gain weight and influence future selection.
 */

import type { ReflectionDepth } from "./reflectionDepth";
import { getRampUpDays, getStageConfig } from "./reflectionDepth";

export interface QueuedTerm {
  term: string;
  listId: string;
  listHue: number;
  originalIndex: number; // Position in original list
}

export interface SpiralSegment {
  listId: string;
  listName: string;
  listHue: number;
  startDay: number;
  endDay: number;
  termCount: number;
}

export interface DayState {
  dayIndex: number;
  queue: QueuedTerm[]; // Current term window (size varies by depth)
  stages: Record<string, QueuedTerm | null>; // Dynamic stages based on depth
  isTransitionZone: boolean; // True when approaching current list ending
  currentListId: string;
  currentListHue: number;
}

/**
 * Lightweight adaptive weight metadata for a single concept.
 * Used exclusively in Blended/Adaptive mode.
 */
export interface ConceptWeight {
  dynamicWeight: number;    // Current accumulated weight (starts at 1)
  timesSelected: number;    // How many times this term was placed in the queue
  timesReferenced: number;  // How many times it was mentioned in other reflections
  lastSeenCycle: number;    // Cycle index when last selected (for decay reference)
  manualBoost: boolean;     // Whether the user manually pinned/boosted this term
}

export type ConceptWeightMap = Record<string, ConceptWeight>; // keyed by term string

/**
 * Create a default ConceptWeight entry for a new term.
 */
export function defaultConceptWeight(): ConceptWeight {
  return {
    dynamicWeight: 1,
    timesSelected: 0,
    timesReferenced: 0,
    lastSeenCycle: 0,
    manualBoost: false,
  };
}

/**
 * Apply per-cycle decay to all concept weights (multiply by 0.92).
 * Call this once per cycle advance in Adaptive/Blended mode.
 */
export function applyWeightDecay(weights: ConceptWeightMap): ConceptWeightMap {
  const decayed: ConceptWeightMap = {};
  for (const [term, w] of Object.entries(weights)) {
    decayed[term] = { ...w, dynamicWeight: Math.max(0.1, w.dynamicWeight * 0.92) };
  }
  return decayed;
}

/**
 * Increment weight for a term that was selected into the queue (+1).
 */
export function recordTermSelected(
  weights: ConceptWeightMap,
  term: string,
  cycle: number
): ConceptWeightMap {
  const existing = weights[term] ?? defaultConceptWeight();
  return {
    ...weights,
    [term]: {
      ...existing,
      dynamicWeight: existing.dynamicWeight + 1,
      timesSelected: existing.timesSelected + 1,
      lastSeenCycle: cycle,
    },
  };
}

/**
 * Increment weight for a term that received a high rating (≥7) (+2).
 */
export function recordHighRating(
  weights: ConceptWeightMap,
  term: string
): ConceptWeightMap {
  const existing = weights[term] ?? defaultConceptWeight();
  return {
    ...weights,
    [term]: { ...existing, dynamicWeight: existing.dynamicWeight + 2 },
  };
}

/**
 * Increment weight for a term that was manually referenced in a reflection (+3).
 */
export function recordManualReference(
  weights: ConceptWeightMap,
  term: string
): ConceptWeightMap {
  const existing = weights[term] ?? defaultConceptWeight();
  return {
    ...weights,
    [term]: {
      ...existing,
      dynamicWeight: existing.dynamicWeight + 3,
      timesReferenced: existing.timesReferenced + 1,
    },
  };
}

/**
 * Return the top N terms by dynamicWeight, descending.
 */
export function getTopWeightedTerms(
  weights: ConceptWeightMap,
  n: number = 3
): Array<{ term: string; weight: ConceptWeight }> {
  return Object.entries(weights)
    .map(([term, weight]) => ({ term, weight }))
    .sort((a, b) => b.weight.dynamicWeight - a.weight.dynamicWeight)
    .slice(0, n);
}

/**
 * Detect which terms from the known term list are mentioned in a reflection text.
 * Returns the list of matching terms (case-insensitive whole-word match).
 */
export function detectReferencedTerms(text: string, knownTerms: string[]): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  return knownTerms.filter((t) => {
    const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(lower);
  });
}

// ---------------------------------------------------------------------------
// Core queue functions
// ---------------------------------------------------------------------------

/**
 * Calculate which terms are active for a given day
 * Terms enter at the first stage and progress through all stages based on depth
 */
export function getQueueForDay(
  allTerms: QueuedTerm[],
  dayIndex: number,
  depth: ReflectionDepth = 4
): QueuedTerm[] {
  const queue: QueuedTerm[] = [];
  const windowSize = depth; // Number of terms in rotation window

  for (let i = 0; i < allTerms.length; i++) {
    const termStartDay = i + 1; // Day when this term enters at first stage
    const termEndDay = i + depth; // Day when this term exits after final stage

    if (dayIndex >= termStartDay && dayIndex <= termEndDay) {
      queue.push(allTerms[i]);
    }
  }

  // Keep only the last N terms where N = depth
  if (queue.length > windowSize) {
    return queue.slice(queue.length - windowSize);
  }

  return queue;
}

/**
 * Get the stage assignments for a given day
 * Each term's stage position is determined by how many days it has been in the queue.
 * Term entry day = its 1-based index in allTerms (term[0] enters day 1, term[1] enters day 2, etc.)
 * Stage position = dayIndex - termEntryDay  (0 = newest/Context, depth-1 = oldest/Action)
 */
export function getStagesForDay(
  allTerms: QueuedTerm[],
  dayIndex: number,
  depth: ReflectionDepth = 4
): Record<string, QueuedTerm | null> {
  const stageConfigs = getStageConfig(depth);
  const stages: Record<string, QueuedTerm | null> = {};

  // Initialise all stages to null
  for (const cfg of stageConfigs) {
    stages[cfg.id] = null;
  }

  // For each term, compute which stage it occupies today based on days elapsed
  for (let i = 0; i < allTerms.length; i++) {
    const termEntryDay = i + 1; // Day when this term first appears (1-indexed)
    const stageIndex = dayIndex - termEntryDay; // 0 = Context, 1 = Analysis, etc.

    // Only active if stageIndex is within [0, depth-1]
    if (stageIndex >= 0 && stageIndex < depth) {
      const stageId = stageConfigs[stageIndex].id;
      stages[stageId] = allTerms[i];
    }
  }

  return stages;
}

/**
 * Calculate total days for a term list at a given depth
 * N terms = N + (depth - 1) days for wind-down
 */
export function getTotalDays(termCount: number, depth: ReflectionDepth = 4): number {
  return termCount + getRampUpDays(depth);
}

/**
 * Check if we're in the transition zone (depth-1 days before list ends)
 */
export function isInTransitionZone(
  dayIndex: number,
  currentListTermCount: number,
  currentListStartDay: number,
  depth: ReflectionDepth = 4
): boolean {
  const windDownDays = getRampUpDays(depth);
  const listEndDay = currentListStartDay + currentListTermCount + windDownDays - 1;
  const daysUntilEnd = listEndDay - dayIndex;
  return daysUntilEnd <= windDownDays - 1 && daysUntilEnd >= 0;
}

/**
 * Build the full term queue from multiple lists for the spiral.
 *
 * @param segments - Array of term lists
 * @param mode - How to combine the lists: sequential, shuffled, or blended (adaptive)
 * @param weights - Optional concept weight map (used only in blended/adaptive mode)
 */
export function buildSpiralQueue(
  segments: Array<{
    listId: string;
    listName: string;
    listHue: number;
    terms: string[];
  }>,
  mode: "sequential" | "shuffled" | "blended" = "shuffled",
  weights?: ConceptWeightMap
): QueuedTerm[] {
  const queue: QueuedTerm[] = [];

  if (mode === "blended") {
    // Collect all terms from all lists
    const allTerms: QueuedTerm[] = [];
    for (const segment of segments) {
      for (let i = 0; i < segment.terms.length; i++) {
        allTerms.push({
          term: segment.terms[i],
          listId: segment.listId,
          listHue: segment.listHue,
          originalIndex: i,
        });
      }
    }

    if (weights && Object.keys(weights).length > 0) {
      // Adaptive selection: 70% random order, 30% weighted recurrence
      return adaptiveBlend(allTerms, weights);
    }

    // No weights yet — fall back to pure shuffle (first run)
    return shuffleArray(allTerms);
  }

  // For sequential and shuffled modes, process each list separately
  for (const segment of segments) {
    const terms = mode === "shuffled" ? shuffleArray(segment.terms) : segment.terms;

    for (let i = 0; i < terms.length; i++) {
      queue.push({
        term: terms[i],
        listId: segment.listId,
        listHue: segment.listHue,
        originalIndex: i,
      });
    }
  }

  return queue;
}

/**
 * Adaptive blend: 70% random positions, 30% weighted-priority positions.
 *
 * Strategy:
 * - Split the output slots into "random" (70%) and "weighted" (30%) buckets.
 * - Fill weighted slots with the highest-weight terms first.
 * - Fill remaining slots with the rest in random order.
 * - Interleave both buckets so weighted terms are spread across the queue.
 */
function adaptiveBlend(
  allTerms: QueuedTerm[],
  weights: ConceptWeightMap
): QueuedTerm[] {
  const total = allTerms.length;
  const weightedCount = Math.max(1, Math.round(total * 0.3));

  // Sort by weight descending to identify high-priority terms
  const sorted = [...allTerms].sort((a, b) => {
    const wa = weights[a.term]?.dynamicWeight ?? 1;
    const wb = weights[b.term]?.dynamicWeight ?? 1;
    return wb - wa;
  });

  const weighted = sorted.slice(0, weightedCount);
  const rest = shuffleArray(sorted.slice(weightedCount));

  // Interleave: place one weighted term every ~3 positions
  const result: QueuedTerm[] = [];
  let wi = 0;
  let ri = 0;
  for (let i = 0; i < total; i++) {
    // Every 3rd slot (0-indexed: 2, 5, 8 …) gets a weighted term if available
    if ((i + 1) % 3 === 0 && wi < weighted.length) {
      result.push(weighted[wi++]);
    } else if (ri < rest.length) {
      result.push(rest[ri++]);
    } else if (wi < weighted.length) {
      result.push(weighted[wi++]);
    }
  }

  return result;
}

/**
 * Calculate segment boundaries for the progress bar
 */
export function calculateSegments(
  segments: Array<{
    listId: string;
    listName: string;
    listHue: number;
    terms: string[];
  }>
): SpiralSegment[] {
  const result: SpiralSegment[] = [];
  let currentDay = 1;

  for (const segment of segments) {
    const termCount = segment.terms.length;
    result.push({
      listId: segment.listId,
      listName: segment.listName,
      listHue: segment.listHue,
      startDay: currentDay,
      endDay: currentDay + termCount - 1, // Last day a new term enters
      termCount,
    });
    currentDay += termCount;
  }

  return result;
}

/**
 * Get the current segment for a given day
 */
export function getCurrentSegment(
  segments: SpiralSegment[],
  dayIndex: number
): SpiralSegment | null {
  // Find which segment this day belongs to
  for (let i = segments.length - 1; i >= 0; i--) {
    if (dayIndex >= segments[i].startDay) {
      return segments[i];
    }
  }
  return segments[0] || null;
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
