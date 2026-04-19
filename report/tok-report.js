const fileInput = document.getElementById("fileInput");
const printBtn = document.getElementById("printBtn");
const reportRoot = document.getElementById("reportRoot");

const SLOT_OLDEST_TO_NEWEST = ["motion", "amalgam", "abstract", "concrete", "history"];

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

function renderReport(data, fileName = "Loaded JSON") {
  const parsed = analyzeSpiral(data);
  if (!parsed.ok) {
    reportRoot.innerHTML = `<section class="card"><h2>Could not analyze file</h2><p>${escapeHtml(parsed.message)}</p></section>`;
    return;
  }

  const {
    terms,
    termEntries,
    allEntries,
    topEntries,
    topTerms,
    prompts,
    fileMeta
  } = parsed;

  reportRoot.innerHTML = `
    <section class="print-header">
      <h1>TOK Spiral Reflection Report</h1>
      <p>${escapeHtml(fileName)}</p>
    </section>

    <section class="card span-12">
      <h2>Report overview</h2>
      <p class="section-subtitle">Generated from <strong>${escapeHtml(fileName)}</strong></p>
      <div class="report-grid">
        <div class="stat span-3">
          <h3>Total terms</h3>
          <div class="value">${terms.length}</div>
        </div>
        <div class="stat span-3">
          <h3>Total scored reflections</h3>
          <div class="value">${allEntries.length}</div>
        </div>
        <div class="stat span-3">
          <h3>Highest rating found</h3>
          <div class="value">${fileMeta.maxRating}</div>
        </div>
        <div class="stat span-3">
          <h3>Average rating</h3>
          <div class="value">${fileMeta.avgRating.toFixed(2)}</div>
        </div>
      </div>
      <div class="term-chip-list">
        ${topTerms.slice(0, 8).map(t => `<span class="term-chip">${escapeHtml(t.term)} · avg ${t.avg.toFixed(2)} · ${t.count} entries</span>`).join("")}
      </div>
    </section>

    <section class="card">
      <h2>Strongest concepts</h2>
      <p class="section-subtitle">Average score and entry count based on aligned reflections.</p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Concept</th>
              <th>Average Rating</th>
              <th>Highest</th>
              <th>Entries</th>
              <th>Most Common Boxes</th>
            </tr>
          </thead>
          <tbody>
            ${topTerms.map(row => `
              <tr>
                <td><strong>${escapeHtml(row.term)}</strong></td>
                <td>${row.avg.toFixed(2)}</td>
                <td>${row.max}</td>
                <td>${row.count}</td>
                <td>${escapeHtml(row.topSlots.join(", "))}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>

    <section class="card">
      <h2>Highest-rated reflections</h2>
      <p class="section-subtitle">These are the entries most worth revisiting for TOK claims, knowledge questions, or essay direction.</p>
      ${topEntries.map(renderQuoteCard).join("")}
    </section>

    <section class="card">
      <h2>Reflection patterns by term</h2>
      <p class="section-subtitle">A compact view of where each concept came alive most strongly.</p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Term</th>
              <th>Best Box</th>
              <th>Best Rating</th>
              <th>Why it stands out</th>
            </tr>
          </thead>
          <tbody>
            ${topTerms.map(row => {
              const entry = termEntries[row.term].slice().sort((a,b)=> b.rating - a.rating || a.day - b.day)[0];
              return `
              <tr>
                <td><strong>${escapeHtml(row.term)}</strong></td>
                <td>${escapeHtml(entry.slotLabel)}</td>
                <td>${entry.rating}</td>
                <td>${escapeHtml(shorten(entry.text, 180))}</td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>
    </section>

    <section class="card">
      <h2>Possible TOK / EE prompt seeds</h2>
      <p class="section-subtitle">These are not final titles. They are starting points built from the highest-rated themes in the spiral.</p>
      ${prompts.map(p => `<div class="prompt"><strong>${escapeHtml(p.title)}</strong><br>${escapeHtml(p.body)}</div>`).join("")}
    </section>

    <section class="card">
      <h2>Next moves</h2>
      <ol>
        <li>Circle the 3–5 concepts with the strongest average ratings and the richest language.</li>
        <li>Compare whether those strong moments came from lived examples, abstract thinking, or movement in thinking.</li>
        <li>Draft one knowledge question that links two of the strongest concepts.</li>
        <li>Use the top reflection language as raw material for an extended essay or exhibition planning document.</li>
      </ol>
    </section>
  `;
}

function renderQuoteCard(entry) {
  return `
    <article class="quote-card">
      <div class="quote-meta">
        <span class="badge">Rating ${entry.rating}</span>
        <span>Term: <strong>${escapeHtml(entry.term)}</strong></span>
        <span>Box: <strong>${escapeHtml(entry.slotLabel)}</strong></span>
        <span>Day ${entry.day}</span>
      </div>
      <div>${escapeHtml(entry.text)}</div>
    </article>
  `;
}

function analyzeSpiral(data) {
  if (!data?.spiral?.segments?.[0]?.terms?.length) {
    return { ok: false, message: "Could not find spiral terms in the file." };
  }
  const reflectionDepth = data?.spiral?.reflectionDepth || 5;
  const terms = data.spiral.segments[0].terms;
  const reflections = data.reflections || {};
  const dayKeys = Object.keys(reflections)
    .filter(k => /^day-\d+$/.test(k))
    .sort((a,b) => getDayNum(a) - getDayNum(b));

  if (!dayKeys.length) {
    return { ok: false, message: "Could not find day-based reflections in the file." };
  }

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
      const record = {
        day,
        term,
        slot,
        slotLabel: capitalize(slot),
        text: entry.text,
        rating: entry.rating
      };
      if (!termEntries[term]) termEntries[term] = [];
      termEntries[term].push(record);
      allEntries.push(record);
    });
  }

  if (!allEntries.length) {
    return { ok: false, message: "No usable scored reflections were found." };
  }

  const maxRating = Math.max(...allEntries.map(e => e.rating));
  const avgRating = allEntries.reduce((a,b) => a + b.rating, 0) / allEntries.length;

  const topEntries = allEntries
    .slice()
    .sort((a,b) => b.rating - a.rating || textDepthScore(b.text) - textDepthScore(a.text) || a.day - b.day)
    .slice(0, 18);

  const topTerms = Object.entries(termEntries)
    .map(([term, entries]) => {
      const avg = entries.reduce((a,b) => a + b.rating, 0) / entries.length;
      const max = Math.max(...entries.map(e => e.rating));
      const slotCounts = {};
      entries.forEach(e => slotCounts[e.slotLabel] = (slotCounts[e.slotLabel] || 0) + 1);
      const topSlots = Object.entries(slotCounts).sort((a,b) => b[1] - a[1]).map(x => x[0]).slice(0, 2);
      return { term, avg, max, count: entries.length, topSlots };
    })
    .sort((a,b) => b.avg - a.avg || b.max - a.max || a.term.localeCompare(b.term));

  const prompts = buildPrompts(topTerms, termEntries);

  return {
    ok: true,
    terms,
    termEntries,
    allEntries,
    topEntries,
    topTerms,
    prompts,
    fileMeta: { maxRating, avgRating }
  };
}

