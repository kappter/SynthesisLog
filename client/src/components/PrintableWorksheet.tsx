import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import type { QueuedTerm } from "@shared/spiralQueue";

interface PrintableWorksheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDay: number;
  totalDays: number;
  activeTermSet: QueuedTerm[];
  currentStages: Record<string, QueuedTerm | null>;
  reflectionDepth: number;
}

// Mini calendar component
function MiniCalendar() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const monthName = today.toLocaleString("default", { month: "long" });
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="w-5 h-5" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = day === today.getDate();
    days.push(
      <div
        key={day}
        className={`w-5 h-5 text-center text-[9px] leading-5 ${
          isToday ? "bg-black text-white rounded-full font-bold" : ""
        }`}
      >
        {day}
      </div>
    );
  }
  
  return (
    <div className="text-right">
      <div className="font-bold text-xs mb-0.5">{monthName} {year}</div>
      <div className="grid grid-cols-7 gap-0.5 text-[8px]">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="w-5 h-5 font-bold text-center">{d}</div>
        ))}
        {days}
      </div>
    </div>
  );
}

const STAGE_INFO: Record<string, { title: string; prompt: string }> = {
  history: {
    title: "History / Context",
    prompt: "Tell me a story about this term. Where did it come from, who championed it, and what problem was it solving? What surprised you most about its origins?",
  },
  context: {
    title: "History / Context",
    prompt: "Tell me a story about this term. Where did it come from, who championed it, and what problem was it solving? What surprised you most about its origins?",
  },
  concrete: {
    title: "Concrete",
    prompt: "Paint me a picture. What does this term look like in action? Give me a specific, observable example you could point to in the real world.",
  },
  abstract: {
    title: "Abstract",
    prompt: "Now zoom out. What is the underlying principle or theoretical framework? If you had to explain the big idea to someone who's never encountered this term, what metaphor or analogy would you use?",
  },
  concrete_abstract: {
    title: "Concrete / Abstract",
    prompt: "Paint me a picture. What does this term look like in action? Give me a specific example I could observe, then zoom out — what's the abstract principle underneath?",
  },
  analysis: {
    title: "Analysis",
    prompt: "Paint me a picture. What does this term look like in action? Give me a specific, observable example — then zoom out. What theoretical framework or underlying principle does it reveal?",
  },
  amalgamation: {
    title: "Amalgamation",
    prompt: "Imagine today's terms at a dinner table. What unexpected connections emerge? Where do they clash, where do they harmonize, and what new idea appears only when they're in the same room?",
  },
  amalgam: {
    title: "Amalgamation",
    prompt: "Imagine today's terms at a dinner table. What unexpected connections emerge? Where do they clash, where do they harmonize, and what new idea appears only when they're in the same room?",
  },
  synthesis: {
    title: "Synthesis",
    prompt: "What new understanding emerges when today's terms are placed in conversation with each other? Identify one tension and one surprising harmony between them.",
  },
  foundation: {
    title: "Foundation",
    prompt: "Tell me the story and the structure. Where did this term come from, who championed it, and what does it look like in action? Then zoom out — what's the abstract principle underneath?",
  },
  application: {
    title: "Application",
    prompt: "What new understanding emerges when today's terms are placed in conversation? Identify one tension, one harmony — then propose a concrete project, experiment, or practice that brings these ideas to life.",
  },
  motion: {
    title: "Motion",
    prompt: "If these terms were ingredients in a recipe, what would you create? Propose a concrete project, experiment, or practice that brings these concepts to life. Be specific — name the output, the audience, and the first step.",
  },
  action: {
    title: "Action",
    prompt: "What concrete action emerges from today's reflection? Name the output, the audience, and the single first step you could take before tomorrow.",
  },
};

