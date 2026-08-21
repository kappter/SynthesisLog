/**
 * Preset term lists with signature hues for the perpetual spiral
 * Each list has a unique color identity for visual continuity
 */

export interface PresetList {
  id: string;
  name: string;
  hue: number; // OKLCH hue value (0-360)
  terms: string[];
}

export const PRESET_LISTS: PresetList[] = [
  {
    id: "music-theory",
    name: "Music Theory",
    hue: 55, // Warm amber/gold
    terms: [
      "Pitch",
      "Interval",
      "Scale degree",
      "Major scale",
      "Minor scale",
      "Chord",
      "Cadence",
      "Modulation",
      "Voice leading",
      "Counterpoint",
      "Harmony",
      "Rhythm",
      "Tempo",
      "Dynamics",
      "Timbre",
    ],
  },
  {
    id: "art-terms",
    name: "Art & Design",
    hue: 330, // Rose/Magenta
    terms: [
      "Chiaroscuro",
      "Composition",
      "Perspective",
      "Negative space",
      "Color theory",
      "Contrast",
      "Texture",
      "Form",
      "Balance",
      "Proportion",
      "Emphasis",
      "Movement",
      "Unity",
      "Rhythm",
      "Pattern",
    ],
  },
  {
    id: "geography",
    name: "Geography",
    hue: 180, // Teal/Cyan
    terms: [
      "Latitude",
      "Longitude",
      "Topography",
      "Climate zone",
      "Watershed",
      "Erosion",
      "Tectonic plate",
      "Biome",
      "Cartography",
      "Elevation",
      "Continental drift",
      "Ecosystem",
      "Migration",
      "Urbanization",
      "Sustainability",
    ],
  },
  {
    id: "computer-science",
    name: "Computer Science",
    hue: 240, // Electric Blue
    terms: [
      "Algorithm",
      "Data structure",
      "Recursion",
      "Abstraction",
      "Encapsulation",
      "Polymorphism",
      "Inheritance",
      "Binary tree",
      "Hash table",
      "Big O notation",
      "API",
      "Database",
      "Network protocol",
      "Encryption",
      "Machine learning",
    ],
  },
  {
    id: "physics",
    name: "Physics",
    hue: 200, // Sky Blue
    terms: [
      "Gravity",
      "Momentum",
      "Energy",
      "Force",
      "Velocity",
      "Acceleration",
      "Mass",
      "Friction",
      "Wave",
      "Frequency",
      "Amplitude",
      "Quantum",
      "Relativity",
      "Entropy",
      "Thermodynamics",
    ],
  },
  {
    id: "biology",
    name: "Biology",
    hue: 145, // Green
    terms: [
      "Cell",
      "DNA",
      "Evolution",
      "Ecosystem",
      "Photosynthesis",
      "Metabolism",
      "Mitosis",
      "Meiosis",
      "Protein",
      "Enzyme",
      "Mutation",
      "Adaptation",
      "Symbiosis",
      "Homeostasis",
      "Biodiversity",
    ],
  },
  {
    id: "philosophy",
    name: "Philosophy",
    hue: 280, // Purple
    terms: [
      "Epistemology",
      "Ontology",
      "Ethics",
      "Metaphysics",
      "Logic",
      "Dialectic",
      "Phenomenology",
      "Existentialism",
      "Determinism",
      "Free will",
      "Consciousness",
      "Truth",
      "Justice",
      "Virtue",
      "Aesthetics",
    ],
  },
  {
    id: "psychology",
    name: "Psychology",
    hue: 25, // Orange
    terms: [
      "Cognition",
      "Perception",
      "Memory",
      "Emotion",
      "Motivation",
      "Behavior",
      "Conditioning",
      "Attachment",
      "Identity",
      "Personality",
      "Unconscious",
      "Bias",
      "Heuristic",
      "Empathy",
      "Resilience",
    ],
  },
  {
    id: "economics",
    name: "Economics",
    hue: 85, // Yellow-Green
    terms: [
      "Supply",
      "Demand",
      "Scarcity",
      "Opportunity cost",
      "Marginal utility",
      "Equilibrium",
      "Inflation",
      "GDP",
      "Market",
      "Monopoly",
      "Externality",
      "Fiscal policy",
      "Trade",
      "Capital",
      "Labor",
    ],
  },
  {
    id: "literature",
    name: "Literature",
    hue: 15, // Warm Red
    terms: [
      "Metaphor",
      "Symbolism",
      "Narrative",
      "Theme",
      "Protagonist",
      "Antagonist",
      "Irony",
      "Allegory",
      "Foreshadowing",
      "Imagery",
      "Tone",
      "Voice",
      "Genre",
      "Motif",
      "Archetype",
    ],
  },
  {
    id: "feel-good",
    name: "Feel-Good Words",
    hue: 120, // Bright Green
    terms: [
      "Serendipity",
      "Momentum",
      "Clarity",
      "Playfulness",
      "Flow state",
      "Gratitude",
      "Courage",
      "Curiosity",
      "Harmony",
      "Wonder",
      "Joy",
      "Peace",
      "Growth",
      "Connection",
      "Purpose",
    ],
  },
  {
    id: "verbs-motion",
    name: "Verbs of Motion",
    hue: 300, // Magenta
    terms: [
      "Zoom",
      "Unfold",
      "Anchor",
      "Pivot",
      "Cascade",
      "Spiral",
      "Drift",
      "Fuse",
      "Refract",
      "Resonate",
      "Emerge",
      "Transform",
      "Converge",
      "Diverge",
      "Oscillate",
    ],
  },
  {
    id: "tok-spiral",
    name: "TOK Spiral",
    hue: 260, // Indigo — bridges Philosophy and CS
    // Structured around contrasting pairs that create cognitive tension.
    // Each term is paired with its conceptual counterpart; the spiral
    // separates pairs across days, forcing synthesis between them.
    //
    // Arc 1 — Foundation (Days 1–10): core epistemological pairs
    // Arc 2 — Human Lens (Days 11–20): how knowers distort and construct
    // Arc 3 — Social & Digital (Days 21–30): knowledge in the world
    terms: [
      // Arc 1: Foundation Set
      "Knowledge",
      "Belief",
      "Truth",
      "Justification",
      "Certainty",
      "Doubt",
      "Objectivity",
      "Subjectivity",
      "Evidence",
      "Interpretation",
      // Arc 2: Human Lens Set
      "Perception",
      "Reality",
      "Emotion",
      "Reason",
      "Intuition",
      "Logic",
      "Bias",
      "Awareness",
      "Memory",
      "Reconstruction",
      // Arc 3: Social & Digital Knowledge Set
      "Authority",
      "Trust",
      "Consensus",
      "Language",
      "Meaning",
      "Perspective",
      "Information",
      "Misinformation",
      "Signal",
      "Noise",
    ],
  },
];

/**
 * Get a preset list by ID
 */
export function getPresetById(id: string): PresetList | undefined {
  return PRESET_LISTS.find((p) => p.id === id);
}

/**
 * Get the signature color for a list in OKLCH format
 */
export function getListColor(hue: number, lightness: number = 0.55, chroma: number = 0.15): string {
  return `oklch(${lightness} ${chroma} ${hue})`;
}

/**
 * Get a lighter version of the list color for backgrounds
 */
export function getListColorLight(hue: number): string {
  return `oklch(0.92 0.05 ${hue})`;
}

/**
 * Get a darker version of the list color for dark mode
 */
export function getListColorDark(hue: number): string {
  return `oklch(0.35 0.08 ${hue})`;
}
