import type { ReflectionDepth } from "./reflectionDepth";
import { getStageConfig } from "./reflectionDepth";
import { getStagesForDay, type QueuedTerm } from "./spiralQueue";

export interface IcsExportInput {
  allTerms: QueuedTerm[];
  startDate: string;
  totalDays: number;
  reflectionDepth: ReflectionDepth;
  calendarName?: string;
  appId?: string;
}

const STAGE_PROMPTS: Record<string, (term: string, allTerms: string[]) => string> = {
  history: term => `HISTORY / CONTEXT — "${term}"\nTell the story of this term: where did it come from, who championed it, and what problem was it solving?`,
  foundation: term => `FOUNDATION — "${term}"\nConnect its historical background, observable facts, and theoretical frameworks.`,
  concrete: term => `CONCRETE — "${term}"\nWhat does it look like in action? Give a specific observable example and the abstract principle beneath it.`,
  abstract: term => `ABSTRACT — "${term}"\nWhat theoretical framework, principle, or underlying concept does it express?`,
  concrete_abstract: term => `CONCRETE / ABSTRACT — "${term}"\nWhat does it look like in action, and what abstract principle lies beneath it?`,
  analysis: term => `ANALYSIS — "${term}"\nWhat patterns, evidence, and theoretical frameworks help explain it?`,
  amalgam: (term, allTerms) => `AMALGAMATION — "${term}"\nHow does it connect, clash, or harmonize with ${allTerms.filter(other => other !== term).join(", ")}?`,
  synthesis: (term, allTerms) => `SYNTHESIS — "${term}"\nHow does it connect with today's other terms: ${allTerms.filter(other => other !== term).join(", ")}?`,
  motion: (term, allTerms) => `MOTION — "${term}"\nWhat project, experiment, or practice could bring ${[term, ...allTerms.filter(other => other !== term)].join(", ")} to life?`,
  application: (term, allTerms) => `APPLICATION — "${term}"\nWhat concrete action, project, or practice follows from its connections with ${allTerms.filter(other => other !== term).join(", ")}?`,
};

const pad = (value: number) => String(value).padStart(2, "0");

function localIcsDate(date: Date, hour: number, minute = 0): string {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(hour)}${pad(minute)}00`;
}

function escapeIcs(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function foldLine(line: string): string {
  const parts: string[] = [];
  let current = "";
  let currentBytes = 0;
  let limit = 75;

  for (const character of line) {
    const characterBytes = new TextEncoder().encode(character).length;
    if (current && currentBytes + characterBytes > limit) {
      parts.push(current);
      current = character;
      currentBytes = characterBytes;
      limit = 74;
    } else {
      current += character;
      currentBytes += characterBytes;
    }
  }
  if (current) parts.push(current);
  return parts.map((part, index) => (index === 0 ? part : ` ${part}`)).join("\r\n");
}

function promptFor(stageId: string, term: string, allTerms: string[]): string {
  return STAGE_PROMPTS[stageId]?.(term, allTerms) ?? `${stageId.toUpperCase()} — "${term}"\nReflect on this term in today's set: ${allTerms.join(", ")}.`;
}

function addEvent(lines: string[], input: {
  uid: string;
  start: Date;
  hour: number;
  summary: string;
  description: string;
}) {
  lines.push(
    "BEGIN:VEVENT",
    foldLine(`UID:${input.uid}`),
    foldLine(`DTSTART;TZID=America/Denver:${localIcsDate(input.start, input.hour)}`),
    foldLine(`DTEND;TZID=America/Denver:${localIcsDate(input.start, input.hour, 30)}`),
    foldLine(`SUMMARY:${escapeIcs(input.summary)}`),
    foldLine(`DESCRIPTION:${escapeIcs(input.description)}`),
    "STATUS:CONFIRMED",
    "TRANSP:TRANSPARENT",
    "END:VEVENT",
  );
}

/** Browser-safe RFC 5545 calendar generator used by the static proof of concept. */
export function generateIcsCalendar(input: IcsExportInput): string {
  const stageConfigs = getStageConfig(input.reflectionDepth);
  const start = new Date(`${input.startDate}T00:00:00`);
  const calendarName = input.calendarName ?? "Synthesis Log";
  const appId = input.appId ?? "synthlog";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Synthesis Log//Spiral Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    foldLine(`X-WR-CALNAME:${escapeIcs(calendarName)}`),
    "X-WR-TIMEZONE:America/Denver",
  ];

  const midpoint = Math.ceil(stageConfigs.length / 2);
  for (let dayIndex = 1; dayIndex <= input.totalDays; dayIndex += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + dayIndex - 1);
    const stages = getStagesForDay(input.allTerms, dayIndex, input.reflectionDepth);
    const activeTerms = stageConfigs
      .map(stage => stages[stage.id])
      .filter((term): term is QueuedTerm => term !== null)
      .map(term => term.term);

    if (activeTerms.length === 0) continue;
    const dayHeader = `Day ${dayIndex} of ${input.totalDays} · ${input.reflectionDepth}-Step Spiral\nToday's terms: ${activeTerms.join(" · ")}`;
    const collectPrompts = (configs: typeof stageConfigs) => configs
      .map(stage => {
        const term = stages[stage.id];
        return term ? promptFor(stage.id, term.term, activeTerms) : null;
      })
      .filter((prompt): prompt is string => Boolean(prompt));

    const morningPrompts = collectPrompts(stageConfigs.slice(0, midpoint));
    const eveningPrompts = collectPrompts(stageConfigs.slice(midpoint));
    const allPrompts = collectPrompts(stageConfigs);
    if (morningPrompts.length > 0) {
      addEvent(lines, {
        uid: `synthesis-log-day${dayIndex}-morning-${appId}@synthlog`,
        start: date,
        hour: 8,
        summary: `Synthesis Log Day ${dayIndex} — Morning Reflection`,
        description: `${dayHeader}\n\n${morningPrompts.join("\n\n")}`,
      });
    }
    const eveningContent = eveningPrompts.length > 0 ? eveningPrompts : allPrompts;
    if (eveningContent.length > 0) {
      addEvent(lines, {
        uid: `synthesis-log-day${dayIndex}-evening-${appId}@synthlog`,
        start: date,
        hour: 19,
        summary: `Synthesis Log Day ${dayIndex} — Evening Synthesis`,
        description: `${dayHeader}\n\n${eveningContent.join("\n\n")}`,
      });
    }
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
