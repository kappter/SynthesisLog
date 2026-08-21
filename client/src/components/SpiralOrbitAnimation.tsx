import { useCallback, useEffect, useRef, useState } from "react";

// ─── TOK Topic Pool (30 authentic TOK concepts) ───────────────────────────────
const TOK_POOL = [
  "Knowledge","Truth","Belief","Justification","Certainty",
  "Perspective","Bias","Evidence","Reason","Emotion",
  "Language","Intuition","Imagination","Memory","Perception",
  "Culture","Ethics","Paradigm","Interpretation","Objectivity",
  "Subjectivity","Consensus","Doubt","Inquiry","Reflection",
  "Analogy","Causation","Coherence","Contradiction","Synthesis",
];

// Stage names per window size
const STAGE_NAMES: Record<number, string[]> = {
  2: ["Concrete", "History"],
  3: ["Synthesis", "Analysis", "History"],
  4: ["Motion", "Amalgam", "Concrete", "History"],
  5: ["Motion", "Amalgam", "Concrete", "Analysis", "History"],
};

const TOTAL_TERMS = 12;
const ORBIT_RADIUS = 108;
const TAU = Math.PI * 2;
const ENTRY_ANGLE = -Math.PI / 2; // 12 o'clock

// 12 distinct hues spread around the colour wheel
const HUES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickTokTerms(): string[] {
  return shuffleArray(TOK_POOL).slice(0, TOTAL_TERMS);
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase =
  | "waiting"    // not yet spawned
  | "entering"   // flying in from outside
  | "orbiting"   // doing its one full orbit
  | "exiting"    // flying to queue slot
  | "queued"     // sitting in the right-side stack
  | "returning"  // flying back in from queue
  | "returned";  // orbiting again with interest score

interface Ripple { x: number; y: number; r: number; maxR: number; alpha: number; hue: number }

interface Sphere {
  id: number;
  label: string;
  hue: number;
  angle: number;
  orbitRadius: number;
  speed: number;
  totalAngle: number;
  baseRadius: number;
  displayRadius: number;
  phase: Phase;
  entryProgress: number;
  exitProgress: number;
  entryFrom: { x: number; y: number };
  exitTo: { x: number; y: number };
  trail: { x: number; y: number; a: number }[];
  ripples: Ripple[];
  pulsesFired: number;
  queueSlot: number;
  queueX: number;
  queueY: number;
  interestScore: number;
  scoreAlpha: number;
  stageIndex: number;
  // which "day" this sphere represents (1-indexed)
  dayNumber: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }
function easeInOut(t: number) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function hsl(h: number, s: number, l: number, a = 1) { return `hsla(${h},${s}%,${l}%,${a})`; }
function orbitXY(angle: number, r: number, cx: number, cy: number) {
  return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
}

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
  speedMultiplier?: number;
  onSpeedChange?: (v: number) => void;
  showSpeedSlider?: boolean;
  windowSize?: number;
  termInterestScores?: Record<string, number>;
}

