/**
 * ICS Calendar Export for Synthesis Log
 * Generates RFC 5545 compliant .ics files compatible with Google Calendar,
 * Apple Calendar, and Outlook.
 *
 * Each day produces TWO calendar events:
 *   Morning (8:00 AM) — first half of active stages (History / Context / Foundation)
 *   Evening (7:00 PM) — second half of active stages (Amalgamation / Motion / Application)
 *
 * Every event description contains the full reflection prompt for each active stage,
 * including the specific term name assigned to that stage on that day.
 */

import type { ReflectionDepth } from "../shared/reflectionDepth";
import { getStageConfig } from "../shared/reflectionDepth";
import { getStagesForDay, getTotalDays } from "../shared/spiralQueue";
import type { QueuedTerm } from "../shared/spiralQueue";

// ─── Stage prompt library ───────────────────────────────────────────────────

const STAGE_PROMPTS: Record<string, (term: string, allTerms: string[]) => string> = {
  history: (term) =>
    `HISTORY / CONTEXT — "${term}"\n` +
    `Tell me a story about this term. Where did it come from, who championed it,\n` +
    `and what problem was it solving? What surprised you most about its origins?\n\n` +
    `Reflection space:\n` +
    `_______________________________________________\n` +
    `_______________________________________________\n` +
    `_______________________________________________`,

  foundation: (term) =>
    `FOUNDATION — "${term}"\n` +
    `Combine historical background with observable facts and theoretical frameworks.\n` +
    `Where did this term originate? What does it look like in practice? What principles underlie it?\n\n` +
    `Reflection space:\n` +
    `_______________________________________________\n` +
    `_______________________________________________\n` +
    `_______________________________________________`,

  concrete: (term) =>
    `CONCRETE — "${term}"\n` +
    `Paint me a picture. What does "${term}" look like in action?\n` +
    `Give me a specific example I could observe, then zoom out — what abstract principle is underneath?\n\n` +
    `Reflection space:\n` +
    `_______________________________________________\n` +
    `_______________________________________________\n` +
    `_______________________________________________`,

  abstract: (term) =>
    `ABSTRACT — "${term}"\n` +
    `What theoretical frameworks, principles, or underlying concepts does "${term}" express?\n` +
    `What would a mathematician, philosopher, or systems thinker say about it?\n\n` +
    `Reflection space:\n` +
    `_______________________________________________\n` +
    `_______________________________________________\n` +
    `_______________________________________________`,

  concrete_abstract: (term) =>
    `CONCRETE / ABSTRACT — "${term}"\n` +
    `Paint me a picture: What does "${term}" look like in action? Give me a specific example\n` +
    `I could observe, then zoom out — what's the abstract principle underneath?\n\n` +
    `Reflection space:\n` +
    `_______________________________________________\n` +
    `_______________________________________________\n` +
    `_______________________________________________`,

  analysis: (term) =>
    `ANALYSIS — "${term}"\n` +
    `What are the observable facts, patterns, and empirical data around "${term}"?\n` +
    `What theoretical frameworks help explain it? What would a scientist and a philosopher each say?\n\n` +
    `Reflection space:\n` +
    `_______________________________________________\n` +
    `_______________________________________________\n` +
    `_______________________________________________`,

  amalgam: (term, allTerms) =>
    `AMALGAMATION — "${term}"\n` +
    `Imagine "${term}" having a conversation with: ${allTerms.filter(t => t !== term).join(", ")}.\n` +
    `Where do they clash? Where do they harmonize? What unexpected connection emerges?\n\n` +
    `Reflection space:\n` +
    `_______________________________________________\n` +
    `_______________________________________________\n` +
    `_______________________________________________`,

  synthesis: (term, allTerms) =>
    `SYNTHESIS — "${term}"\n` +
    `How does "${term}" connect with today's other terms: ${allTerms.filter(t => t !== term).join(", ")}?\n` +
    `Propose a concrete project, experiment, or practice that brings these concepts to life.\n\n` +
    `Reflection space:\n` +
    `_______________________________________________\n` +
    `_______________________________________________\n` +
    `_______________________________________________`,

  motion: (term, allTerms) =>
    `MOTION — "${term}"\n` +
    `If ${allTerms.join(", ")} were ingredients in a recipe, what would you create?\n` +
    `Propose a concrete project, experiment, or practice that brings these concepts to life.\n\n` +
    `Reflection space:\n` +
    `_______________________________________________\n` +
    `_______________________________________________\n` +
    `_______________________________________________`,

  application: (term, allTerms) =>
    `APPLICATION — "${term}"\n` +
    `Synthesize connections with today's other terms (${allTerms.filter(t => t !== term).join(", ")})\n` +
    `and propose a concrete action. What will you do, make, or practice because of today's reflection?\n\n` +
    `Reflection space:\n` +
    `_______________________________________________\n` +
    `_______________________________________________\n` +
    `_______________________________________________`,
};

