const fileInput = document.getElementById("fileInput");
const printBtn = document.getElementById("printBtn");
const themeBtn = document.getElementById("themeBtn");
const expandBtn = document.getElementById("expandBtn");
const reportRoot = document.getElementById("reportRoot");
const rootEl = document.documentElement;

const SLOT_OLDEST_TO_NEWEST = ["motion", "amalgam", "abstract", "concrete", "history"];
let chartState = null;
let allExpanded = false;

initTheme();

fileInput?.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  try {
    const data = JSON.parse(text);
    renderReport(data, file.name);
  } catch (err) {
    reportRoot.innerHTML = `<section class="card"><h2>Could not read file</h2><p>${escapeHtml(err.message)}</p></section>`;
  }
});

printBtn?.addEventListener("click", () => window.print());

themeBtn?.addEventListener("click", () => {
  const next = rootEl.getAttribute("data-theme") === "dark" ? "light" : "dark";
  rootEl.setAttribute("data-theme", next);
  localStorage.setItem("tok-report-theme", next);
  redrawStoredCharts();
});

expandBtn?.addEventListener("click", () => {
  allExpanded = !allExpanded;
  document.querySelectorAll("details.module").forEach(d => d.open = allExpanded);
  expandBtn.textContent = allExpanded ? "Collapse All" : "Expand All";
});

window.addEventListener("resize", () => redrawStoredCharts());

function initTheme() {
  const saved = localStorage.getItem("tok-report-theme");
  if (saved === "dark" || saved === "light") {
    rootEl.setAttribute("data-theme", saved);
    return;
  }
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  rootEl.setAttribute("data-theme", prefersDark ? "dark" : "light");
}

