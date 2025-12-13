// Synthesis Log: CSV-driven rotating queue with dark mode, upload, dates, progress, and save/load.

const TERMS_URL   = 'terms.csv';
const STORAGE_KEY = 'synthesisLog_v1';
const THEME_KEY   = 'synthesisLog_theme';

let termBank        = [];
let totalDays       = 0;   // N + 4 (includes closing day)
let currentDayIndex = 1;   // 1-based

// Utility ---------------------------------------------------------
const PRESET_SETS = {
  'music-core': [
    'Pitch',
    'Interval',
    'Scale degree',
    'Major scale',
    'Minor scale',
    'Chord',
    'Cadence',
    'Modulation',
    'Voice leading',
    'Counterpoint'
  ],
  'feel-good': [
    'Serendipity',
    'Momentum',
    'Clarity',
    'Playfulness',
    'Flow state',
    'Gratitude',
    'Courage',
    'Curiosity',
    'Harmony',
    'Wonder'
  ],
  'verbs-motion': [
    'Zoom',
    'Unfold',
    'Anchor',
    'Pivot',
    'Cascade',
    'Spiral',
    'Drift',
    'Fuse',
    'Refract',
    'Resonate'
  ]
};

function adoptTermsArray(terms) {
  termBank = [...terms];
  shuffle(termBank);
  totalDays = termBank.length + 4;
  currentDayIndex = 1;
  $('termBankPreview').textContent = termBank.join('\n');
  renderDay(currentDayIndex);
}


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

// Robust CSV parser
function parseTermsCSV(text) {
  const lines = text.split(/\r?\n/);
  const trimmed = lines
    .map(l => l.replace(/^\uFEFF/, '').trim())
    .filter(l => l !== '');
  if (trimmed.length <= 1) {
    throw new Error('CSV must have a header and at least one term');
  }
  return trimmed.slice(1);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Theme helpers ---------------------------------------------------

function applyTheme(theme) {
  const body = document.body;
  if (theme === 'dark') {
    body.classList.add('dark');
    $('themeToggle').textContent = 'Light';
  } else {
    body.classList.remove('dark');
    $('themeToggle').textContent = 'Dark';
  }
}

function loadTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || 'light';
  } catch (e) {
    return 'light';
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    // ignore
  }
}

// Scheduling logic -----------------------------------------------

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
  if (len >= 1) stages.history  = queue[len - 1];
  if (len >= 2) stages.concrete = queue[len - 2];
  if (len >= 3) stages.amalgam  = queue[len - 3];
  if (len >= 4) stages.motion   = queue[len - 4];

  return { queue, stages };
}

// Persistence of reflections + meta ------------------------------

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { reflections: {}, meta: {} };
    const parsed = JSON.parse(raw);
    if (!parsed.reflections) parsed.reflections = {};
    if (!parsed.meta) parsed.meta = {};
    return parsed;
  } catch (e) {
    return { reflections: {}, meta: {} };
  }
}