export function PrintableWorksheet({
  open,
  onOpenChange,
  currentDay,
  totalDays,
  activeTermSet,
  currentStages,
}: PrintableWorksheetProps) {
  const handlePrint = () => {
    // Build the worksheet HTML as a self-contained string and print it
    // in a fresh popup window — the only approach that works reliably
    // across Chrome/Edge/Safari when the content lives inside a Radix portal.
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const monthName = today.toLocaleString("default", { month: "long" });
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayDate = today.getDate();

    // Build calendar cells
    let calCells = "";
    for (let i = 0; i < firstDay; i++) calCells += `<div></div>`;
    for (let d = 1; d <= daysInMonth; d++) {
      calCells += d === todayDate
        ? `<div style="background:#000;color:#fff;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:9px;margin:auto">${d}</div>`
        : `<div style="font-size:9px;text-align:center;line-height:18px">${d}</div>`;
    }

    // Build DNA strand SVG
    const dnaNodes = Array.from({ length: Math.min(totalDays, 18) }, (_, i) => ({
      day: i + 1,
      status: i + 1 < currentDay ? "completed" : i + 1 === currentDay ? "today" : "upcoming",
    }));
    const topPath = `M 30,18 ${dnaNodes.map((_, i) => `L ${50 + i * 38},${18 + (i % 2 === 0 ? 0 : 10)}`).join(" ")}`;
    const botPath = `M 30,32 ${dnaNodes.map((_, i) => `L ${50 + i * 38},${32 + (i % 2 === 0 ? 10 : 0)}`).join(" ")}`;
    const dnaConnectors = dnaNodes.map((_, i) =>
      `<line x1="${50 + i * 38}" y1="${18 + (i % 2 === 0 ? 0 : 10)}" x2="${50 + i * 38}" y2="${32 + (i % 2 === 0 ? 10 : 0)}" stroke="#ddd" stroke-width="1"/>`
    ).join("");
    const dnaCircles = dnaNodes.map((node, i) =>
      `<circle cx="${50 + i * 38}" cy="25" r="${node.status === 'today' ? 6 : 4}" fill="${node.status === 'completed' ? '#555' : node.status === 'today' ? '#000' : '#fff'}" stroke="${node.status === 'upcoming' ? '#999' : '#000'}" stroke-width="1"/>
       <text x="${50 + i * 38}" y="45" text-anchor="middle" font-size="9" font-weight="${node.status === 'today' ? 'bold' : 'normal'}" fill="#333">${node.day}</text>`
    ).join("");

    // Build term chips
    const termChips = activeTermSet.map(qt =>
      `<span style="padding:2px 8px;border:1px solid #555;border-radius:4px;font-size:11px;font-weight:500;margin:2px">${qt.term}</span>`
    ).join("");

    // Build stage boxes
    const activeStagesLocal = Object.entries(currentStages)
      .filter(([_, term]) => term !== null)
      .map(([stage, term]) => ({ stage, term: term! }));
    const stageBoxes = activeStagesLocal.map(({ stage, term }) => {
      const info = STAGE_INFO[stage.toLowerCase()] || { title: stage, prompt: "" };
      const lines = Array.from({ length: 5 }, () =>
        `<div style="border-bottom:1px solid #ccc;height:20px;margin-bottom:4px"></div>`
      ).join("");
      return `<div style="border:1px solid #aaa;border-radius:4px;padding:8px">
        <div style="font-weight:bold;font-size:11px;margin-bottom:4px">${info.title} – ${term.term}</div>
        <div style="font-size:9px;font-style:italic;color:#555;margin-bottom:8px;line-height:1.4">${info.prompt}</div>
        ${lines}
      </div>`;
    }).join("");

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Synthesis Log – Day ${currentDay}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, serif; background: white; color: black; }
  @page { size: 8.5in 11in; margin: 0; }
  .page { width: 8.5in; min-height: 11in; padding: 0.4in; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
  .cal-grid { display: grid; grid-template-columns: repeat(7, 20px); gap: 2px; }
  .dna-section { border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; padding: 8px 0; margin-bottom: 12px; text-align: center; }
  .terms-section { margin-bottom: 12px; }
  .stages-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  @media print {
    html, body { margin: 0; padding: 0; }
    .page { padding: 0.4in; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <h1 style="font-size:28px;font-weight:bold;margin-bottom:2px">Synthesis Log</h1>
      <p style="font-size:12px;color:#555">Day ${currentDay} of ${totalDays}</p>
      <div style="margin-top:6px;font-size:12px">Date: <span style="border-bottom:1px solid #aaa;display:inline-block;width:160px">&nbsp;</span></div>
    </div>
    <div style="text-align:right">
      <div style="font-weight:bold;font-size:11px;margin-bottom:2px">${monthName} ${year}</div>
      <div style="display:grid;grid-template-columns:repeat(7,20px);gap:2px;font-size:9px">
        ${["S","M","T","W","T","F","S"].map(d => `<div style="text-align:center;font-weight:bold;line-height:18px">${d}</div>`).join("")}
        ${calCells}
      </div>
    </div>
  </div>

  <div class="dna-section">
    <div style="font-size:10px;font-weight:bold;margin-bottom:6px">Spiral Progress</div>
    <svg width="100%" height="55" overflow="visible">
      <path d="${topPath}" fill="none" stroke="#ccc" stroke-width="1.5"/>
      <path d="${botPath}" fill="none" stroke="#ccc" stroke-width="1.5"/>
      ${dnaConnectors}
      ${dnaCircles}
    </svg>
    <div style="font-size:9px;color:#666;margin-top:2px">● Completed &nbsp; ○ Upcoming &nbsp; ⦿ Today</div>
  </div>

  <div class="terms-section">
    <div style="font-size:12px;font-weight:bold;margin-bottom:6px">Today's ${activeTermSet.length}-term set:</div>
    <div style="display:flex;flex-wrap:wrap;gap:4px">${termChips}</div>
  </div>

  <div class="stages-grid">${stageBoxes}</div>
</div>
<script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };<\/script>
</body>
</html>`;

    const win = window.open("", "_blank", "width=900,height=700");
    if (win) {
      win.document.write(html);
      win.document.close();
    } else {
      alert("Please allow pop-ups for this site to enable printing.");
    }
  };

  // Generate DNA strand data
  const dnaNodes = Array.from({ length: Math.min(totalDays, 18) }, (_, i) => ({
    day: i + 1,
    status: i + 1 < currentDay ? "completed" : i + 1 === currentDay ? "today" : "upcoming",
  }));

  // Get active stages
  const activeStages = Object.entries(currentStages)
    .filter(([_, term]) => term !== null)
    .map(([stage, term]) => ({ stage, term: term! }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto print:max-w-full print:max-h-full print:overflow-visible">
        <DialogHeader className="print:hidden">
          <DialogTitle>Print Today's Worksheet</DialogTitle>
        </DialogHeader>

        <div className="print:hidden mb-4 text-sm text-gray-600">
          Preview of 8.5" × 11" worksheet (scale down for planner sizes)
        </div>

        {/* Printable content */}
        <div 
          className="worksheet-page bg-white text-black border print:border-0"
          style={{ 
            width: "8.5in", 
            minHeight: "11in", 
            margin: "0 auto", 
            padding: "0.4in",
            fontFamily: "Georgia, serif"
          }}
        >
          {/* Header with title, date, and calendar */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-0.5">Synthesis Log</h1>
              <p className="text-sm text-gray-700">Day {currentDay} of {totalDays}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-sm font-medium">Date:</span>
                <span className="border-b border-gray-400 inline-block w-40"></span>
              </div>
            </div>
            <div className="flex-shrink-0 ml-4">
              <MiniCalendar />
            </div>
          </div>

          {/* DNA Strand Progress */}
          <div className="mb-3 border-y border-gray-300 py-2">
            <div className="text-center text-xs font-bold mb-1.5">Spiral Progress</div>
            <svg width="100%" height="50" className="overflow-visible">
              {/* Strand paths */}
              <path
                d={`M 30,18 ${dnaNodes.map((_, i) => `L ${50 + i * 38},${18 + (i % 2 === 0 ? 0 : 10)}`).join(" ")}`}
                fill="none"
                stroke="#ccc"
                strokeWidth="1.5"
              />
              <path
                d={`M 30,32 ${dnaNodes.map((_, i) => `L ${50 + i * 38},${32 + (i % 2 === 0 ? 10 : 0)}`).join(" ")}`}
                fill="none"
                stroke="#ccc"
                strokeWidth="1.5"
              />
              
              {/* Connecting lines */}
              {dnaNodes.map((_, i) => (
                <line
                  key={`connect-${i}`}
                  x1={50 + i * 38}
                  y1={18 + (i % 2 === 0 ? 0 : 10)}
                  x2={50 + i * 38}
                  y2={32 + (i % 2 === 0 ? 10 : 0)}
                  stroke="#ddd"
                  strokeWidth="1"
                />
              ))}
              
              {/* Day nodes */}
              {dnaNodes.map((node, i) => (
                <g key={node.day}>
                  <circle
                    cx={50 + i * 38}
                    cy={25}
                    r={node.status === "today" ? 6 : 4}
                    fill={node.status === "completed" ? "#555" : node.status === "today" ? "#000" : "#fff"}
                    stroke={node.status === "upcoming" ? "#999" : "#000"}
                    strokeWidth="1"
                  />
                  <text
                    x={50 + i * 38}
                    y={45}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight={node.status === "today" ? "bold" : "normal"}
                    fill="#333"
                  >
                    {node.day}
                  </text>
                </g>
              ))}
            </svg>
            <div className="text-center text-[10px] mt-0.5 text-gray-600">
              <span className="mr-4">● Completed</span>
              <span className="mr-4">○ Upcoming</span>
              <span>⦿ Today</span>
            </div>
          </div>

          {/* Today's terms */}
          <div className="mb-3">
            <div className="text-sm font-bold mb-1.5">Today's {activeTermSet.length}-term set:</div>
            <div className="flex flex-wrap gap-1.5">
              {activeTermSet.map((qt) => (
                <span
                  key={qt.term}
                  className="px-2 py-0.5 border border-gray-500 rounded text-xs font-medium"
                >
                  {qt.term}
                </span>
              ))}
            </div>
          </div>

          {/* Reflection stages - 2x2 grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {activeStages.map(({ stage, term }) => {
              const info = STAGE_INFO[stage.toLowerCase()] || { title: stage, prompt: "" };
              return (
                <div key={stage} className="border border-gray-400 rounded p-2">
                  <div className="font-bold text-[11px] mb-1">
                    {info.title} – {term.term}
                  </div>
                  <div className="text-[9px] italic text-gray-700 mb-1.5 leading-tight">
                    {info.prompt}
                  </div>
                  {/* Lined writing space */}
                  <div className="space-y-1.5">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="border-b border-gray-300 h-3"></div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2 mt-4 print:hidden">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>

        {/* Printing is handled by opening a self-contained popup window — no print CSS needed here */}
      </DialogContent>
    </Dialog>
  );
}