export function SpiralOrbitAnimation({
  speedMultiplier = 1,
  onSpeedChange,
  showSpeedSlider = true,
  windowSize = 5,
  termInterestScores = {},
}: Props) {
  const termScoresRef = useRef(termInterestScores);
  useEffect(() => { termScoresRef.current = termInterestScores; }, [termInterestScores]);

  const wsRef = useRef(windowSize);
  useEffect(() => { wsRef.current = windowSize; }, [windowSize]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const speedRef = useRef(speedMultiplier);
  const [localSpeed, setLocalSpeed] = useState(speedMultiplier);
  useEffect(() => { speedRef.current = speedMultiplier; setLocalSpeed(speedMultiplier); }, [speedMultiplier]);

  const handleSpeedChange = useCallback((v: number) => {
    speedRef.current = v;
    setLocalSpeed(v);
    onSpeedChange?.(v);
  }, [onSpeedChange]);

  // ── Simulation state ──────────────────────────────────────────────────────
  const S = useRef<{
    spheres: Sphere[];
    termQueue: { label: string; day: number }[];
    act: "buildup" | "steady" | "returning" | "done";
    frame: number;
    // Angle travelled by the lead sphere since the last spawn
    angleSinceLastEntry: number;
    cx: number; cy: number;
    animId: number;
    centralPulse: number;
    centralDir: number;
    returnProgress: number;
    nextReturnIdx: number;
    topicLabel: string;
  } | null>(null);

  // ── Queue layout ──────────────────────────────────────────────────────────
  function queuePos(i: number, w: number, h: number) {
    const qx = w - 52;
    const qy = h * 0.12 + i * 28;
    return { x: qx, y: qy };
  }

  // ── Spawn a sphere ────────────────────────────────────────────────────────
  const spawnSphere = useCallback((
    cx: number, cy: number, w: number,
    entryAngle: number,
    label: string,
    day: number
  ): Sphere => {
    const s = S.current!;
    const id = s.spheres.length;
    const hue = HUES[id % HUES.length];
    const entryDist = w * 0.55;
    const baseRadius = 14;
    return {
      id, label, hue,
      angle: entryAngle,
      orbitRadius: ORBIT_RADIUS,
      speed: 0.008,
      totalAngle: 0,
      baseRadius,
      displayRadius: baseRadius,
      phase: "entering",
      entryProgress: 0,
      exitProgress: 0,
      entryFrom: {
        x: cx + Math.cos(entryAngle) * entryDist,
        y: cy + Math.sin(entryAngle) * entryDist,
      },
      exitTo: { x: 0, y: 0 },
      trail: [],
      ripples: [],
      pulsesFired: 0,
      queueSlot: -1,
      queueX: 0,
      queueY: 0,
      interestScore: 0,
      scoreAlpha: 0,
      stageIndex: 0,
      dayNumber: day,
    };
  }, []);

  const init = useCallback((w: number, h: number) => {
    const ws = wsRef.current;
    const terms = pickTokTerms(); // always 12 random TOK topics
    const topicLabel = shuffleArray(TOK_POOL.filter(t => !terms.includes(t)))[0] || "TOPIC";
    S.current = {
      spheres: [],
      termQueue: terms.map((label, i) => ({ label, day: i + 1 })),
      act: "buildup",
      frame: 0,
      angleSinceLastEntry: TAU, // ready to spawn on frame 1
      cx: w / 2,
      cy: h / 2,
      animId: 0,
      centralPulse: 1,
      centralDir: 1,
      returnProgress: 0,
      nextReturnIdx: 0,
      topicLabel,
    };
    void ws; // suppress unused warning — wsRef is used in tick
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(dpr, dpr);
      init(w, h);
    };

    resize();
    window.addEventListener("resize", resize);

    // ── Draw helpers ──────────────────────────────────────────────────────────

    const drawCentral = (cx: number, cy: number, pulse: number, label: string) => {
      for (let i = 3; i >= 1; i--) {
        ctx.beginPath();
        ctx.arc(cx, cy, 30 * pulse + i * 9, 0, TAU);
        ctx.fillStyle = hsl(35, 70, 65, 0.03 * i);
        ctx.fill();
      }
      const g = ctx.createRadialGradient(cx - 7, cy - 7, 2, cx, cy, 30 * pulse);
      g.addColorStop(0, hsl(42, 95, 82));
      g.addColorStop(0.5, hsl(32, 82, 62));
      g.addColorStop(1, hsl(22, 72, 42));
      ctx.beginPath();
      ctx.arc(cx, cy, 30 * pulse, 0, TAU);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.font = "bold 9px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fillText("TOPIC", cx, cy - 4);
      ctx.font = "7px system-ui";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText(label, cx, cy + 6);
    };

    const drawOrbitRing = (cx: number, cy: number, r: number, hue: number, alpha: number) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TAU);
      ctx.strokeStyle = hsl(hue, 40, 60, alpha);
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const drawSphere = (sp: Sphere, x: number, y: number, alpha: number) => {
      const r = sp.displayRadius;
      // Trail
      for (const t of sp.trail) {
        ctx.beginPath();
        ctx.arc(t.x, t.y, r * 0.4, 0, TAU);
        ctx.fillStyle = hsl(sp.hue, 60, 60, t.a * alpha * 0.4);
        ctx.fill();
      }
      // Glow
      const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2.2);
      glow.addColorStop(0, hsl(sp.hue, 70, 70, 0.18 * alpha));
      glow.addColorStop(1, hsl(sp.hue, 70, 70, 0));
      ctx.beginPath();
      ctx.arc(x, y, r * 2.2, 0, TAU);
      ctx.fillStyle = glow;
      ctx.fill();
      // Sphere
      const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.05, x, y, r);
      g.addColorStop(0, hsl(sp.hue, 80, 88, alpha));
      g.addColorStop(0.5, hsl(sp.hue, 70, 58, alpha));
      g.addColorStop(1, hsl(sp.hue, 60, 35, alpha));
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fillStyle = g;
      ctx.fill();
      // Label
      ctx.font = `bold ${Math.max(7, Math.min(9, r * 0.62))}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = `rgba(255,255,255,${0.95 * alpha})`;
      const maxChars = Math.floor(r * 1.4);
      const text = sp.label.length > maxChars ? sp.label.slice(0, maxChars - 1) + "…" : sp.label;
      ctx.fillText(text, x, y);
    };

    const drawRipples = (ripples: Ripple[]) => {
      for (const r of ripples) {
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, TAU);
        ctx.strokeStyle = hsl(r.hue, 60, 60, r.alpha);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    };

    const drawStageLabel = (sp: Sphere, x: number, y: number, ws: number) => {
      const stages = STAGE_NAMES[ws] || [];
      const stageName = stages[sp.stageIndex] || "";
      const dayLabel = `Day ${sp.dayNumber}`;
      ctx.font = "9px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = hsl(sp.hue, 50, 35, 0.75);
      ctx.fillText(`${dayLabel} · ${stageName}`, x, y - sp.displayRadius - 3);
    };

    const drawInterestScore = (sp: Sphere, x: number, y: number) => {
      if (sp.scoreAlpha <= 0) return;
      ctx.font = `bold ${Math.max(9, sp.displayRadius * 0.7)}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = hsl(sp.hue, 60, 35, sp.scoreAlpha);
      ctx.fillText(sp.interestScore.toFixed(1), x, y - sp.displayRadius - 2);
      ctx.font = "7px system-ui";
      ctx.fillStyle = hsl(sp.hue, 50, 50, sp.scoreAlpha * 0.7);
      ctx.fillText("interest", x, y - sp.displayRadius - 1);
    };

    const drawQueue = (w: number, h: number) => {
      const s = S.current;
      if (!s) return;
      const queued = s.spheres.filter(sp => sp.phase === "queued");
      if (queued.length === 0) return;

      // Queue panel background
      const panelX = w - 88;
      const panelY = h * 0.08;
      const panelH = queued.length * 28 + 24;
      ctx.fillStyle = "rgba(240,232,220,0.7)";
      ctx.beginPath();
      ctx.roundRect(panelX, panelY, 80, panelH, 6);
      ctx.fill();
      ctx.strokeStyle = "rgba(160,140,120,0.3)";
      ctx.lineWidth = 0.5;
      ctx.stroke();

      ctx.font = "bold 7px system-ui";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(100,80,60,0.6)";
      ctx.fillText("COMPLETED", panelX + 40, panelY + 10);

      for (const sp of queued) {
        const { x, y } = queuePos(sp.queueSlot, w, h);
        // Ellipse pill
        ctx.beginPath();
        ctx.ellipse(x, y, 28, 10, 0, 0, TAU);
        ctx.fillStyle = hsl(sp.hue, 55, 72, 0.85);
        ctx.fill();
        ctx.strokeStyle = hsl(sp.hue, 40, 50, 0.5);
        ctx.lineWidth = 0.8;
        ctx.stroke();
        // Label
        ctx.font = "bold 7px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = hsl(sp.hue, 30, 20, 0.9);
        const short = sp.label.length > 8 ? sp.label.slice(0, 7) + "…" : sp.label;
        ctx.fillText(short, x, y);
      }
    };

    // ── Tick ──────────────────────────────────────────────────────────────────
    const tick = () => {
      const s = S.current;
      if (!s) return;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const { cx, cy } = s;
      const spd = speedRef.current;
      const ws = wsRef.current;

      ctx.clearRect(0, 0, w, h);

      // Background
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.65);
      bg.addColorStop(0, "rgba(252,250,247,1)");
      bg.addColorStop(1, "rgba(240,232,220,1)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      s.frame++;

      // Central breathe
      s.centralPulse += 0.0007 * s.centralDir * spd;
      if (s.centralPulse > 1.07) s.centralDir = -1;
      if (s.centralPulse < 0.95) s.centralDir = 1;

      // ── ACT: buildup / steady ─────────────────────────────────────────────
      if (s.act === "buildup" || s.act === "steady") {

        // Advance all active spheres
        for (const sp of s.spheres) {
          if (sp.phase === "entering") {
            sp.entryProgress = Math.min(1, sp.entryProgress + 0.025 * spd);
            if (sp.entryProgress >= 1) {
              sp.phase = "orbiting";
              sp.totalAngle = 0;
              sp.pulsesFired = 0;
            }
          }

          if (sp.phase === "orbiting") {
            const delta = sp.speed * spd;
            sp.angle += delta;
            sp.totalAngle += delta;

            const pos = orbitXY(sp.angle, sp.orbitRadius, cx, cy);
            sp.trail.push({ x: pos.x, y: pos.y, a: 0.5 });
            if (sp.trail.length > 20) sp.trail.shift();
            sp.trail.forEach(t => (t.a *= 0.91));

            // Fire exactly ws pulses evenly spaced across one orbit
            const pulseInterval = TAU / ws;
            const expectedPulses = Math.floor(sp.totalAngle / pulseInterval);
            if (expectedPulses > sp.pulsesFired) {
              sp.pulsesFired = expectedPulses;
              sp.ripples.push({
                x: pos.x, y: pos.y,
                r: sp.displayRadius, maxR: sp.displayRadius * 3.5,
                alpha: 0.9, hue: sp.hue,
              });
              s.centralPulse = 1.1;
            }

            // Completed exactly one full orbit → exit to queue
            if (sp.totalAngle >= TAU) {
              sp.phase = "exiting";
              sp.exitProgress = 0;
              const usedSlots = s.spheres
                .filter(x => x.phase === "queued" || x.phase === "exiting")
                .map(x => x.queueSlot)
                .filter(x => x >= 0);
              let slot = 0;
              while (usedSlots.includes(slot)) slot++;
              sp.queueSlot = slot;
              const { x: qx, y: qy } = queuePos(slot, w, h);
              sp.exitTo = { x: qx, y: qy };
              sp.queueX = qx;
              sp.queueY = qy;
            }
          }

          if (sp.phase === "exiting") {
            sp.exitProgress = Math.min(1, sp.exitProgress + 0.018 * spd);
            if (sp.exitProgress >= 1) {
              sp.phase = "queued";
              sp.trail = [];
            }
          }
        }

        // Update stageIndex for active spheres (newest = 0, oldest = ws-1)
        const active = s.spheres
          .filter(sp => sp.phase === "orbiting" || sp.phase === "entering")
          .sort((a, b) => a.id - b.id);
        active.forEach((sp, i) => { sp.stageIndex = active.length - 1 - i; });

        // ── Spawn logic ───────────────────────────────────────────────────────
        // Count how many are currently in orbit (entering or orbiting)
        const orbitingCount = s.spheres.filter(sp =>
          sp.phase === "entering" || sp.phase === "orbiting"
        ).length;

        // Track angle since last spawn using the oldest active sphere
        const leadSphere = s.spheres.find(sp =>
          sp.phase === "entering" || sp.phase === "orbiting"
        );
        if (leadSphere) {
          s.angleSinceLastEntry += leadSphere.speed * spd;
        }

        // Stagger: spawn next sphere after TAU/ws of travel
        const staggerAngle = TAU / ws;

        const shouldSpawn =
          s.termQueue.length > 0 &&
          orbitingCount < ws &&
          s.angleSinceLastEntry >= staggerAngle;

        if (shouldSpawn) {
          const next = s.termQueue.shift()!;
          const newSp = spawnSphere(cx, cy, w, ENTRY_ANGLE, next.label, next.day);
          s.spheres.push(newSp);
          s.angleSinceLastEntry = 0;
          // Transition to steady once we first reach full window
          if (orbitingCount + 1 >= ws) s.act = "steady";
        }

        // Once all 12 terms have been spawned AND all have exited → return phase
        const allSpawned = s.termQueue.length === 0;
        const allQueued = s.spheres.every(sp => sp.phase === "queued");
        if (allSpawned && allQueued) {
          s.act = "returning";
          s.returnProgress = 0;
          s.nextReturnIdx = 0;
        }
      }

      // ── ACT: returning ────────────────────────────────────────────────────
      if (s.act === "returning") {
        s.returnProgress += 0.012 * spd;

        const queued = s.spheres
          .filter(sp =>
            sp.phase === "queued" ||
            sp.phase === "returning" ||
            sp.phase === "returned"
          )
          .sort((a, b) => a.id - b.id);

        // Stagger: one sphere returns per TAU/ws interval
        const returnStagger = TAU / ws;
        if (s.returnProgress >= (s.nextReturnIdx + 1) * returnStagger &&
            s.nextReturnIdx < queued.length - 1) {
          s.nextReturnIdx++;
        }

        queued.forEach((sp, i) => {
          if (sp.phase === "queued" && i <= s.nextReturnIdx) {
            const saved = termScoresRef.current[sp.label];
            sp.interestScore = saved != null && saved > 0
              ? parseFloat(saved.toFixed(1))
              : parseFloat((1 + Math.random() * 9).toFixed(1));
            sp.displayRadius = sp.baseRadius * (0.85 + sp.interestScore * 0.15);
            const returnAngle = ENTRY_ANGLE + i * (TAU / ws);
            sp.angle = returnAngle;
            sp.entryProgress = 0;
            sp.totalAngle = 0;
            sp.pulsesFired = 0;
            sp.scoreAlpha = 0;
            sp.trail = [];
            sp.phase = "returning";
            sp.entryFrom = { x: sp.queueX, y: sp.queueY };
          }

          if (sp.phase === "returning") {
            sp.entryProgress = Math.min(1, sp.entryProgress + 0.022 * spd);
            if (sp.entryProgress >= 1) sp.phase = "returned";
          }

          if (sp.phase === "returned") {
            sp.angle += sp.speed * spd;
            sp.totalAngle += sp.speed * spd;
            sp.scoreAlpha = Math.min(1, sp.scoreAlpha + 0.015 * spd);
            const pos = orbitXY(sp.angle, sp.orbitRadius, cx, cy);
            sp.trail.push({ x: pos.x, y: pos.y, a: 0.45 });
            if (sp.trail.length > 20) sp.trail.shift();
            sp.trail.forEach(t => (t.a *= 0.91));
          }
        });
      }

      // ── Advance ripples ───────────────────────────────────────────────────
      for (const sp of s.spheres) {
        sp.ripples = sp.ripples.filter(r => r.alpha > 0.015);
        for (const r of sp.ripples) {
          r.r += (r.maxR - r.r) * 0.055 * spd;
          r.alpha *= 0.935;
        }
      }

      // ── Draw orbit ring ───────────────────────────────────────────────────
      const hasOrbiting = s.spheres.some(sp =>
        sp.phase === "orbiting" || sp.phase === "entering" ||
        sp.phase === "returning" || sp.phase === "returned"
      );
      if (hasOrbiting) drawOrbitRing(cx, cy, ORBIT_RADIUS, 35, 0.2);

      // ── Draw central ──────────────────────────────────────────────────────
      drawCentral(cx, cy, s.centralPulse, s.topicLabel);

      // ── Draw spheres ──────────────────────────────────────────────────────
      for (const sp of s.spheres) {
        let pos: { x: number; y: number } | null = null;
        let alpha = 1;

        if (sp.phase === "entering") {
          const p = easeOut(sp.entryProgress);
          const target = orbitXY(sp.angle, sp.orbitRadius, cx, cy);
          pos = { x: lerp(sp.entryFrom.x, target.x, p), y: lerp(sp.entryFrom.y, target.y, p) };
          alpha = p;
        } else if (sp.phase === "orbiting") {
          pos = orbitXY(sp.angle, sp.orbitRadius, cx, cy);
        } else if (sp.phase === "exiting") {
          const p = easeInOut(sp.exitProgress);
          const from = orbitXY(sp.angle, sp.orbitRadius, cx, cy);
          pos = { x: lerp(from.x, sp.exitTo.x, p), y: lerp(from.y, sp.exitTo.y, p) };
          alpha = 1 - p * 0.5;
        } else if (sp.phase === "returning") {
          const p = easeOut(sp.entryProgress);
          const target = orbitXY(sp.angle, sp.orbitRadius, cx, cy);
          pos = { x: lerp(sp.entryFrom.x, target.x, p), y: lerp(sp.entryFrom.y, target.y, p) };
          alpha = p;
        } else if (sp.phase === "returned") {
          pos = orbitXY(sp.angle, sp.orbitRadius, cx, cy);
        }

        if (pos) {
          drawRipples(sp.ripples);
          drawSphere(sp, pos.x, pos.y, alpha);
          if (sp.phase === "orbiting") drawStageLabel(sp, pos.x, pos.y, ws);
          if (sp.phase === "returned") drawInterestScore(sp, pos.x, pos.y);
        }
      }

      // ── Draw queue ────────────────────────────────────────────────────────
      drawQueue(w, h);

      // ── Status overlay ────────────────────────────────────────────────────
      const orbitingNow = s.spheres.filter(sp => sp.phase === "orbiting").length;
      const queuedNow = s.spheres.filter(sp => sp.phase === "queued").length;
      const totalSpawned = s.spheres.length;
      ctx.font = "bold 10px system-ui";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = "rgba(100,80,60,0.5)";
      if (s.act === "returning") {
        ctx.fillText(`Spiral complete — returning with insight`, 12, 12);
      } else if (orbitingNow > 0) {
        ctx.fillText(
          `Day ${totalSpawned} · ${orbitingNow} term${orbitingNow > 1 ? "s" : ""} in orbit · ${queuedNow} completed`,
          12, 12
        );
      }

      s.animId = requestAnimationFrame(tick);
    };

    S.current!.animId = requestAnimationFrame(tick);

    return () => {
      if (S.current) cancelAnimationFrame(S.current.animId);
      window.removeEventListener("resize", resize);
    };
  }, [init, spawnSphere]);

  return (
    <div className="relative w-full select-none" style={{ height: 380 }}>
      <canvas ref={canvasRef} className="w-full h-full" />

      {/* Legend */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-5 pointer-events-none">
        {[
          { label: "Reflection pulse", color: "#7ab0d0" },
          { label: "Orbit complete → queue", color: "#b08060" },
          { label: "Return (interest score)", color: "#80c080" },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs text-[#7a6a55]">
            <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
            {item.label}
          </div>
        ))}
      </div>

      {/* Speed slider */}
      {showSpeedSlider && (
        <div className="absolute bottom-2 right-3 flex items-center gap-2 pointer-events-auto">
          <span className="text-[10px] text-[#9a8a78]">Speed</span>
          <input
            id="orbit-speed-slider"
            name="orbit-speed"
            type="range" min={0.25} max={4} step={0.25}
            value={localSpeed}
            onChange={e => handleSpeedChange(parseFloat(e.target.value))}
            aria-label="Animation speed"
            className="w-20 h-1 accent-[#b08060] cursor-pointer"
          />
          <span className="text-[10px] text-[#9a8a78] w-6 text-right">{localSpeed}×</span>
        </div>
      )}
    </div>
  );
}