function renderReport(data, fileName = "Loaded JSON") {
  const parsed = analyzeSpiral(data);
  if (!parsed.ok) {
    reportRoot.innerHTML = `<section class="card"><h2>Could not analyze file</h2><p>${escapeHtml(parsed.message)}</p></section>`;
    return;
  }

  const { terms, termEntries, allEntries, topEntries, topTerms, prompts, fileMeta, slotStats } = parsed;
  allExpanded = false;
  expandBtn.textContent = "Expand All";

  reportRoot.innerHTML = `
    <section class="print-header">
      <h1>TOK Spiral Reflection Report</h1>
      <p>${escapeHtml(fileName)}</p>
    </section>

    <section class="card">
      <h2>Report overview</h2>
      <p class="section-subtitle">Generated from <strong>${escapeHtml(fileName)}</strong></p>
      <div class="overview-grid">
        <div class="stat"><div class="stat-label">Total terms</div><div class="stat-value">${terms.length}</div></div>
        <div class="stat"><div class="stat-label">Total scored reflections</div><div class="stat-value">${allEntries.length}</div></div>
        <div class="stat"><div class="stat-label">Highest rating found</div><div class="stat-value">${fileMeta.maxRating}</div></div>
        <div class="stat"><div class="stat-label">Average rating</div><div class="stat-value">${fileMeta.avgRating.toFixed(2)}</div></div>
      </div>
      <div class="term-chip-list">
        ${topTerms.slice(0, 8).map(t => `<span class="term-chip">${escapeHtml(t.term)} · avg ${t.avg.toFixed(2)} · ${t.count} entries</span>`).join("")}
      </div>
    </section>

    <section class="card">
      <h2>Charts</h2>
      <p class="section-subtitle">Quick visual summaries without relying on fragile side-by-side tables.</p>
      <div class="chart-stack">
        <div class="chart-card">
          <h3>Strongest concepts</h3>
          <div class="chart-wrap"><canvas id="termsChart" height="320"></canvas></div>
        </div>
        <div class="chart-card">
          <h3>Average by reflection box</h3>
          <div class="chart-wrap"><canvas id="slotsChart" height="280"></canvas></div>
        </div>
      </div>
    </section>

    <section class="card">
      <h2>Strongest concepts</h2>
      <p class="section-subtitle">Each concept is its own module. Open only the ones you want.</p>
      <div class="accordion-list">
        ${topTerms.map((row, idx) => {
          const entry = termEntries[row.term].slice().sort((a,b)=> b.rating - a.rating || b.text.length - a.text.length)[0];
          return `
            <details class="module" ${idx < 2 ? "open" : ""}>
              <summary class="module-summary">
                <div class="summary-left">
                  <h3>${escapeHtml(row.term)}</h3>
                  <p>${escapeHtml(shorten(entry.text, 120))}</p>
                </div>
                <div class="summary-right">
                  <span class="badge">avg ${row.avg.toFixed(2)}</span>
                  <span class="badge gold">max ${row.max}</span>
                  <span class="badge">${row.count} entries</span>
                  <span class="chevron">▶</span>
                </div>
              </summary>
              <div class="module-content">
                <div class="metric-row">
                  <div class="metric"><div class="metric-label">Strongest box</div><div class="metric-value">${escapeHtml(entry.slotLabel)}</div></div>
                  <div class="metric"><div class="metric-label">Highest rating</div><div class="metric-value">${row.max}</div></div>
                  <div class="metric"><div class="metric-label">Frequent boxes</div><div class="metric-value">${escapeHtml(row.topSlots.join(", "))}</div></div>
                </div>
                <div class="text-block">${escapeHtml(entry.text)}</div>
              </div>
            </details>
          `;
        }).join("")}
      </div>
    </section>

    <section class="card">
      <h2>Highest-rated reflections</h2>
      <p class="section-subtitle">These are the entries most worth revisiting for TOK claims, knowledge questions, or essay direction.</p>
      <div class="accordion-list">
        ${topEntries.map((entry, idx) => `
          <details class="module" ${idx < 3 ? "open" : ""}>
            <summary class="module-summary">
              <div class="summary-left">
                <h3>${escapeHtml(entry.term)} · ${escapeHtml(entry.slotLabel)} · Day ${entry.day}</h3>
                <p>${escapeHtml(shorten(entry.text, 130))}</p>
              </div>
              <div class="summary-right">
                <span class="badge gold">Rating ${entry.rating}</span>
                <span class="chevron">▶</span>
              </div>
            </summary>
            <div class="module-content">
              <div class="text-block">${escapeHtml(entry.text)}</div>
            </div>
          </details>
        `).join("")}
      </div>
    </section>

    <section class="card">
      <h2>Reflection patterns by term</h2>
      <p class="section-subtitle">Short stackable modules instead of long narrow tables.</p>
      <div class="pattern-grid">
        ${topTerms.map(row => {
          const entry = termEntries[row.term].slice().sort((a,b)=> b.rating - a.rating || a.day - b.day)[0];
          return `
            <div class="pattern-card">
              <div class="pattern-top">
                <h3>${escapeHtml(row.term)}</h3>
                <span class="badge">${escapeHtml(entry.slotLabel)}</span>
              </div>
              <p class="muted">Best rating: ${entry.rating}</p>
              <p>${escapeHtml(shorten(entry.text, 140))}</p>
            </div>
          `;
        }).join("")}
      </div>
    </section>

    <section class="card">
      <h2>Possible TOK / EE prompt seeds</h2>
      <p class="section-subtitle">Starting points built from the highest-rated themes in the spiral.</p>
      <div class="prompt-grid">
        ${prompts.map(p => `
          <div class="prompt-card">
            <h3>${escapeHtml(p.title)}</h3>
            <p>${escapeHtml(p.body)}</p>
          </div>
        `).join("")}
      </div>
    </section>

    <section class="card">
      <h2>Next moves</h2>
      <div class="stack">
        <div class="pattern-card"><strong>1.</strong> Circle the 3–5 concepts with the strongest average ratings and the richest language.</div>
        <div class="pattern-card"><strong>2.</strong> Compare whether those strong moments came from lived examples, abstract thinking, or movement in thinking.</div>
        <div class="pattern-card"><strong>3.</strong> Draft one knowledge question that links two of the strongest concepts.</div>
        <div class="pattern-card"><strong>4.</strong> Use the top reflection language as raw material for an extended essay or exhibition planning document.</div>
      </div>
    </section>
  `;

  chartState = {
    terms: topTerms.slice(0, 10).map(t => ({ label: t.term, value: t.avg })),
    slots: slotStats.map(s => ({ label: s.slot, value: s.avg }))
  };
  redrawStoredCharts();
}