function saveState(state) {
  if (!state.meta) state.meta = {};
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

// Date UI ---------------------------------------------------------

function refreshDatesUI() {
  const state = loadState();
  if (state.meta && state.meta.startDate) {
    $('startDateInput').value = state.meta.startDate;
  }
  if (state.meta && state.meta.endDate) {
    $('endDateDisplay').textContent = 'End: ' + state.meta.endDate;
  } else {
    $('endDateDisplay').textContent = '';
  }
}

// Save/load whole log as JSON ------------------------------------

function getFullState() {
  const s = loadState();
  return {
    version: 1,
    terms: termBank,
    currentDay: currentDayIndex,
    reflections: s.reflections || {},
    meta: s.meta || {}
  };
}

function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function applyImportedState(data) {
  if (!data || data.version !== 1) {
    throw new Error('Unsupported or missing version field.');
  }
  if (!Array.isArray(data.terms) || !data.terms.length) {
    throw new Error('Imported data has no terms.');
  }

  termBank = [...data.terms];
  totalDays = termBank.length + 4;
  currentDayIndex = Math.max(1, Math.min(data.currentDay || 1, totalDays));

  const state = {
    reflections: data.reflections || {},
    meta: data.meta || {}
  };
  saveState(state);

  $('termBankPreview').textContent = termBank.join('\n');
  refreshDatesUI();
  renderDay(currentDayIndex);
}

// AI helpers (external agent) ------------------------------------

function buildPrompt(stage, stages, queue) {
  const fourSet = queue.join(', ');
  const focal =
    stage === 'history'  ? stages.history  :
    stage === 'concrete' ? stages.concrete :
    stage === 'amalgam'  ? stages.amalgam  :
    stages.motion;

  let instruction = '';
  if (stage === 'history') {
    instruction = 'Provide concise historical and conceptual context for the focal term.';
  } else if (stage === 'concrete') {
    instruction = 'Suggest concrete and abstract images or applications for the focal term.';
  } else if (stage === 'amalgam') {
    instruction = 'Propose conceptual amalgamations linking the four terms, keeping the focal term central.';
  } else {
    instruction = 'Propose a named “motion” or conceptual move that links the four terms via the focal term.';
  }

  return (
    instruction +
    ' Focal term: ' + focal +
    '. Four-term set: ' + fourSet +
    '. Keep the answer short so it can be pasted into a journal box.'
  );
}

function openAiForStage(stage, stages, queue) {
  const prompt = buildPrompt(stage, stages, queue);
  const encoded = encodeURIComponent(prompt);
  const url = 'https://www.perplexity.ai/search?q=' + encoded;
  window.open(url, '_blank');
}

// Summary builder -------------------------------------------------

function buildSummary() {
  const state = loadState();
  const keys = Object.keys(state.reflections || {});
  if (!keys.length) {
    return { blurb: 'No reflections yet.', motions: [] };
  }

  const sorted = keys.slice().sort((a, b) => {
    const da = parseInt(a.split('-')[1], 10);
    const db = parseInt(b.split('-')[1], 10);
    return da - db;
  });

  const firstDay = parseInt(sorted[0].split('-')[1], 10);
  const lastDay  = parseInt(sorted[sorted.length - 1].split('-')[1], 10);

  let motionCount = 0;
  const motionSnippets = [];

  for (const key of sorted) {
    const idx = parseInt(key.split('-')[1], 10);
    const r = state.reflections[key];
    if (r && r.motion && r.motion.trim()) {
      motionCount++;
      if (motionSnippets.length < 5) {
        motionSnippets.push({ day: idx, text: r.motion.trim() });
      }
    }
  }

  const blurb =
    `You wrote on ${sorted.length} day(s), from day ${firstDay} to day ${lastDay}, ` +
    `and captured ${motionCount} named motion(s).`;

  return { blurb, motions: motionSnippets };
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
  window.currentStages = stages;
  window.currentQueue  = queue;

  const isClosingDay = (d === totalDays) && queue.length === 0;

  const state = loadState();
  const refs = getReflectionsForDay(state, d);

  // progress bar
  const percent = ((d - 1) / Math.max(1, totalDays - 1)) * 100;
  $('progressFill').style.width = percent + '%';
  $('progressStartLabel').textContent = 'Day 1';
  $('progressEndLabel').textContent   = 'Day ' + totalDays;

  if (isClosingDay) {
    state.meta = state.meta || {};
    if (!state.meta.endDate) {
      const today = new Date().toISOString().slice(0, 10);
      state.meta.endDate = today;
      saveState(state);
    }
    refreshDatesUI();

    $('termHistoryMini').textContent  = '—';
    $('termConcreteMini').textContent = '—';
    $('termAmalgamMini').textContent  = '—';
    $('termMotionMini').textContent   = '—';

    $('termHistoryFull').textContent  = 'Run complete';
    $('termConcreteFull').textContent = 'Review motions';
    $('termAmalgamFull').textContent  = 'Notice patterns';
    $('termMotionFull').textContent   = 'Name next questions';

    $('textHistory').value  = refs.history  || '';
    $('textConcrete').value = refs.concrete || '';
    $('textAmalgam').value  = refs.amalgam  || '';
    $('textMotion').value   = refs.motion   || '';

    $('textHistory').placeholder  = 'Summarize what you learned about these terms and their histories.';
    $('textConcrete').placeholder = 'Capture memorable images, metaphors, or examples that surfaced.';
    $('textAmalgam').placeholder  = 'List the strongest amalgamations or conceptual fusions you discovered.';
    $('textMotion').placeholder   = 'Propose how this run should influence your next term bank or project.';

    $('centerTerms').textContent = 'All terms have completed their four-day cycle.';

    const summary = buildSummary();
    $('summarySection').hidden = false;
    $('summaryBlurb').textContent = summary.blurb;
    const ul = $('motionHighlights');
    ul.innerHTML = '';
    summary.motions.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `Day ${item.day}: “${item.text}”`;
      ul.appendChild(li);
    });
  } else {
    refreshDatesUI();

    $('summarySection').hidden = true;

    $('termHistoryMini').textContent  = stages.history  || '—';
    $('termConcreteMini').textContent = stages.concrete || '—';
    $('termAmalgamMini').textContent  = stages.amalgam  || '—';
    $('termMotionMini').textContent   = stages.motion   || '—';

    $('termHistoryFull').textContent  = stages.history  || '—';
    $('termConcreteFull').textContent = stages.concrete || '—';
    $('termAmalgamFull').textContent  = stages.amalgam  || '—';
    $('termMotionFull').textContent   = stages.motion   || '—';

    $('textHistory').value  = refs.history  || '';
    $('textConcrete').value = refs.concrete || '';
    $('textAmalgam').value  = refs.amalgam  || '';
    $('textMotion').value   = refs.motion   || '';

    $('textHistory').placeholder  = 'Historical context, background associations…';
    $('textConcrete').placeholder = 'Concrete images and abstract meanings…';
    $('textAmalgam').placeholder  = 'Amalgamations among today\'s four terms…';
    $('textMotion').placeholder   = 'Name a motion or proposal that links the four terms…';

    $('centerTerms').textContent = queue.length ? queue.join(' · ') : '—';
  }

  $('runSummary').textContent =
    isClosingDay
      ? `Closing day · all ${termBank.length} terms have completed the four-stage process`
      : `Day ${d} of ${totalDays} · ${termBank.length} terms in bank`;

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

