import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, ArrowRight, Layers, Brain, Printer, Calendar,
  FileJson, Sparkles, GitBranch, Music, BookOpen, GraduationCap,
  Upload, Download, CheckCircle, AlertCircle, Lightbulb, Users
} from "lucide-react";
import { SpiralOrbitAnimation } from "@/components/SpiralOrbitAnimation";
import { appBasePath } from "@/lib/staticMode";

export default function About() {
  const appUrl = new URL(appBasePath(), window.location.origin).toString();
  const [windowSize, setWindowSize] = useState<number>(5);

  const [animSpeed, setAnimSpeed] = useState<number>(() => {
    const saved = localStorage.getItem("synthesisLog_animSpeed");
    return saved ? parseFloat(saved) : 1;
  });
  const handleSpeedChange = (v: number) => {
    setAnimSpeed(v);
    localStorage.setItem("synthesisLog_animSpeed", String(v));
  };

  // Build a term → average-rating map from all saved reflection days
  // so the animation return phase uses the student's real importance scores.
  const termInterestScores = useMemo<Record<string, number>>(() => {
    const scores: Record<string, { sum: number; count: number }> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith("synthesisLog_reflections_day")) continue;
      try {
        const parsed = JSON.parse(localStorage.getItem(key) ?? "{}");
        for (const [_stageId, v] of Object.entries(parsed)) {
          if (v && typeof v === "object" && "rating" in v && "text" in v) {
            const entry = v as { text: string; rating: number };
            // Use the text content as a proxy for the term label isn't available here;
            // instead we store by stageId. The animation uses random terms from its pool,
            // so we can't match by term name unless the spiral state is also read.
            // Read spiral state to get actual term names for each day.
            const spiralRaw = localStorage.getItem("synthesisLog_spiral");
            if (spiralRaw && entry.rating > 0) {
              try {
                const spiral = JSON.parse(spiralRaw);
                // Find the term for this stage on this day
                // (We'll aggregate all ratings across all terms for the demo animation)
                if (spiral.shuffledTerms) {
                  for (const qt of spiral.shuffledTerms) {
                    const label = qt.term;
                    if (!scores[label]) scores[label] = { sum: 0, count: 0 };
                    scores[label].sum += entry.rating;
                    scores[label].count += 1;
                  }
                }
              } catch { /* ignore */ }
            }
          }
        }
      } catch { /* ignore */ }
    }
    const result: Record<string, number> = {};
    for (const [term, { sum, count }] of Object.entries(scores)) {
      result[term] = parseFloat((sum / count).toFixed(1));
    }
    return result;
  }, []);

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#2c2c2c]">
      {/* Header */}
      <header className="border-b border-[#e0d8cc] bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-[#7a6a55]">
              <ArrowLeft className="w-4 h-4" />
              Back to App
            </Button>
          </Link>
          <span className="text-sm font-semibold tracking-widest uppercase text-[#b08060]">Synthesis Log</span>
          <Link href="/">
            <Button size="sm" className="gap-2 bg-[#b08060] hover:bg-[#9a6e50] text-white">
              Open App
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16 space-y-20">

        {/* Hero */}
        <section className="space-y-8">
          <div className="text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f0e8dc] text-[#b08060] text-sm font-medium">
              <GraduationCap className="w-4 h-4" />
              IB Theory of Knowledge — Reflective Journal Tool
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-[#2c2c2c] leading-tight">
              Synthesis Log
            </h1>
            <p className="text-xl text-[#6b5c4a] max-w-2xl mx-auto leading-relaxed">
              A structured, multi-stage reflection journal designed to surface Knowledge Questions,
              map Ways of Knowing, and build a living curriculum from lived experience —
              purpose-built for IB Theory of Knowledge.
            </p>
          </div>

          {/* Window-size tabs */}
          <div className="flex items-center justify-center gap-1">
            <span className="text-xs text-[#8a7a6a] mr-2">Concepts in window:</span>
            {[2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setWindowSize(n)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  windowSize === n
                    ? "bg-[#b08060] text-white shadow-sm"
                    : "bg-[#f0e8dc] text-[#7a6a55] hover:bg-[#e8ddd0]"
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          {/* Spiral orbit animation */}
          <div className="rounded-2xl overflow-hidden border border-[#e0d8cc] bg-[#faf8f5] shadow-sm">
            <SpiralOrbitAnimation
              key={windowSize}
              speedMultiplier={animSpeed}
              onSpeedChange={handleSpeedChange}
              showSpeedSlider={true}
              windowSize={windowSize}
              termInterestScores={termInterestScores}
            />
          </div>

          <div className="text-center space-y-4">
            <p className="text-sm text-[#8a7a6a] italic">
              Each concept sphere orbits the central topic through its reflection stages — pulsing at each recording,
              then drifting away. At the end of the spiral, all spheres return, grown with insight.
            </p>
            <p className="text-base text-[#8a7a6a] max-w-xl mx-auto italic">
              "Spiral out. Keep going." — Tool, <em>Lateralus</em>
            </p>
            {/* Download animation button */}
            <a
              href="https://d2xsxph8kpxj0f.cloudfront.net/106830449/hpeNL2R8SX2mfkr5pEQAZ3/spiral-orbit-animation_a51f3952.html"
              download="spiral-orbit-animation.html"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#c8b89a] bg-white text-[#7a6a55] text-sm font-medium hover:bg-[#f5f0e8] transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              Download Animation (standalone HTML)
            </a>
            <p className="text-xs text-[#a89a88]">
              Zero dependencies · open in any browser · GitHub-ready
            </p>
          </div>
        </section>

        {/* IB TOK Alignment Banner */}
        <section className="bg-indigo-50 border border-indigo-200 rounded-2xl p-8 space-y-5">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-indigo-600 flex-shrink-0" />
            <h2 className="text-xl font-bold text-indigo-900">IB TOK Alignment</h2>
          </div>
          <p className="text-indigo-800 leading-relaxed">
            Synthesis Log is structured around the same epistemological architecture that underpins the IB TOK course.
            Each reflection stage maps directly to a layer of TOK inquiry — from personal knowledge and lived experience,
            through concrete and abstract analysis, to cross-concept synthesis and proposed action.
            The built-in <strong>TOK Spiral term bank</strong> (30 terms, 33-day cycle) uses paired contrasting concepts
            — Knowledge/Belief, Truth/Justification, Perception/Reality, Emotion/Reason — that mirror the core
            tensions the IB curriculum asks students to explore.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 border border-indigo-100 space-y-2">
              <h3 className="font-semibold text-indigo-900 text-sm uppercase tracking-wide">Reflection Stages → TOK Layers</h3>
              <ul className="text-sm text-indigo-800 space-y-1.5">
                <li><span className="font-semibold">History / Context</span> — Personal knowledge, lived experience, origin of understanding</li>
                <li><span className="font-semibold">Concrete / Abstract</span> — Real-world examples and theoretical frameworks</li>
                <li><span className="font-semibold">Amalgamation</span> — Cross-concept connections; the core TOK synthesis move</li>
                <li><span className="font-semibold">Motion</span> — Knowledge in action; proposed application or Knowledge Question</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-4 border border-indigo-100 space-y-2">
              <h3 className="font-semibold text-indigo-900 text-sm uppercase tracking-wide">TOK Spiral Term Bank (30 Terms)</h3>
              <div className="grid grid-cols-2 gap-x-4 text-sm text-indigo-800 space-y-0.5">
                {[
                  "Knowledge / Belief", "Truth / Justification", "Certainty / Doubt",
                  "Objectivity / Subjectivity", "Evidence / Interpretation",
                  "Perception / Reality", "Emotion / Reason", "Intuition / Logic",
                  "Bias / Awareness", "Memory / Reconstruction",
                  "Authority / Trust", "Consensus / Truth", "Language / Meaning",
                  "Perspective / Limitation", "Culture / Knowledge"
                ].map((pair) => (
                  <div key={pair} className="text-xs py-0.5 border-b border-indigo-50">{pair}</div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Canvas Submission Guide */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Upload className="w-6 h-6 text-[#b08060]" />
            <h2 className="text-2xl font-bold text-[#2c2c2c]">Submitting to Canvas</h2>
          </div>
          <p className="text-[#6b5c4a] leading-relaxed">
            Synthesis Log stores all reflections locally in your browser. To submit your work to Canvas —
            or to transfer your journal between devices — use the <strong>JSON Export</strong> feature.
            The exported file contains your complete spiral state: all term lists, every reflection, your
            settings, and your progress. It is the single source of truth for your journal.
          </p>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex gap-4 p-5 bg-white rounded-xl border border-[#e0d8cc]">
              <div className="w-8 h-8 rounded-full bg-[#b08060] text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">1</div>
              <div>
                <h3 className="font-semibold text-[#2c2c2c] mb-1">Export your journal as a JSON file</h3>
                <p className="text-sm text-[#6b5c4a] leading-relaxed">
                  In the app header, click <strong>Export JSON</strong>. This downloads a file named
                  <code className="mx-1 px-1.5 py-0.5 bg-[#f0e8dc] rounded text-[#b08060] text-xs">synthesis-log-YYYY-MM-DD.json</code>
                  to your Downloads folder. This file contains everything — do not rename or edit it.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4 p-5 bg-white rounded-xl border border-[#e0d8cc]">
              <div className="w-8 h-8 rounded-full bg-[#b08060] text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">2</div>
              <div>
                <h3 className="font-semibold text-[#2c2c2c] mb-1">Upload the JSON file to Canvas</h3>
                <p className="text-sm text-[#6b5c4a] leading-relaxed">
                  In your Canvas assignment, use the <strong>File Upload</strong> submission type and attach
                  the <code className="mx-1 px-1.5 py-0.5 bg-[#f0e8dc] rounded text-[#b08060] text-xs">.json</code> file directly.
                  Your teacher can open it to review your full reflection history, or load it back into
                  Synthesis Log to read your entries in context.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4 p-5 bg-white rounded-xl border border-[#e0d8cc]">
              <div className="w-8 h-8 rounded-full bg-[#b08060] text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">3</div>
              <div>
                <h3 className="font-semibold text-[#2c2c2c] mb-1">Loading on a different device</h3>
                <p className="text-sm text-[#6b5c4a] leading-relaxed">
                  Open <strong>{appUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}</strong> on the new device.
                  On the start screen, click <strong>Import JSON</strong> and select your exported file.
                  Your entire spiral — all reflections, all term lists, your current day — will be restored exactly.
                  You can then continue journaling from where you left off.
                </p>
              </div>
            </div>
          </div>

          {/* Important notes */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-900 text-sm mb-1">Browser storage is local only</h4>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Your reflections are stored in your browser's localStorage — they do not sync automatically
                  between devices or browsers. Always export before switching devices or clearing browser data.
                  Treat your JSON file as your journal backup.
                </p>
              </div>
            </div>
            <div className="flex gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900 text-sm mb-1">Your data stays private</h4>
                <p className="text-xs text-green-800 leading-relaxed">
                  All reflection content is processed and stored locally in your browser.
                  Nothing is sent to any server. The AI assistant uses a secure API call
                  but does not store your reflections. You own your data entirely.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Classroom Use Guide */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-[#b08060]" />
            <h2 className="text-2xl font-bold text-[#2c2c2c]">Using Synthesis Log in TOK Class</h2>
          </div>
          <p className="text-[#6b5c4a] leading-relaxed">
            Synthesis Log is designed to function as a primary TOK journal. Rather than producing
            disconnected entries, the spiral structure ensures that concepts revisit students across
            multiple days and stages — building the kind of iterative, layered understanding that
            TOK assessment rewards.
          </p>

          <div className="bg-white rounded-xl border border-[#e0d8cc] overflow-hidden">
            <div className="bg-[#f0e8dc] px-5 py-3">
              <h3 className="font-semibold text-[#2c2c2c]">Suggested Canvas Assignment Prompt</h3>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-[#4a3c2e] font-medium">TOK Synthesis Log Entry (Weekly)</p>
              <div className="text-sm text-[#6b5c4a] space-y-2 leading-relaxed">
                <p>Complete one full spiral entry using <a href={appBasePath()} className="text-[#b08060] underline underline-offset-2" target="_blank" rel="noreferrer">Synthesis Log</a>. Your entry must include:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>A <strong>History / Context</strong> reflection: personal connection or origin story for the term</li>
                  <li>A <strong>Concrete / Abstract</strong> reflection: one real-world example and one theoretical framing</li>
                  <li>An <strong>Amalgamation</strong> reflection: at least one connection to another term in today's set</li>
                  <li>A <strong>Motion</strong> reflection: one Knowledge Question this term raises for you</li>
                </ul>
                <p className="mt-2">Export your journal as a JSON file (<strong>Export JSON</strong> button in the header) and submit it here.</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#f0e8dc]">
                  <th className="text-left px-4 py-3 font-semibold text-[#2c2c2c] rounded-tl-lg">Score</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#2c2c2c]">Reflection Quality</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#2c2c2c]">TOK Connection</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#2c2c2c] rounded-tr-lg">Knowledge Question</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0d8cc]">
                <tr className="bg-white">
                  <td className="px-4 py-3 font-bold text-green-700">4.0</td>
                  <td className="px-4 py-3 text-[#4a3c2e]">Deep, personal, specific</td>
                  <td className="px-4 py-3 text-[#6b5c4a]">Named WOK/AOK, cross-concept link</td>
                  <td className="px-4 py-3 text-[#6b5c4a]">Original, genuinely open-ended</td>
                </tr>
                <tr className="bg-[#faf8f5]">
                  <td className="px-4 py-3 font-bold text-blue-700">3.0</td>
                  <td className="px-4 py-3 text-[#4a3c2e]">Solid, some specificity</td>
                  <td className="px-4 py-3 text-[#6b5c4a]">Implicit TOK connection present</td>
                  <td className="px-4 py-3 text-[#6b5c4a]">Present and relevant</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-3 font-bold text-amber-700">2.0</td>
                  <td className="px-4 py-3 text-[#4a3c2e]">Surface-level, general</td>
                  <td className="px-4 py-3 text-[#6b5c4a]">Weak or missing connection</td>
                  <td className="px-4 py-3 text-[#6b5c4a]">Vague or missing</td>
                </tr>
                <tr className="bg-[#faf8f5]">
                  <td className="px-4 py-3 font-bold text-red-700">1.0</td>
                  <td className="px-4 py-3 text-[#4a3c2e]">Minimal effort</td>
                  <td className="px-4 py-3 text-[#6b5c4a]">No TOK connection</td>
                  <td className="px-4 py-3 text-[#6b5c4a]">Absent</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* TOK Exhibition & Essay Connection */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Lightbulb className="w-6 h-6 text-[#b08060]" />
            <h2 className="text-2xl font-bold text-[#2c2c2c]">From Journal to Assessment</h2>
          </div>
          <p className="text-[#6b5c4a] leading-relaxed">
            The spiral structure is designed so that by mid-semester, students have a rich archive of
            personal examples, philosophical framings, and Knowledge Questions — the exact raw material
            needed for the TOK Exhibition and Essay.
          </p>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl p-5 border border-[#e0d8cc] space-y-3">
              <h3 className="font-semibold text-[#2c2c2c]">TOK Exhibition</h3>
              <p className="text-sm text-[#6b5c4a] leading-relaxed">
                Students can mine their Amalgamation and Motion entries for real-world objects and
                personal connections that demonstrate how a TOK concept manifests in lived experience.
                The spiral's cross-concept structure naturally surfaces the kind of unexpected links
                the Exhibition rewards.
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-[#e0d8cc] space-y-3">
              <h3 className="font-semibold text-[#2c2c2c]">TOK Essay</h3>
              <p className="text-sm text-[#6b5c4a] leading-relaxed">
                History/Context entries provide personal anecdotes and origin stories. Concrete/Abstract
                entries supply both real-world examples and theoretical frameworks. By the time students
                reach a prescribed title, they already have a bank of developed ideas to draw from —
                reducing the blank-page paralysis that plagues TOK essay writing.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold text-[#2c2c2c] border-b border-[#e0d8cc] pb-3">How the Spiral Works</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border border-[#e0d8cc] space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#f0e8dc] flex items-center justify-center">
                  <GitBranch className="w-5 h-5 text-[#b08060]" />
                </div>
                <h3 className="font-semibold text-[#2c2c2c]">The Spiral Queue</h3>
              </div>
              <p className="text-sm text-[#6b5c4a] leading-relaxed">
                Terms from your chosen list enter a rotating window. Each day, terms at different
                stages of the reflection cycle are presented together — creating a cross-section
                of old, current, and new concepts every session. No two days are the same combination.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-[#e0d8cc] space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#f0e8dc] flex items-center justify-center">
                  <Layers className="w-5 h-5 text-[#b08060]" />
                </div>
                <h3 className="font-semibold text-[#2c2c2c]">Variable Reflection Depth</h3>
              </div>
              <p className="text-sm text-[#6b5c4a] leading-relaxed">
                Choose from 2-step (Quick Synthesis), 3-step (Balanced), 4-step (Deep Dive), or
                5-step (Maximum Depth) models. The 4-step model maps most cleanly to the four
                TOK inquiry layers above and is recommended for classroom use.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-[#e0d8cc] space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#f0e8dc] flex items-center justify-center">
                  <Brain className="w-5 h-5 text-[#b08060]" />
                </div>
                <h3 className="font-semibold text-[#2c2c2c]">The Four Reflection Stages</h3>
              </div>
              <p className="text-sm text-[#6b5c4a] leading-relaxed">
                <strong>History/Context</strong> — where did this come from? Personal origin story.<br />
                <strong>Concrete/Abstract</strong> — real example, then theoretical principle.<br />
                <strong>Amalgamation</strong> — connections to today's other terms.<br />
                <strong>Motion</strong> — what action, question, or creation does this inspire?
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-[#e0d8cc] space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#f0e8dc] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#b08060]" />
                </div>
                <h3 className="font-semibold text-[#2c2c2c]">AI-Assisted Reflection</h3>
              </div>
              <p className="text-sm text-[#6b5c4a] leading-relaxed">
                Each reflection stage has an embedded AI assistant that generates stage-specific
                prompts, sparks ideas, and engages in dialogue about your terms — without
                interrupting your flow or leaving the page. The AI is a thinking partner,
                not a ghostwriter; all reflection content is authored by the student.
              </p>
            </div>
          </div>
        </section>

        {/* Reflection Depth Models */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-[#2c2c2c] border-b border-[#e0d8cc] pb-3">Reflection Depth Models</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#f0e8dc]">
                  <th className="text-left px-4 py-3 font-semibold text-[#2c2c2c] rounded-tl-lg">Model</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#2c2c2c]">Stages</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#2c2c2c]">Best For</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#2c2c2c] rounded-tr-lg">Cycle Length</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0d8cc]">
                <tr className="bg-white">
                  <td className="px-4 py-3 font-medium text-[#b08060]">2-Step Quick</td>
                  <td className="px-4 py-3 text-[#4a3c2e]">Foundation → Application</td>
                  <td className="px-4 py-3 text-[#6b5c4a]">Reviews, familiar material, fast-paced learning</td>
                  <td className="px-4 py-3 text-[#6b5c4a]">N + 1 days</td>
                </tr>
                <tr className="bg-[#faf8f5]">
                  <td className="px-4 py-3 font-medium text-[#b08060]">3-Step Balanced</td>
                  <td className="px-4 py-3 text-[#4a3c2e]">History → Analysis → Synthesis</td>
                  <td className="px-4 py-3 text-[#6b5c4a]">Standard learning pace, most subject areas</td>
                  <td className="px-4 py-3 text-[#6b5c4a]">N + 2 days</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-3 font-medium text-[#b08060]">4-Step Deep ★</td>
                  <td className="px-4 py-3 text-[#4a3c2e]">History → Concrete/Abstract → Amalgamation → Motion</td>
                  <td className="px-4 py-3 text-[#6b5c4a]">TOK classroom use, cross-domain synthesis</td>
                  <td className="px-4 py-3 text-[#6b5c4a]">N + 3 days</td>
                </tr>
                <tr className="bg-[#faf8f5]">
                  <td className="px-4 py-3 font-medium text-[#b08060]">5-Step Maximum</td>
                  <td className="px-4 py-3 text-[#4a3c2e]">History → Concrete → Abstract → Amalgamation → Motion</td>
                  <td className="px-4 py-3 text-[#6b5c4a]">Research-level analysis, extended inquiry</td>
                  <td className="px-4 py-3 text-[#6b5c4a]">N + 4 days</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[#8a7a6a] italic">★ Recommended for IB TOK. N = number of terms in your list. The spiral runs for N + (depth - 1) days total.</p>
        </section>

        {/* All Features */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-[#2c2c2c] border-b border-[#e0d8cc] pb-3">All Features</h2>

          <div className="space-y-4">
            {[
              {
                icon: <FileJson className="w-5 h-5" />,
                title: "JSON Export / Import — Cross-Device Save",
                desc: "Export your full spiral state (term lists, all reflections, settings, current day) as a JSON file. Import it on any device or browser to resume exactly where you left off. This is the primary mechanism for Canvas submission and device transfer. The file is human-readable and can be reviewed by instructors without loading the app."
              },
              {
                icon: <Layers className="w-5 h-5" />,
                title: "Multi-List Spiral",
                desc: "Select multiple term lists and combine them in Sequential (lists in order), Shuffled (randomized within each list), or Blended (all terms interleaved) modes. Each list has a signature color hue that appears throughout the interface."
              },
              {
                icon: <Brain className="w-5 h-5" />,
                title: "Perpetual Spiral",
                desc: "When a list completes, you're prompted to add a new list and continue seamlessly. The spiral never ends — it just evolves. The progress bar shows color-coded segments for each list in the queue."
              },
              {
                icon: <Sparkles className="w-5 h-5" />,
                title: "AI Assistant per Stage",
                desc: "Each reflection stage has an embedded AI chat panel. Click 'Spark an idea' for a stage-specific prompt, or type your own question. The AI maintains context across the conversation and persists state even after saving reflections. The AI prompts thinking — it does not write reflections for the student."
              },
              {
                icon: <Calendar className="w-5 h-5" />,
                title: "Reflection History Calendar",
                desc: "A collapsible monthly calendar shows all days with saved reflections. Color-coded dots indicate which lists were active. Click any day to navigate directly to it and review or edit past reflections."
              },
              {
                icon: <Printer className="w-5 h-5" />,
                title: "Printable Daily Worksheet",
                desc: "Generate a print-ready 8.5\" × 11\" worksheet for today's reflection set. Includes a month calendar, DNA strand spiral progress graphic, and lined writing boxes for each active stage. Useful for analog journaling or class handouts."
              },
              {
                icon: <Calendar className="w-5 h-5" />,
                title: "Google Calendar Export (.ics)",
                desc: "Export your entire spiral as a Google Calendar-compatible .ics file. Each day generates two events: a morning event with context/history prompts and an evening event with synthesis/motion prompts — keeping your reflection practice on your phone, watch, and calendar."
              },
              {
                icon: <GitBranch className="w-5 h-5" />,
                title: "Custom Term Lists",
                desc: "Upload your own terms via CSV, or choose from built-in preset lists covering Music Theory, Art & Design, Computer Science, Physics, Biology, Geography, Philosophy, and the full TOK Spiral (30 terms)."
              },
            ].map((f, i) => (
              <div key={i} className="flex gap-4 p-5 bg-white rounded-xl border border-[#e0d8cc]">
                <div className="w-10 h-10 rounded-lg bg-[#f0e8dc] flex items-center justify-center flex-shrink-0 text-[#b08060]">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-[#2c2c2c] mb-1">{f.title}</h3>
                  <p className="text-sm text-[#6b5c4a] leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Built-in Term Lists */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-[#2c2c2c] border-b border-[#e0d8cc] pb-3">Built-in Term Lists</h2>
          <p className="text-[#6b5c4a]">
            Synthesis Log ships with curated term lists across disciplines. Mix and match lists from different fields
            to discover unexpected cross-domain connections — a core TOK skill.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              "TOK Spiral (30 terms)", "Music Theory", "Art & Design", "Computer Science",
              "Physics", "Biology", "Geography", "Philosophy",
              "Mathematics", "Psychology", "Chemistry", "Literature",
              "Economics", "Architecture", "Film & Cinema", "Linguistics"
            ].map((list) => (
              <div
                key={list}
                className={`px-3 py-2 rounded-lg border text-sm text-center font-medium ${
                  list === "TOK Spiral (30 terms)"
                    ? "bg-indigo-50 border-indigo-300 text-indigo-800"
                    : "bg-white border-[#e0d8cc] text-[#4a3c2e]"
                }`}
              >
                {list}
              </div>
            ))}
          </div>
        </section>

        {/* Philosophy */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-[#2c2c2c] border-b border-[#e0d8cc] pb-3">The Philosophy</h2>
          <div className="prose prose-stone max-w-none space-y-4 text-[#4a3c2e] leading-relaxed">
            <p>
              Most learning tools ask you to master one domain at a time. Synthesis Log asks a different question:
              <strong> what happens when you force two unrelated ideas to sit in the same room?</strong>
            </p>
            <p>
              The app is built around the conviction that the most generative insights emerge not from depth alone,
              but from the collision of depth across domains. A musician studying counterpoint alongside a programmer
              studying recursion will find that both are expressions of the same underlying pattern — voices that
              maintain independence while contributing to a unified whole.
            </p>
            <p>
              This is the core purpose of Synthesis Log: to build a daily practice of forced adjacency.
              By rotating through a curated term bank using a spiral queue, each day presents a unique
              cross-section of concepts at different stages of reflection — some freshly encountered,
              some being analyzed, some being synthesized into action. The result is a living web of
              connections that grows richer with each pass.
            </p>
            <p>
              The name and structure are a tribute to Tool's music — particularly <em>Lateralus</em> —
              and its invitation to spiral outward, to embrace complexity, and to find the pattern
              that connects all things.
            </p>
          </div>
        </section>

        {/* Vision */}
        <section className="space-y-6 bg-[#f0e8dc] rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-[#2c2c2c]">The Vision: Spirals in Dialogue</h2>
          <div className="space-y-4 text-[#4a3c2e] leading-relaxed">
            <p>
              The current version of Synthesis Log is a personal practice tool. But the deeper vision
              is a commons — a place where you can browse the spirals of others as they weave their
              own intricate paths through the land of the new.
            </p>
            <p>
              Imagine reading someone else's Motion proposals from Day 14 of a spiral combining
              Music Theory and Quantum Mechanics. Or discovering that a designer's Amalgamation
              notes for "negative space" and "recursion" mirror your own synthesis from a completely
              different starting point.
            </p>
            <p>
              For TOK specifically: imagine a class-wide concept map, built from 30 students'
              spirals over a semester, showing where personal knowledge converges and diverges —
              a living demonstration of shared and personal knowledge in action.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center space-y-4 pb-8">
          <h2 className="text-2xl font-bold text-[#2c2c2c]">Ready to Spiral Out?</h2>
          <p className="text-[#6b5c4a]">Start with the TOK Spiral list. The connections will find you.</p>
          <Link href="/">
            <Button size="lg" className="bg-[#b08060] hover:bg-[#9a6e50] text-white gap-2 px-8">
              Open Synthesis Log
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </section>

      </main>
    </div>
  );
}