function redrawStoredCharts() {
  if (!chartState) return;
  drawBarChart("termsChart", chartState.terms, { maxValue: 4, horizontal: true });
  drawBarChart("slotsChart", chartState.slots, { maxValue: 4, horizontal: false });
}

function analyzeSpiral(data) {
  if (!data?.spiral?.segments?.[0]?.terms?.length) {
    return { ok: false, message: "Could not find spiral terms in the file." };
  }
  const reflectionDepth = data?.spiral?.reflectionDepth || 5;
  const terms = data.spiral.segments[0].terms;
  const reflections = data.reflections || {};
  const dayKeys = Object.keys(reflections).filter(k => /^day-\d+$/.test(k)).sort((a,b) => getDayNum(a) - getDayNum(b));
  if (!dayKeys.length) return { ok: false, message: "Could not find day-based reflections in the file." };

  const termEntries = {};
  const allEntries = [];

  for (const key of dayKeys) {
    const day = getDayNum(key);
    const dayRef = reflections[key] || {};
    const activeTerms = terms.slice(Math.max(0, day - reflectionDepth), Math.min(day, terms.length));
    const activeSlots = SLOT_OLDEST_TO_NEWEST.slice(SLOT_OLDEST_TO_NEWEST.length - activeTerms.length);

    activeTerms.forEach((term, i) => {
      const slot = activeSlots[i];
      const entry = normalizeEntry(dayRef[slot]);
      if (!entry) return;
      const record = { day, term, slot, slotLabel: capitalize(slot), text: entry.text, rating: entry.rating };
      if (!termEntries[term]) termEntries[term] = [];
      termEntries[term].push(record);
      allEntries.push(record);
    });
  }

  if (!allEntries.length) return { ok: false, message: "No usable scored reflections were found." };

  const maxRating = Math.max(...allEntries.map(e => e.rating));
  const avgRating = allEntries.reduce((a,b) => a + b.rating, 0) / allEntries.length;

  const topEntries = allEntries.slice().sort((a,b) => b.rating - a.rating || textDepthScore(b.text) - textDepthScore(a.text) || a.day - b.day).slice(0, 18);

  const topTerms = Object.entries(termEntries).map(([term, entries]) => {
    const avg = entries.reduce((a,b) => a + b.rating, 0) / entries.length;
    const max = Math.max(...entries.map(e => e.rating));
    const slotCounts = {};
    entries.forEach(e => slotCounts[e.slotLabel] = (slotCounts[e.slotLabel] || 0) + 1);
    const topSlots = Object.entries(slotCounts).sort((a,b) => b[1] - a[1]).map(x => x[0]).slice(0, 2);
    return { term, avg, max, count: entries.length, topSlots };
  }).sort((a,b) => b.avg - a.avg || b.max - a.max || a.term.localeCompare(b.term));

  const slotStats = SLOT_OLDEST_TO_NEWEST.map(slot => {
    const rows = allEntries.filter(e => e.slot === slot);
    const avg = rows.length ? rows.reduce((a,b) => a + b.rating, 0) / rows.length : 0;
    return { slot: capitalize(slot), avg, count: rows.length };
  });

  const prompts = buildPrompts(topTerms);
  return { ok: true, terms, termEntries, allEntries, topEntries, topTerms, prompts, fileMeta: { maxRating, avgRating }, slotStats };
}

function normalizeEntry(value) {
  if (!value) return null;
  if (typeof value === "string") return { text: value, rating: 0 };
  if (typeof value === "object" && typeof value.text === "string") return { text: value.text, rating: Number(value.rating || 0) };
  return null;
}

