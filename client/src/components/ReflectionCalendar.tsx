import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReflectionDay {
  day: number;
  date: string;
  hasReflection: boolean;
  lists: Array<{ name: string; hue: number }>;
  completionPercent: number;
  reflectionSummary?: string;
}

interface ReflectionCalendarProps {
  startDate: string | null;
  currentDay: number;
  segments: Array<{
    listId: string;
    listName: string;
    listHue: number;
    terms: string[];
  }>;
  onDayClick: (day: number) => void;
}

export function ReflectionCalendar({
  startDate,
  currentDay,
  segments,
  onDayClick,
}: ReflectionCalendarProps) {
  const [viewMonth, setViewMonth] = useState(() => {
    if (startDate) {
      const date = new Date(startDate);
      return { year: date.getFullYear(), month: date.getMonth() };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate which days have reflections
  const reflectionDays = useMemo(() => {
    if (!startDate) return [];

    const start = new Date(startDate);
    const days: ReflectionDay[] = [];

    // For each day in the spiral
    for (let dayIndex = 1; dayIndex <= currentDay; dayIndex++) {
      const date = new Date(start);
      date.setDate(start.getDate() + dayIndex - 1);

      // Check if this day has saved reflections
      const key = `synthesisLog_reflections_day${dayIndex}`;
      const saved = localStorage.getItem(key);
      let completionPercent = 0;
      let reflectionSummary = "";
      
      if (saved) {
        try {
          const reflections = JSON.parse(saved);
          const entries = Object.entries(reflections).filter(
            ([_, text]) => typeof text === "string" && (text as string).trim().length > 0
          );
          const filledStages = entries.length;
          const totalStages = Object.keys(reflections).length;
          completionPercent = totalStages > 0 ? (filledStages / totalStages) * 100 : 0;
          
          // Build summary: stage name + first 100 chars
          if (entries.length > 0) {
            reflectionSummary = entries
              .map(([stage, text]) => {
                const preview = (text as string).slice(0, 100);
                return `${stage}: ${preview}${(text as string).length > 100 ? "..." : ""}`;
              })
              .join("\n\n");
          }
        } catch (e) {
          // Invalid JSON, skip
        }
      }

      // Determine which lists are active on this day
      const activeLists: Array<{ name: string; hue: number }> = [];
      let termsSoFar = 0;
      for (const segment of segments) {
        if (dayIndex > termsSoFar && dayIndex <= termsSoFar + segment.terms.length) {
          activeLists.push({ name: segment.listName, hue: segment.listHue });
        }
        termsSoFar += segment.terms.length;
      }

      days.push({
        day: dayIndex,
        date: date.toISOString().slice(0, 10),
        hasReflection: completionPercent > 0,
        lists: activeLists,
        completionPercent,
        reflectionSummary: reflectionSummary || undefined,
      });
    }

    return days;
  }, [startDate, currentDay, segments]);

  // Get days for the current view month
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewMonth.year, viewMonth.month, 1);
    const lastDay = new Date(viewMonth.year, viewMonth.month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

    const days: Array<{
      date: number;
      dateString: string;
      isCurrentMonth: boolean;
      reflectionDay?: ReflectionDay;
    }> = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      const prevMonthDay = new Date(viewMonth.year, viewMonth.month, -i);
      days.unshift({
        date: prevMonthDay.getDate(),
        dateString: prevMonthDay.toISOString().slice(0, 10),
        isCurrentMonth: false,
      });
    }

    // Add days of the current month
    for (let date = 1; date <= daysInMonth; date++) {
      const dateString = new Date(viewMonth.year, viewMonth.month, date)
        .toISOString()
        .slice(0, 10);
      const reflectionDay = reflectionDays.find((rd) => rd.date === dateString);

      days.push({
        date,
        dateString,
        isCurrentMonth: true,
        reflectionDay,
      });
    }

    // Add empty cells to complete the last week
    const remainingCells = 42 - days.length; // 6 rows × 7 days
    for (let i = 1; i <= remainingCells; i++) {
      const nextMonthDay = new Date(viewMonth.year, viewMonth.month + 1, i);
      days.push({
        date: nextMonthDay.getDate(),
        dateString: nextMonthDay.toISOString().slice(0, 10),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [viewMonth, reflectionDays]);

  const monthName = new Date(viewMonth.year, viewMonth.month, 1).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" }
  );

  const goToPreviousMonth = () => {
    setViewMonth((prev) => {
      const newMonth = prev.month - 1;
      if (newMonth < 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: newMonth };
    });
  };

  const goToNextMonth = () => {
    setViewMonth((prev) => {
      const newMonth = prev.month + 1;
      if (newMonth > 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: newMonth };
    });
  };

  const goToToday = () => {
    if (startDate) {
      const start = new Date(startDate);
      const current = new Date(start);
      current.setDate(start.getDate() + currentDay - 1);
      setViewMonth({ year: current.getFullYear(), month: current.getMonth() });
    }
  };

  return (
    <Card>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          <h3 className="font-semibold">Reflection History</h3>
        </div>
        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[140px] text-center">
                {monthName}
              </span>
              <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <TooltipProvider>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const isToday =
                  day.dateString === new Date().toISOString().slice(0, 10);
                const hasReflection = day.reflectionDay?.hasReflection;

                const dayButton = (
                  <button
                    key={index}
                    onClick={() => {
                      if (day.reflectionDay) {
                        onDayClick(day.reflectionDay.day);
                      }
                    }}
                    disabled={!day.reflectionDay}
                    className={cn(
                      "aspect-square p-2 rounded-md text-sm relative",
                      "transition-colors",
                      day.isCurrentMonth
                        ? "text-foreground"
                        : "text-muted-foreground/50",
                      isToday && "ring-2 ring-primary",
                      hasReflection
                        ? "bg-primary/10 hover:bg-primary/20 cursor-pointer"
                        : day.reflectionDay
                        ? "bg-muted/50 hover:bg-muted cursor-pointer"
                        : "cursor-default",
                      !day.reflectionDay && "opacity-50"
                    )}
                  >
                    <span className="font-medium">{day.date}</span>

                    {/* Color-coded dots for active lists */}
                    {day.reflectionDay && day.reflectionDay.lists.length > 0 && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {day.reflectionDay.lists.slice(0, 3).map((list, i) => (
                          <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              backgroundColor: `oklch(0.55 0.15 ${list.hue})`,
                            }}
                            title={list.name}
                          />
                        ))}
                      </div>
                    )}

                    {/* Completion indicator */}
                    {day.reflectionDay && day.reflectionDay.completionPercent > 0 && (
                      <div
                        className="absolute top-1 right-1 w-2 h-2 rounded-full"
                        style={{
                          backgroundColor:
                            day.reflectionDay.completionPercent === 100
                              ? "oklch(0.6 0.15 145)"
                              : "oklch(0.6 0.15 60)",
                        }}
                        title={`${Math.round(day.reflectionDay.completionPercent)}% complete`}
                      />
                    )}
                  </button>
                );

                // Wrap in tooltip if there's a reflection summary
                if (day.reflectionDay?.reflectionSummary) {
                  return (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>{dayButton}</TooltipTrigger>
                      <TooltipContent className="max-w-sm whitespace-pre-wrap text-xs">
                        <div className="font-semibold mb-1">Day {day.reflectionDay.day}</div>
                        {day.reflectionDay.reflectionSummary}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return dayButton;
              })}
            </div>
          </TooltipProvider>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[oklch(0.6_0.15_145)]" />
              <span>Complete</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[oklch(0.6_0.15_60)]" />
              <span>Partial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-primary" />
              <span>Today</span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
