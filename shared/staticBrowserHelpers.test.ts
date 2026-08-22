import { describe, expect, it } from "vitest";
import { getGoogleSheetCsvUrl, parseTermCsv } from "./googleSheetsClient";
import { generateIcsCalendar } from "./icsCalendar";
import type { QueuedTerm } from "./spiralQueue";

const terms: QueuedTerm[] = [
  { term: "Bias", listId: "tok", listHue: 30, originalIndex: 0 },
  { term: "Evidence", listId: "tok", listHue: 30, originalIndex: 1 },
  { term: "Truth", listId: "tok", listHue: 30, originalIndex: 2 },
  { term: "Reason", listId: "tok", listHue: 30, originalIndex: 3 },
];

describe("browser-only static helpers", () => {
  it("creates a standards-shaped ICS calendar without Node Buffer", () => {
    const calendar = generateIcsCalendar({
      allTerms: terms,
      startDate: "2026-08-21",
      totalDays: 4,
      reflectionDepth: 4,
      calendarName: "TOK Static Test",
      appId: "test",
    });

    expect(calendar).toContain("BEGIN:VCALENDAR");
    expect(calendar).toContain("END:VCALENDAR");
    expect(calendar).toContain("X-WR-CALNAME:TOK Static Test");
    expect(calendar).toContain("UID:synthesis-log-day1-morning-test@synthlog");
    expect(calendar).toContain("Synthesis Log Day 1");
  });

  it.each([2, 3, 4, 5] as const)("creates browser-safe calendar events for the %s-step model", (reflectionDepth) => {
    const calendar = generateIcsCalendar({
      allTerms: terms,
      startDate: "2026-08-21",
      totalDays: 4,
      reflectionDepth,
    });

    expect(calendar).toContain("BEGIN:VEVENT");
    expect(calendar).toContain("END:VEVENT");
    expect(calendar).toContain("END:VCALENDAR");
  });

  it("derives a Google Sheets CSV export URL and parses one-column CSV terms", () => {
    expect(getGoogleSheetCsvUrl("https://docs.google.com/spreadsheets/d/abc123/edit#gid=42"))
      .toBe("https://docs.google.com/spreadsheets/d/abc123/export?format=csv&gid=42");
    expect(parseTermCsv("term\nBias\nEvidence\nTruth\n")).toEqual(["Bias", "Evidence", "Truth"]);
    expect(() => parseTermCsv("term\n")).toThrow("at least one term");
  });
});
