import PDFDocument from 'pdfkit';
import { DEPTH_CONFIGS } from '../shared/reflectionDepth';
import { getStagesForDay, buildSpiralQueue } from '../shared/spiralQueue';
import { generateRecommendations } from '../shared/tokPathways';

interface SpiralSegment {
  listId: string;
  listName: string;
  listHue: number;
  terms: string[];
  startDay: number;
}

// Reflection value can be plain string (old) or { text, rating } (new)
type ReflectionValue = string | { text: string; rating?: number };

interface ReflectionState {
  [stageId: string]: ReflectionValue;
}

interface ExportData {
  segments: SpiralSegment[];
  reflections: Record<number, ReflectionState>;
  startDate: string;
  currentDay: number;
  reflectionDepth: 2 | 3 | 4 | 5;
  /** 'standard' = generic report; 'ib-tok' = adds Assessment Pathways section */
  reportType?: 'standard' | 'ib-tok';
}

// Convert hue (0-360) to an RGB triplet for PDFKit
function hslToRgb(h: number, s = 0.65, l = 0.50): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60)       { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else              { r = c; b = x; }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

function getText(v: ReflectionValue): string {
  if (typeof v === 'string') return v;
  return v?.text ?? '';
}
function getRating(v: ReflectionValue): number {
  if (typeof v === 'object' && v !== null && 'rating' in v) return v.rating ?? 0;
  return 0;
}

function drawRatingDots(doc: PDFKit.PDFDocument, x: number, y: number, rating: number) {
  const dotR = 3;
  const gap = 8;
  for (let i = 1; i <= 10; i++) {
    const filled = i <= rating;
    doc.circle(x + (i - 1) * gap, y, dotR)
       .fillAndStroke(filled ? '#4f46e5' : '#e5e7eb', filled ? '#4f46e5' : '#d1d5db');
  }
}

function drawProgressBar(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, pct: number, color: string) {
  doc.rect(x, y, w, h).fillColor('#f3f4f6').fill();
  if (pct > 0) {
    doc.rect(x, y, w * pct, h).fillColor(color).fill();
  }
  doc.rect(x, y, w, h).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
}

export async function generateSpiralPDF(data: ExportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
    const buffers: Buffer[] = [];
    const PAGE_W = doc.page.width;
    const MARGIN = 50;
    const CONTENT_W = PAGE_W - MARGIN * 2;

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const depthConfig = DEPTH_CONFIGS[data.reflectionDepth];
    const stageIds = depthConfig.map(s => s.id);
    const stageLabels: Record<string, string> = {};
    for (const s of depthConfig) stageLabels[s.id] = s.label;

    const startDateObj = new Date(data.startDate);
    const listNamesSet = new Set(data.segments.map(s => s.listName));
    const listNames = Array.from(listNamesSet);

    // ── Build allTerms queue for stage lookups ──────────────────────────────
    const allTerms = buildSpiralQueue(data.segments.map(seg => ({
      listId: seg.listId,
      listName: seg.listName,
      listHue: seg.listHue,
      terms: seg.terms,
    })), 'sequential');

    // ── Compute summary stats ───────────────────────────────────────────────
    const completedDays = Object.keys(data.reflections).length;
    const totalDays = data.currentDay;
    const completionPct = totalDays > 0 ? completedDays / totalDays : 0;

    // Average rating per stage
    const ratingTotals: Record<string, number[]> = {};
    for (const stageId of stageIds) ratingTotals[stageId] = [];
    for (const dayData of Object.values(data.reflections)) {
      for (const stageId of stageIds) {
        const r = getRating(dayData[stageId]);
        if (r > 0) ratingTotals[stageId].push(r);
      }
    }
    const avgRating = (arr: number[]) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : '—';

    // ── COVER PAGE ──────────────────────────────────────────────────────────
    const INDIGO: [number, number, number] = [79, 70, 229];
    const SLATE: [number, number, number] = [100, 116, 139];

    // Top accent bar
    doc.rect(0, 0, PAGE_W, 8).fillColor('rgb(79,70,229)').fill();

    doc.moveDown(3);

    // Title
    doc.fontSize(28).font('Helvetica-Bold').fillColor('#1e1b4b')
       .text('Synthesis Log', MARGIN, 80, { align: 'center', width: CONTENT_W });
    const isIBTok = data.reportType === 'ib-tok';
    doc.fontSize(14).font('Helvetica').fillColor('#6366f1')
       .text(isIBTok ? 'IB Theory of Knowledge — Spiral Reflection Report' : 'Spiral Reflection Report', MARGIN, 116, { align: 'center', width: CONTENT_W });

    // Thin rule
    doc.moveTo(MARGIN + 60, 140).lineTo(PAGE_W - MARGIN - 60, 140)
       .strokeColor('#c7d2fe').lineWidth(1).stroke();

    // Meta block
    const metaY = 158;
    doc.fontSize(10).font('Helvetica').fillColor('#374151');
    doc.text(`Term Lists:  ${listNames.join(' · ')}`, MARGIN, metaY, { width: CONTENT_W, align: 'center' });
    doc.text(`Reflection Depth:  ${data.reflectionDepth}-Step`, MARGIN, metaY + 16, { width: CONTENT_W, align: 'center' });
    doc.text(`Start Date:  ${startDateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, MARGIN, metaY + 32, { width: CONTENT_W, align: 'center' });
    doc.text(`Report Generated:  ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, MARGIN, metaY + 48, { width: CONTENT_W, align: 'center' });

    // ── Summary stats cards ─────────────────────────────────────────────────
    const cardY = 240;
    const cardW = (CONTENT_W - 12) / 3;
    const cards = [
      { label: 'Days Completed', value: String(completedDays), sub: `of ${totalDays} total` },
      { label: 'Completion Rate', value: `${Math.round(completionPct * 100)}%`, sub: 'reflections saved' },
      { label: 'Reflection Depth', value: `${data.reflectionDepth}-Step`, sub: depthConfig.map(s => s.shortLabel).join(' → ') },
    ];
    cards.forEach((card, i) => {
      const cx = MARGIN + i * (cardW + 6);
      doc.rect(cx, cardY, cardW, 70).fillColor('#f8fafc').fill();
      doc.rect(cx, cardY, cardW, 70).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
      doc.rect(cx, cardY, cardW, 3).fillColor('#6366f1').fill();
      doc.fontSize(20).font('Helvetica-Bold').fillColor('#1e1b4b')
         .text(card.value, cx, cardY + 14, { width: cardW, align: 'center' });
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#6366f1')
         .text(card.label.toUpperCase(), cx, cardY + 38, { width: cardW, align: 'center' });
      doc.fontSize(8).font('Helvetica').fillColor('#94a3b8')
         .text(card.sub, cx, cardY + 52, { width: cardW, align: 'center' });
    });

    // ── Completion progress bar ─────────────────────────────────────────────
    const pbY = cardY + 84;
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#374151')
       .text('SPIRAL PROGRESS', MARGIN, pbY);
    drawProgressBar(doc, MARGIN, pbY + 14, CONTENT_W, 10, completionPct, '#6366f1');
    doc.fontSize(8).font('Helvetica').fillColor('#6b7280')
       .text(`${completedDays} of ${totalDays} days`, MARGIN, pbY + 28, { width: CONTENT_W, align: 'right' });

    // ── Per-stage average ratings ───────────────────────────────────────────
    const ratingY = pbY + 50;
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#374151')
       .text('AVERAGE IMPORTANCE RATINGS BY STAGE', MARGIN, ratingY);
    depthConfig.forEach((stage, i) => {
      const rowY = ratingY + 16 + i * 22;
      const avg = parseFloat(avgRating(ratingTotals[stage.id]));
      const pct = isNaN(avg) ? 0 : avg / 10;
      doc.fontSize(9).font('Helvetica').fillColor('#374151')
         .text(stage.label, MARGIN, rowY + 2, { width: 110 });
      drawProgressBar(doc, MARGIN + 115, rowY, CONTENT_W - 150, 12, pct, '#818cf8');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#4f46e5')
         .text(isNaN(avg) ? '—' : avg.toFixed(1), MARGIN + CONTENT_W - 28, rowY + 1, { width: 28, align: 'right' });
    });

    // ── Bottom accent ───────────────────────────────────────────────────────
    doc.rect(0, doc.page.height - 8, PAGE_W, 8).fillColor('#6366f1').fill();

    // ══════════════════════════════════════════════════════════════════════
    // DAILY ENTRIES — one section per day that has reflections
    // ══════════════════════════════════════════════════════════════════════
    const sortedDays = Object.keys(data.reflections)
      .map(Number)
      .sort((a, b) => a - b);

    for (const day of sortedDays) {
      const dayData = data.reflections[day];
      const hasContent = stageIds.some(id => getText(dayData[id]).trim().length > 0);
      if (!hasContent) continue;

      doc.addPage();
      doc.rect(0, 0, PAGE_W, 8).fillColor('#6366f1').fill();

      // Determine which terms are active for this day
      const stages = getStagesForDay(allTerms, day, data.reflectionDepth);

      // Find the list for this day
      let listName = data.segments[0]?.listName || '';
      let listHue = data.segments[0]?.listHue || 220;
      for (let i = data.segments.length - 1; i >= 0; i--) {
        if (day >= data.segments[i].startDay) {
          listName = data.segments[i].listName;
          listHue = data.segments[i].listHue;
          break;
        }
      }
      const [lr, lg, lb] = hslToRgb(listHue);
      const accentHex = `#${lr.toString(16).padStart(2,'0')}${lg.toString(16).padStart(2,'0')}${lb.toString(16).padStart(2,'0')}`;

      // Day header
      const dayDate = new Date(startDateObj);
      dayDate.setDate(dayDate.getDate() + day - 1);
      const dateStr = dayDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

      doc.rect(MARGIN, 20, CONTENT_W, 44).fillColor('#f8fafc').fill();
      doc.rect(MARGIN, 20, 4, 44).fillColor(accentHex).fill();

      doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e1b4b')
         .text(`Day ${day}`, MARGIN + 12, 26, { continued: true })
         .font('Helvetica').fontSize(10).fillColor('#6b7280')
         .text(`   ${dateStr}`);
      doc.fontSize(9).font('Helvetica').fillColor('#94a3b8')
         .text(listName, MARGIN + 12, 44);

      let curY = 76;

      // Render each stage
      for (const stageId of stageIds) {
        const stageCfg = depthConfig.find(s => s.id === stageId);
        if (!stageCfg) continue;

        const rawVal = dayData[stageId];
        const text = getText(rawVal).trim();
        const rating = getRating(rawVal);
        const term = stages[stageId];

        // Check page overflow
        if (curY > doc.page.height - 120) {
          doc.addPage();
          doc.rect(0, 0, PAGE_W, 8).fillColor('#6366f1').fill();
          curY = 30;
        }

        // Stage label pill
        doc.rect(MARGIN, curY, CONTENT_W, 20).fillColor('#f1f5f9').fill();
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#4f46e5')
           .text(stageCfg.label.toUpperCase(), MARGIN + 8, curY + 6, { continued: true });
        if (term) {
          doc.font('Helvetica').fillColor('#64748b')
             .text(`   ·   ${term.term}`);
        } else {
          doc.text('');
        }
        curY += 22;

        // Stage prompt (italic, muted)
        if (stageCfg.placeholder) {
          doc.fontSize(8).font('Helvetica-Oblique').fillColor('#94a3b8')
             .text(stageCfg.placeholder, MARGIN + 8, curY, { width: CONTENT_W - 16 });
          curY += doc.heightOfString(stageCfg.placeholder, { width: CONTENT_W - 16 }) + 6;
        }

        if (text) {
          // Reflection text box
          doc.fontSize(10);
          const textHeight = Math.min(doc.heightOfString(text, { width: CONTENT_W - 16 }) + 12, 200);
          doc.rect(MARGIN, curY, CONTENT_W, textHeight).fillColor('#ffffff').fill();
          doc.rect(MARGIN, curY, CONTENT_W, textHeight).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
          doc.fontSize(10).font('Helvetica').fillColor('#1e293b')
             .text(text, MARGIN + 8, curY + 6, { width: CONTENT_W - 16 });
          curY += textHeight + 4;

          // Rating row
          if (rating > 0) {
            doc.fontSize(8).font('Helvetica').fillColor('#94a3b8')
               .text('Importance:', MARGIN, curY + 2, { continued: true });
            drawRatingDots(doc, MARGIN + 58, curY + 5, rating);
            doc.fontSize(8).font('Helvetica-Bold').fillColor('#4f46e5')
               .text(`  ${rating}/10`, MARGIN + 58 + 10 * 8 + 4, curY + 2);
            curY += 18;
          }
        } else {
          doc.fontSize(9).font('Helvetica-Oblique').fillColor('#cbd5e1')
             .text('No reflection recorded for this stage.', MARGIN + 8, curY + 4);
          curY += 20;
        }

        curY += 8; // gap between stages
      }

      // Bottom accent
      doc.rect(0, doc.page.height - 8, PAGE_W, 8).fillColor('#6366f1').fill();
    }

    // ══════════════════════════════════════════════════════════════════════
    // MOTION PROPOSALS SUMMARY PAGE
    // ══════════════════════════════════════════════════════════════════════
    const motionStageId = depthConfig[depthConfig.length - 1]?.id || 'motion';
    const motionEntries: Array<{ day: number; term: string; text: string; rating: number; listName: string }> = [];

    for (const day of sortedDays) {
      const dayData = data.reflections[day];
      const raw = dayData[motionStageId];
      const text = getText(raw).trim();
      if (!text) continue;
      const stages = getStagesForDay(allTerms, day, data.reflectionDepth);
      const term = stages[motionStageId]?.term || '—';
      let ln = data.segments[0]?.listName || '';
      for (let i = data.segments.length - 1; i >= 0; i--) {
        if (day >= data.segments[i].startDay) { ln = data.segments[i].listName; break; }
      }
      motionEntries.push({ day, term, text, rating: getRating(raw), listName: ln });
    }

    if (motionEntries.length > 0) {
      doc.addPage();
      doc.rect(0, 0, PAGE_W, 8).fillColor('#6366f1').fill();

      doc.fontSize(18).font('Helvetica-Bold').fillColor('#1e1b4b')
         .text('Motion Proposals', MARGIN, 24, { width: CONTENT_W });
      doc.fontSize(10).font('Helvetica').fillColor('#6b7280')
         .text('Action items and applications from the final reflection stage', MARGIN, 46, { width: CONTENT_W });
      doc.moveTo(MARGIN, 62).lineTo(PAGE_W - MARGIN, 62).strokeColor('#e2e8f0').lineWidth(1).stroke();

      let curY = 72;
      motionEntries.forEach((entry, idx) => {
        if (curY > doc.page.height - 100) {
          doc.addPage();
          doc.rect(0, 0, PAGE_W, 8).fillColor('#6366f1').fill();
          curY = 24;
        }
        // Index badge
        doc.circle(MARGIN + 8, curY + 8, 8).fillColor('#6366f1').fill();
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff')
           .text(String(idx + 1), MARGIN + 4, curY + 4, { width: 16, align: 'center' });

        doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e1b4b')
           .text(entry.term, MARGIN + 22, curY, { continued: true });
        doc.fontSize(9).font('Helvetica').fillColor('#94a3b8')
           .text(`   Day ${entry.day} · ${entry.listName}`);
        curY += 16;

        if (entry.rating > 0) {
          drawRatingDots(doc, MARGIN + 22, curY + 4, entry.rating);
          doc.fontSize(8).font('Helvetica-Bold').fillColor('#4f46e5')
             .text(`${entry.rating}/10`, MARGIN + 22 + 10 * 8 + 4, curY + 2);
          curY += 16;
        }

        doc.fontSize(10);
        const textH = Math.min(doc.heightOfString(entry.text, { width: CONTENT_W - 22 }) + 10, 150);
        doc.rect(MARGIN + 22, curY, CONTENT_W - 22, textH).fillColor('#f8fafc').fill();
        doc.rect(MARGIN + 22, curY, 3, textH).fillColor('#818cf8').fill();
        doc.fontSize(10).font('Helvetica').fillColor('#1e293b')
           .text(entry.text, MARGIN + 30, curY + 5, { width: CONTENT_W - 36 });
        curY += textH + 14;
      });

      doc.rect(0, doc.page.height - 8, PAGE_W, 8).fillColor('#6366f1').fill();
    }

    // ══════════════════════════════════════════════════════════════════════
    // IB TOK ASSESSMENT PATHWAYS PAGE (only for ib-tok report type)
    // ══════════════════════════════════════════════════════════════════════
    if (data.reportType === 'ib-tok') {
      // Build termRatings from reflections data
      const termRatings: Record<string, Record<string, number | null>> = {};
      for (const [dayNum, dayData] of Object.entries(data.reflections)) {
        const day = Number(dayNum);
        const stages = getStagesForDay(allTerms, day, data.reflectionDepth);
        for (const [stageId, queuedTerm] of Object.entries(stages)) {
          if (!queuedTerm) continue;
          const term = queuedTerm.term;
          const rawVal = dayData[stageId];
          const rating = getRating(rawVal);
          if (!termRatings[term]) termRatings[term] = {};
          if (rating > 0) {
            const existing = termRatings[term][stageId];
            termRatings[term][stageId] = existing == null ? rating : Math.max(existing, rating);
          } else if (!(stageId in termRatings[term])) {
            termRatings[term][stageId] = null;
          }
        }
      }

      const rec = generateRecommendations(termRatings);
      const hasPathwayData = rec.topTerms.some(t => t.weightedScore > 0);

      doc.addPage();
      doc.rect(0, 0, PAGE_W, 8).fillColor('#4338ca').fill();

      // Page header
      doc.fontSize(20).font('Helvetica-Bold').fillColor('#1e1b4b')
         .text('IB TOK Assessment Pathways', MARGIN, 24, { width: CONTENT_W });
      doc.fontSize(10).font('Helvetica').fillColor('#6b7280')
         .text('Concept strength analysis, AOK connections, and assessment guidance', MARGIN, 48, { width: CONTENT_W });
      doc.moveTo(MARGIN, 64).lineTo(PAGE_W - MARGIN, 64).strokeColor('#e0e7ff').lineWidth(1).stroke();

      let curY = 76;

      if (!hasPathwayData) {
        doc.fontSize(10).font('Helvetica-Oblique').fillColor('#94a3b8')
           .text('No reflection ratings recorded yet. Rate your reflections (1–10) to unlock pathway recommendations.', MARGIN, curY, { width: CONTENT_W });
      } else {
        // ── AOK Heat Map ──────────────────────────────────────────────────────
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#312e81')
           .text('Areas of Knowledge — Engagement Heat Map', MARGIN, curY);
        doc.fontSize(8).font('Helvetica').fillColor('#94a3b8')
           .text('Based on weighted concept ratings across all stages', MARGIN, curY + 14);
        curY += 30;

        const aokColors: Record<string, string> = {
          'Natural Sciences': '#10b981',
          'Human Sciences': '#14b8a6',
          'History': '#f59e0b',
          'The Arts': '#f43f5e',
          'Mathematics': '#6366f1',
          'Language & Literature': '#8b5cf6',
          'Ethics': '#f97316',
          'Religious Knowledge': '#0ea5e9',
        };

        for (const { aok, pct } of rec.aokScores.slice(0, 8)) {
          const barColor = aokColors[aok] ?? '#6366f1';
          doc.fontSize(9).font('Helvetica').fillColor('#374151')
             .text(aok, MARGIN, curY + 2, { width: 130 });
          drawProgressBar(doc, MARGIN + 135, curY, CONTENT_W - 175, 12, pct / 100, barColor);
          doc.fontSize(9).font('Helvetica-Bold').fillColor(barColor)
             .text(`${pct}%`, MARGIN + CONTENT_W - 34, curY + 1, { width: 34, align: 'right' });
          curY += 20;
        }

        curY += 10;
        doc.moveTo(MARGIN, curY).lineTo(PAGE_W - MARGIN, curY).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
        curY += 14;

        // ── Top Concepts ──────────────────────────────────────────────────────
        if (rec.topTerms.filter(t => t.weightedScore > 0).length > 0) {
          doc.fontSize(11).font('Helvetica-Bold').fillColor('#312e81')
             .text('Strongest Concepts (Weighted Score)', MARGIN, curY);
          curY += 18;

          const topFiltered = rec.topTerms.filter(t => t.weightedScore > 0).slice(0, 5);
          const maxScore = Math.max(...topFiltered.map(t => t.weightedScore), 1);
          for (const { term, weightedScore, pathway } of topFiltered) {
            const pct = weightedScore / maxScore;
            doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e1b4b')
               .text(term, MARGIN, curY + 1, { width: 120 });
            drawProgressBar(doc, MARGIN + 125, curY, CONTENT_W - 185, 10, pct, '#818cf8');
            doc.fontSize(8).font('Helvetica').fillColor('#6b7280')
               .text(weightedScore.toFixed(1), MARGIN + CONTENT_W - 54, curY + 1, { width: 30, align: 'right' });
            if (pathway) {
              doc.fontSize(7).font('Helvetica').fillColor('#94a3b8')
                 .text(pathway.aoks.slice(0, 2).join(' · '), MARGIN + CONTENT_W - 54, curY + 11, { width: 54, align: 'right' });
            }
            curY += 22;
          }

          curY += 8;
          doc.moveTo(MARGIN, curY).lineTo(PAGE_W - MARGIN, curY).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
          curY += 14;
        }

        // ── Exhibition Prompts ────────────────────────────────────────────────
        if (rec.exhibitionPrompts.length > 0) {
          if (curY > doc.page.height - 160) {
            doc.addPage();
            doc.rect(0, 0, PAGE_W, 8).fillColor('#4338ca').fill();
            curY = 24;
          }
          doc.fontSize(11).font('Helvetica-Bold').fillColor('#312e81')
             .text('Exhibition Object Directions', MARGIN, curY);
          doc.fontSize(8).font('Helvetica-Oblique').fillColor('#94a3b8')
             .text('Inspiration only — choose your own object that connects to these themes.', MARGIN, curY + 14);
          curY += 30;

          for (const { prompt, term, aok } of rec.exhibitionPrompts) {
            if (curY > doc.page.height - 80) {
              doc.addPage();
              doc.rect(0, 0, PAGE_W, 8).fillColor('#4338ca').fill();
              curY = 24;
            }
            const promptH = Math.min(doc.fontSize(9).heightOfString(prompt, { width: CONTENT_W - 16 }) + 20, 80);
            doc.rect(MARGIN, curY, CONTENT_W, promptH).fillColor('#f8fafc').fill();
            doc.rect(MARGIN, curY, 3, promptH).fillColor('#6366f1').fill();
            doc.fontSize(9).font('Helvetica').fillColor('#1e293b')
               .text(prompt, MARGIN + 10, curY + 6, { width: CONTENT_W - 20 });
            doc.fontSize(7).font('Helvetica').fillColor('#94a3b8')
               .text(`via ${term} · ${aok}`, MARGIN + 10, curY + promptH - 12);
            curY += promptH + 8;
          }

          curY += 6;
          doc.moveTo(MARGIN, curY).lineTo(PAGE_W - MARGIN, curY).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
          curY += 14;
        }

        // ── Essay KQ Frames ───────────────────────────────────────────────────
        if (rec.essayKQFrames.length > 0) {
          if (curY > doc.page.height - 160) {
            doc.addPage();
            doc.rect(0, 0, PAGE_W, 8).fillColor('#4338ca').fill();
            curY = 24;
          }
          doc.fontSize(11).font('Helvetica-Bold').fillColor('#312e81')
             .text('Essay Knowledge Question Frames', MARGIN, curY);
          doc.fontSize(8).font('Helvetica-Oblique').fillColor('#94a3b8')
             .text('Adapt these frames to your own prescribed title and argument.', MARGIN, curY + 14);
          curY += 30;

          for (const { frame, term, aok } of rec.essayKQFrames) {
            if (curY > doc.page.height - 80) {
              doc.addPage();
              doc.rect(0, 0, PAGE_W, 8).fillColor('#4338ca').fill();
              curY = 24;
            }
            const frameH = Math.min(doc.fontSize(9).heightOfString(frame, { width: CONTENT_W - 16 }) + 20, 80);
            doc.rect(MARGIN, curY, CONTENT_W, frameH).fillColor('#f0f4ff').fill();
            doc.rect(MARGIN, curY, 3, frameH).fillColor('#818cf8').fill();
            doc.fontSize(9).font('Helvetica-Oblique').fillColor('#1e293b')
               .text(`"${frame}"`, MARGIN + 10, curY + 6, { width: CONTENT_W - 20 });
            doc.fontSize(7).font('Helvetica').fillColor('#94a3b8')
               .text(`via ${term} · ${aok}`, MARGIN + 10, curY + frameH - 12);
            curY += frameH + 8;
          }
        }
      }

      doc.rect(0, doc.page.height - 8, PAGE_W, 8).fillColor('#4338ca').fill();
    }

    // ── Page numbers ────────────────────────────────────────────────────────
    const totalPages = (doc as any).bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).font('Helvetica').fillColor('#94a3b8')
         .text(`Page ${i + 1} of ${totalPages}`, MARGIN, doc.page.height - 22, { width: CONTENT_W, align: 'center' });
    }

    doc.end();
  });
}