// Bootstrapping + event wiring -----------------------------------

function init() {
  // theme
  const initialTheme = loadTheme();
  applyTheme(initialTheme);
  $('themeToggle').addEventListener('click', () => {
    const current = document.body.classList.contains('dark') ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    saveTheme(next);
  });

  refreshDatesUI();
  $('startDateInput').addEventListener('change', () => {
    const state = loadState();
    state.meta = state.meta || {};
    state.meta.startDate = $('startDateInput').value || null;
    saveState(state);
    refreshDatesUI();
  });

  // load initial CSV
  loadCSV(TERMS_URL)
    .then(terms => {
      termBank = [...terms];
      shuffle(termBank);
      totalDays = termBank.length + 4;
      $('termBankPreview').textContent = termBank.join('\n');
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

  // AI buttons
  document.addEventListener('click', e => {
    const btn = e.target.closest('.ai-btn');
    if (!btn) return;
    const stage = btn.dataset.stage;
    if (!window.currentStages || !window.currentQueue) return;
    openAiForStage(stage, window.currentStages, window.currentQueue);
  });

  // CSV upload
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
        termBank = [...terms];
        shuffle(termBank);
        totalDays = termBank.length + 4;
        currentDayIndex = 1;
        $('termBankPreview').textContent = termBank.join('\n');
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

  // export JSON
  $('exportBtn').addEventListener('click', () => {
    const snapshot = getFullState();
    const stamp = new Date().toISOString().slice(0, 10);
    downloadJSON(snapshot, `synthesis-log-${stamp}.json`);
    $('importStatus').textContent = 'Log downloaded.';
  });

  // import JSON
  $('importBtn').addEventListener('click', () => {
    const fileInput = $('importFile');
    const file = fileInput.files && fileInput.files[0];
    const importStatus = $('importStatus');
    if (!file) {
      importStatus.textContent = 'Choose a JSON file first.';
      return;
    }
    importStatus.textContent = 'Reading…';

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const text = e.target.result;
        const data = JSON.parse(text);
        applyImportedState(data);
        importStatus.textContent = 'Log loaded.';
      } catch (err) {
        importStatus.textContent = 'Error loading log: ' + err.message;
      }
    };
    reader.onerror = () => {
      importStatus.textContent = 'Could not read file.';
    };
    reader.readAsText(file);
  });
}

window.addEventListener('DOMContentLoaded', init);
