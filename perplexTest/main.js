// SynthesisLog static prototype: CSV-driven rotating queue, localStorage persistence.

const TERMS_URL = 'terms.csv';
const STORAGE_KEY = 'synthesisLog_v1';

let termBank = [];          // array of term strings
let totalDays = 0;          // N + 3
let currentDayIndex = 1;    // 1-based

// Utility ---------------------------------------------------------

function $(id) {
  return document.getElementById(id);
}

function setStatus(msg) {
  $('status').textContent = msg || '';
}

function loadCSV(url) {
  return fetch(url)
    .then(r => {
      if (!r.ok) throw new Error('Failed to load ' + url);
      return r.text();
    })
    .then(text => {
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
      if (lines.length <= 1) throw new Error('terms.csv must have a header and at least one term');
      return lines.slice(1); // skip header
    });
}

// Scheduling logic -----------------------------------------------

// For N terms, total days = N + 3.
// Day d (1-based) uses up to 4 terms, depending on d.
// We always introduce a new term if any remain, and each term
// stays for exactly 4 consecutive days, then is retired.

function getQueueForDay(d) {
  const N = termBank.length;
  const queue = [];

  // index of first day a term can appear
  // term i (0-based) is introduced on day (i + 1)
  // and stays on days (i+1 .. i+4)
  for (let i = 0; i < N; i++) {
    const start = i + 1;
    const end = i + 4;
    if (d >= start && d <= end) {
      queue.push(termBank[i]);
    }
  }
  // We want up to last 4, in order oldest->newest
  if (queue.length > 4) {
    return queue.slice(queue.length - 4);
  }
  return queue;
}

function getStagesForDay(d) {
  const queue = getQueueForDay(d);
  // Oldest term is at position 0, newest at last
  // Map to stages: 1=History (newest), 4=Motion (oldest)
  const stages = {
    history: null,
    concrete: null,
    amalgam: null,
    motion: null
  };

  const len = queue.length;
  if (len >= 1) stages.motion = queue[0];
  if (len >= 2) stages.amalgam = queue[1];
  if (len >= 3) stages.concrete = queue[2];
  if (len >= 4) stages.history = queue[3];

  return { queue, stages };
}

// Persistence -----------------------------------------------------

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { reflections: {} };
  } catch (e) {
    return { reflections: {} };
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// key: "day-<d>"
function getReflectionsForDay(state, d) {
  return state.reflections['day-' + d] || {
    history: '',
    concrete: '',
    amalgam: '',
    motion: ''
  };
}

function setReflectionsForDay(state, d, data) {
  state.reflections['day-' + d] = data;
}

// Rendering -------------------------------------------------------

function renderDay(d) {
  if (d < 1 || d > totalDays) {
    setStatus('Day must be between 1 and ' + totalDays);
    return;
  }
  currentDayIndex = d;
  $('dayIndexInput').value = d;

  const { queue, stages } = getStagesForDay(d);
  const state = loadState();
  const refs = getReflectionsForDay(state, d);

  $('termHistory').textContent  = stages.history  || '(no term yet)';
  $('termConcrete').textContent = stages.concrete || '(no term yet)';
  $('termAmalgam').textContent  = stages.amalgam  || '(no term yet)';
  $('termMotion').textContent   = stages.motion   || '(no term yet)';

  $('textHistory').value  = refs.history  || '';
  $('textConcrete').value = refs.concrete || '';
  $('textAmalgam').value  = refs.amalgam  || '';
  $('textMotion').value   = refs.motion   || '';

  $('centerTerms').textContent = queue.length ? queue.join(' · ') : '—';

  $('runSummary').textContent =
    `Day ${d} of ${totalDays} · ${termBank.length} terms in bank`;
  setStatus('');
}

function saveCurrentDay() {
  const state = loadState();
  const data = {
    history: $('textHistory').value,
    concrete: $('textConcrete').value,
    amalgam: $('textAmalgam').value,
    motion: $('textMotion').value
  };
  setReflectionsForDay(state, currentDayIndex, data);
  saveState(state);
  setStatus('Saved locally.');
}

// Bootstrapping ---------------------------------------------------

function init() {
  loadCSV(TERMS_URL)
    .then(terms => {
      termBank = terms;
      totalDays = termBank.length + 3;
      $('termBankPreview').textContent = terms.join('\n');
      renderDay(currentDayIndex);
    })
    .catch(err => {
      setStatus('Error: ' + err.message);
      $('runSummary').textContent = 'Could not load terms.csv';
    });

  $('saveBtn').addEventListener('click', saveCurrentDay);
  $('goToDayBtn').addEventListener('click', () => {
    const v = parseInt($('dayIndexInput').value, 10);
    if (!Number.isFinite(v)) return;
    renderDay(v);
  });
  $('prevDayBtn').addEventListener('click', () => {
    if (currentDayIndex > 1) renderDay(currentDayIndex - 1);
  });
  $('nextDayBtn').addEventListener('click', () => {
    if (currentDayIndex < totalDays) renderDay(currentDayIndex + 1);
  });
}

window.addEventListener('DOMContentLoaded', init);