function normalizeEntry(value) {
  if (!value) return null;
  if (typeof value === "string") return { text: value, rating: 0 };
  if (typeof value === "object" && typeof value.text === "string") {
    return { text: value.text, rating: Number(value.rating || 0) };
  }
  return null;
}

function buildPrompts(topTerms, termEntries) {
  const best = topTerms.slice(0, 6).map(t => t.term);
  const prompts = [];

  if (best.length >= 2) {
    prompts.push({
      title: `How do ${best[0]} and ${best[1]} depend on one another in the making of knowledge?`,
      body: `Use the strongest reflections on ${best[0]} and ${best[1]} to test whether one concept supports, limits, or corrects the other.`
    });
  }
  if (best.length >= 3) {
    prompts.push({
      title: `To what extent is ${best[2].toLowerCase()} shaped by perspective rather than discovered directly?`,
      body: `Build from the highest-rated language in the report and compare lived examples with more abstract reflections.`
    });
  }
  prompts.push({
    title: `When does confidence become epistemically dangerous?`,
    body: `Use strong entries on certainty, authority, trust, evidence, or doubt if they appear in the report to explore where certainty stops being productive.`
  });
  prompts.push({
    title: `What turns information into meaning?`,
    body: `Follow the strongest concept trail through language, interpretation, perspective, and experience to develop a more focused research question.`
  });
  prompts.push({
    title: `How reliable is lived experience as a route to knowledge?`,
    body: `Use the report's highest-rated concrete and motion entries to compare personal immediacy with the need for justification and evidence.`
  });

  return prompts.slice(0, 5);
}

function getDayNum(key) {
  return Number(String(key).replace("day-", ""));
}

function shorten(text, n) {
  return text.length <= n ? text : text.slice(0, n - 1).trimEnd() + "…";
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function textDepthScore(text) {
  return Math.min(text.length, 300);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
