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
    .then(text => parseTermsCSV(text));
}

// Robust CSV parser: ignore exact header text, trim BOM, skip blanks.
function parseTermsCSV(text) {
  const lines = text.split(/\r?\n/);
  const trimmed = lines
    .map(l => l.replace(/^\uFEFF/, '').trim())
    .filter(l => l !== '');
  if (trimmed.length <= 1) {
    throw new Error('CSV must have a header and at least one term');
  }
  return trimmed.slice(1); // drop header
}

// Scheduling logic -----------------------------------------------

// For N terms, total days = N + 3.
// Day d (1-based) uses up to 4 terms.
// Term i (0-based) is introduced on day i+1, stays for 4 days (i+1 .. i+4).

function getQueueForDay(d) {
  const N = termBank.length;
  const queue = [];

  for (let i = 0; i < N; i++) {
    const start = i + 1;
    const end = i + 4;
    if (d >= start && d <= end) {
      queue.push(termBank[i]);
    }
  }
  if (queue.length > 4) {
    return queue.slice(queue.length - 4);
  }
  return queue;
}

// newest term → History, then Concrete, Amalgam, Motion.
function getStagesForDay(d) {
  const queue = getQueueForDay(d);
  const stages = {
    history: null,
    concrete: null,
    amalgam: null,
    motion: null
  };

  const len = queue.length;
  if (len >= 1) stages.history  = queue[len - 1];      // newest
  if (len >= 2) stages.concrete = queue[len - 2];
  if (len >= 3) stages.amalgam  = queue[len - 3];
  if (len >= 4) stages.motion   = queue[len - 4];      // oldest

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

  const isClosingDay = (d === totalDays) && queue.length === 0;
  const state = loadState();
  const refs = getReflectionsForDay(state, d);

  if (isClosingDay) {
  $('termHistoryMini').textContent  = '—';
  $('termConcreteMini').textContent = '—';
  $('termAmalgamMini').textContent  = '—';
  $('termMotionMini').textContent   = '—';

  $('termHistoryFull').textContent  = 'Run complete';
  $('termConcreteFull').textContent = 'Review motions';
  $('termAmalgamFull').textContent  = 'Notice patterns';
  $('termMotionFull').textContent   = 'Name next questions';

  $('textHistory').placeholder  = 'Summarize what you learned about these terms and their histories.';
  $('textConcrete').placeholder = 'Capture memorable images, metaphors, or examples that surfaced.';
  $('textAmalgam').placeholder  = 'List the strongest amalgamations or conceptual fusions you discovered.';
  $('textMotion').placeholder   = 'Propose how this run should influence your next term bank or project.';

  $('centerTerms').textContent = 'All terms have completed their four-day cycle.';
}

  // Mini labels around the circle
  $('termHistoryMini').textContent  = stages.history  || '—';
  $('termConcreteMini').textContent = stages.concrete || '—';
  $('termAmalgamMini').textContent  = stages.amalgam  || '—';
  $('termMotionMini').textContent   = stages.motion   || '—';

  // Full labels above the textareas
  $('termHistoryFull').textContent  = stages.history  || '—';
  $('termConcreteFull').textContent = stages.concrete || '—';
  $('termAmalgamFull').textContent  = stages.amalgam  || '—';
  $('termMotionFull').textContent   = stages.motion   || '—';

  // Textarea values
  $('textHistory').value  = refs.history  || '';
  $('textConcrete').value = refs.concrete || '';
  $('textAmalgam').value  = refs.amalgam  || '';
  $('textMotion').value   = refs.motion   || '';

  // Four-term set, now below circle
  $('centerTerms').textContent = queue.length ? queue.join(' · ') : '—';

  $('runSummary').textContent =
  isClosingDay
    ? `Closing day · all ${termBank.length} terms have completed the four-stage process`
    : `Day ${d} of ${totalDays} · ${termBank.length} terms in bank`;
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

// Bootstrapping + upload -----------------------------------------

function init() {
  loadCSV(TERMS_URL)
    .then(terms => {
      termBank = terms;
      totalDays = termBank.length + 4;
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

  // Upload handling
  $('loadCsvBtn').addEventListener('click', () => {
    const fileInput = $('csvFileInput');
    const file = fileInput.files && fileInput.files[0];
    const uploadStatus = $('uploadStatus');
    if (!file) {
      uploadStatus.textContent = 'Choose a CSV file first.';
      return;
    }
    uploadStatus.textContent = 'Reading…';

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const text = e.target.result;
        const terms = parseTermsCSV(text);
        termBank = terms;
        totalDays = termBank.length + 4;
        currentDayIndex = 1;
        $('termBankPreview').textContent = terms.join('\n');
        renderDay(currentDayIndex);
        uploadStatus.textContent = 'Loaded ' + terms.length + ' terms.';
      } catch (err) {
        uploadStatus.textContent = 'Error: ' + err.message;
      }
    };
    reader.onerror = () => {
      uploadStatus.textContent = 'Could not read file.';
    };
    reader.readAsText(file);
  });
}

window.addEventListener('DOMContentLoaded', init);
