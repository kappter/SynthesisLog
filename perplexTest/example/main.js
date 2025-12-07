// SynthesisLog music-theory demo: CSV-driven rotating queue, localStorage persistence.

const TERMS_URL = 'terms.csv';
const STORAGE_KEY = 'synthesisLog_music_demo_v1';

let termBank = [];
let totalDays = 0;
let currentDayIndex = 1;

// Seed demo reflections for first 8 days.
const DEMO_REFLECTIONS = {
  'day-1': {
    history: 'Pitch is the most basic measurable parameter of sound; before harmony or rhythm, Western theory organized music by high and low steps on a staff.',
    concrete: '',
    amalgam: '',
    motion: ''
  },
  'day-2': {
    history: '',
    concrete: 'Intervals feel concrete as distances you can sing or play: the “lean” of a minor second, the stability of a perfect fifth.',
    amalgam: '',
    motion: ''
  },
  'day-3': {
    history: '',
    concrete: '',
    amalgam: 'Scale degree turns pitch and interval into social roles: not just “C to G,” but 1 moving to 5 with a sense of expectation.',
    motion: ''
  },
  'day-4': {
    history: '',
    concrete: '',
    amalgam: '',
    motion: 'Motion: from raw pitch-object to interval distance to scale-degree role—each layer adds intention to the same frequencies.'
  },
  'day-5': {
    history: 'Major scale became the central “home base” of tonal practice, absorbing modal patterns into a single bright template.',
    concrete: '',
    amalgam: '',
    motion: ''
  },
  'day-6': {
    history: '',
    concrete: 'Natural minor scale shades the same pitch collection as a darker counterpart, often emerging in folk melodies and lament-like tunes.',
    amalgam: '',
    motion: ''
  },
  'day-7': {
    history: '',
    concrete: '',
    amalgam: 'Harmonic minor exaggerates the pull between dominant and tonic; the raised 7 makes V–i feel like a gravitational snap.',
    motion: ''
  },
  'day-8': {
    history: '',
    concrete: '',
    amalgam: '',
    motion: 'Motion: a family of scalar “masks” placed over the same pitch world, modulating emotional color without changing key center.'
  }
};

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

// Persistence -----------------------------------------------------

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { reflections: { ...DEMO_REFLECTIONS } };
    }
    const parsed = JSON.parse(raw);
    parsed.reflections = parsed.reflections || {};
    for (const k in DEMO_REFLECTIONS) {
      if (!parsed.reflections[k]) parsed.reflections[k] = DEMO_REFLECTIONS[k];
    }
    return parsed;
  } catch (e) {
    return { reflections: { ...DEMO_REFLECTIONS } };
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

// AI helpers ------------------------------------------------------

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
  window.currentQueue = queue;

  const state = loadState();
  const refs = getReflectionsForDay(state, d);

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

// Bootstrapping + upload + AI buttons ----------------------------

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

  // AI buttons (delegated)
  document.addEventListener('click', e => {
    const btn = e.target.closest('.ai-btn');
    if (!btn) return;
    const stage = btn.dataset.stage;
    if (!window.currentStages || !window.currentQueue) return;
    openAiForStage(stage, window.currentStages, window.currentQueue);
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
        totalDays = termBank.length + 3;
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