function buildPrompts(topTerms) {
  const best = topTerms.slice(0, 6).map(t => t.term);
  const prompts = [];
  if (best.length >= 2) prompts.push({ title: `How do ${best[0]} and ${best[1]} depend on one another in the making of knowledge?`, body: `Use the strongest reflections on ${best[0]} and ${best[1]} to test whether one concept supports, limits, or corrects the other.` });
  if (best.length >= 3) prompts.push({ title: `To what extent is ${best[2].toLowerCase()} shaped by perspective rather than discovered directly?`, body: `Build from the highest-rated language in the report and compare lived examples with more abstract reflections.` });
  prompts.push({ title: `When does confidence become epistemically dangerous?`, body: `Use strong entries on certainty, authority, trust, evidence, or doubt if they appear in the report to explore where certainty stops being productive.` });
  prompts.push({ title: `What turns information into meaning?`, body: `Follow the strongest concept trail through language, interpretation, perspective, and experience to develop a more focused research question.` });
  prompts.push({ title: `How reliable is lived experience as a route to knowledge?`, body: `Use the report's highest-rated concrete and motion entries to compare personal immediacy with the need for justification and evidence.` });
  return prompts.slice(0, 5);
}

function drawBarChart(canvasId, items, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !items?.length) return;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(280, rect.width || 600);
  const height = Math.max(220, options.horizontal === false ? 280 : 320);
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  const styles = getComputedStyle(document.documentElement);
  const ink = styles.getPropertyValue("--ink").trim();
  const muted = styles.getPropertyValue("--muted").trim();
  const line = styles.getPropertyValue("--line").trim();
  const colors = [
    styles.getPropertyValue("--chart-1").trim(),
    styles.getPropertyValue("--chart-2").trim(),
    styles.getPropertyValue("--chart-3").trim(),
    styles.getPropertyValue("--chart-4").trim(),
    styles.getPropertyValue("--chart-5").trim()
  ];

  ctx.font = "12px Arial";
  ctx.textBaseline = "middle";
  const maxValue = options.maxValue || Math.max(...items.map(i => i.value)) || 1;

  if (options.horizontal === false) {
    const left = 38, right = 18, top = 12, bottom = 58;
    const innerW = width - left - right;
    const innerH = height - top - bottom;
    const band = innerW / items.length;
    const barW = band * 0.62;

    ctx.strokeStyle = line;
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(left, top + innerH);
    ctx.lineTo(left + innerW, top + innerH);
    ctx.stroke();

    for (let g = 0; g <= 4; g++) {
      const y = top + innerH - (g / 4) * innerH;
      ctx.strokeStyle = line;
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(left + innerW, y);
      ctx.stroke();
      ctx.fillStyle = muted;
      ctx.fillText(String(g), 12, y);
    }

    items.forEach((item, i) => {
      const x = left + i * band + (band - barW) / 2;
      const h = (item.value / maxValue) * innerH;
      const y = top + innerH - h;
      ctx.fillStyle = colors[i % colors.length];
      roundRect(ctx, x, y, barW, h, 8, true, false);
      ctx.fillStyle = ink;
      ctx.textAlign = "center";
      ctx.fillText(item.value.toFixed(2), x + barW / 2, y - 10);
      ctx.save();
      ctx.translate(x + barW / 2, top + innerH + 18);
      ctx.rotate(-Math.PI / 6);
      ctx.textAlign = "right";
      ctx.fillText(item.label, 0, 0);
      ctx.restore();
    });
    ctx.textAlign = "start";
    return;
  }

  const left = width < 520 ? 86 : 120;
  const right = 18;
  const top = 16;
  const rowH = width < 520 ? 22 : 26;
  const gap = 12;
  const innerW = width - left - right;

  items.forEach((item, i) => {
    const y = top + i * (rowH + gap);
    ctx.fillStyle = muted;
    ctx.textAlign = "left";
    ctx.fillText(item.label, 8, y + rowH / 2);
    ctx.fillStyle = line;
    roundRect(ctx, left, y, innerW, rowH, 10, true, false);
    ctx.fillStyle = colors[i % colors.length];
    roundRect(ctx, left, y, Math.max(12, innerW * (item.value / maxValue)), rowH, 10, true, false);
    ctx.fillStyle = ink;
    ctx.textAlign = "right";
    ctx.fillText(item.value.toFixed(2), width - 4, y + rowH / 2);
  });
  ctx.textAlign = "start";
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function getDayNum(key) { return Number(String(key).replace("day-", "")); }
function shorten(text, n) { return text.length <= n ? text : text.slice(0, n - 1).trimEnd() + "…"; }
function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }
function textDepthScore(text) { return Math.min(text.length, 300); }
function escapeHtml(str) {
  return String(str).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