function getPromptForStage(stageId: string, term: string, allTerms: string[]): string {
  const fn = STAGE_PROMPTS[stageId];
  if (fn) return fn(term, allTerms);
  // Fallback for unknown stage ids
  return `${stageId.toUpperCase()} — "${term}"\nReflect on this term in the context of today's set: ${allTerms.join(", ")}\n\n_______________________________________________\n_______________________________________________`;
}

// ─── ICS helpers ────────────────────────────────────────────────────────────

function icsDate(date: Date, timeHour: number): string {
  const d = new Date(date);
  d.setHours(timeHour, 0, 0, 0);
  // Format as local time with TZID rather than UTC Z suffix so Google Calendar
  // respects the user's local time zone when they import.
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

function icsDateEnd(date: Date, timeHour: number, durationMinutes: number): string {
  const d = new Date(date);
  d.setHours(timeHour, durationMinutes, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

/** Fold long lines per RFC 5545 (max 75 octets, continuation with CRLF + space) */
function foldLine(line: string): string {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let start = 0;
  while (start < bytes.length) {
    const chunk = bytes.slice(start, start + (start === 0 ? 75 : 74));
    parts.push(chunk.toString("utf8"));
    start += start === 0 ? 75 : 74;
  }
  return parts.join("\r\n ");
}

/** Escape special characters in ICS text values */
function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}

function uid(day: number, session: "morning" | "evening", appId: string): string {
  return `synthesis-log-day${day}-${session}-${appId}@synthlog`;
}

// ─── Main export function ────────────────────────────────────────────────────

export interface IcsExportInput {
  allTerms: QueuedTerm[];
  startDate: string;          // ISO date string e.g. "2026-04-05"
  totalDays: number;
  reflectionDepth: ReflectionDepth;
  calendarName?: string;
  appId?: string;             // Used for UID uniqueness
}

export function generateIcsCalendar(input: IcsExportInput): string {
  const {
    allTerms,
    startDate,
    totalDays,
    reflectionDepth,
    calendarName = "Synthesis Log",
    appId = "synthlog",
  } = input;

  const stageConfigs = getStageConfig(reflectionDepth);
  const start = new Date(startDate + "T00:00:00");

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//Synthesis Log//Spiral Calendar//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcs(calendarName)}`,
    "X-WR-TIMEZONE:America/Denver",
    "X-APPLE-CALENDAR-COLOR:#B08060",
  ];

  // Split stages into morning (first half) and evening (second half)
  const midpoint = Math.ceil(stageConfigs.length / 2);
  const morningStages = stageConfigs.slice(0, midpoint);
  const eveningStages = stageConfigs.slice(midpoint);

  for (let dayIndex = 1; dayIndex <= totalDays; dayIndex++) {
    const dayDate = new Date(start);
    dayDate.setDate(start.getDate() + dayIndex - 1);

    const stages = getStagesForDay(allTerms, dayIndex, reflectionDepth);

    // Collect active terms for this day (non-null stages)
    const activeTermNames = stageConfigs
      .map(sc => stages[sc.id])
      .filter((qt): qt is QueuedTerm => qt !== null)
      .map(qt => qt.term);

    if (activeTermNames.length === 0) continue;

    const termSetLabel = activeTermNames.join(" · ");

    // ── Morning event ────────────────────────────────────────────────────
    const morningPrompts: string[] = [];
    for (const sc of morningStages) {
      const qt = stages[sc.id];
      if (!qt) continue;
      morningPrompts.push(getPromptForStage(sc.id, qt.term, activeTermNames));
    }

    if (morningPrompts.length > 0) {
      const morningTitle = `🌅 Synthesis Log Day ${dayIndex} — Morning Reflection`;
      const morningDesc =
        `Day ${dayIndex} of ${totalDays} · ${reflectionDepth}-Step Spiral\n` +
        `Today's terms: ${termSetLabel}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        morningPrompts.join("\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n");

      lines.push(
        "BEGIN:VEVENT",
        foldLine(`UID:${uid(dayIndex, "morning", appId)}`),
        foldLine(`DTSTART;TZID=America/Denver:${icsDate(dayDate, 8)}`),
        foldLine(`DTEND;TZID=America/Denver:${icsDateEnd(dayDate, 8, 30)}`),
        foldLine(`SUMMARY:${escapeIcs(morningTitle)}`),
        foldLine(`DESCRIPTION:${escapeIcs(morningDesc)}`),
        "STATUS:CONFIRMED",
        "TRANSP:TRANSPARENT",
        "BEGIN:VALARM",
        "TRIGGER:-PT5M",
        "ACTION:DISPLAY",
        foldLine(`DESCRIPTION:${escapeIcs(`Morning reflection: ${termSetLabel}`)}`),
        "END:VALARM",
        "END:VEVENT",
      );
    }

    // ── Evening event ────────────────────────────────────────────────────
    const eveningPrompts: string[] = [];
    for (const sc of eveningStages) {
      const qt = stages[sc.id];
      if (!qt) continue;
      eveningPrompts.push(getPromptForStage(sc.id, qt.term, activeTermNames));
    }

    // On early days when only 1 stage is active, the evening event still
    // carries the full set of active prompts so nothing is lost.
    const allActivePrompts: string[] = [];
    for (const sc of stageConfigs) {
      const qt = stages[sc.id];
      if (!qt) continue;
      allActivePrompts.push(getPromptForStage(sc.id, qt.term, activeTermNames));
    }

    const finalEveningPrompts = eveningPrompts.length > 0 ? eveningPrompts : allActivePrompts;

    if (finalEveningPrompts.length > 0) {
      const eveningTitle = `🌙 Synthesis Log Day ${dayIndex} — Evening Synthesis`;
      const eveningDesc =
        `Day ${dayIndex} of ${totalDays} · ${reflectionDepth}-Step Spiral\n` +
        `Today's terms: ${termSetLabel}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        finalEveningPrompts.join("\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n");

      lines.push(
        "BEGIN:VEVENT",
        foldLine(`UID:${uid(dayIndex, "evening", appId)}`),
        foldLine(`DTSTART;TZID=America/Denver:${icsDate(dayDate, 19)}`),
        foldLine(`DTEND;TZID=America/Denver:${icsDateEnd(dayDate, 19, 30)}`),
        foldLine(`SUMMARY:${escapeIcs(eveningTitle)}`),
        foldLine(`DESCRIPTION:${escapeIcs(eveningDesc)}`),
        "STATUS:CONFIRMED",
        "TRANSP:TRANSPARENT",
        "BEGIN:VALARM",
        "TRIGGER:-PT5M",
        "ACTION:DISPLAY",
        foldLine(`DESCRIPTION:${escapeIcs(`Evening synthesis: ${termSetLabel}`)}`),
        "END:VALARM",
        "END:VEVENT",
      );
    }
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
