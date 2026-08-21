/**
 * TOK Pathways — concept-to-AOK/Theme mapping, scoring engine, and recommendation generator.
 *
 * Concept weights by stage (later stages carry more IB epistemological weight):
 *   History   × 0.8  — contextual grounding
 *   Concrete  × 1.0  — empirical anchoring
 *   Abstract  × 1.4  — theoretical reasoning (highest IB relevance)
 *   Amalgam   × 1.3  — synthesis across perspectives
 *   Motion    × 1.1  — application / transfer
 */

export type AOK =
  | "Natural Sciences"
  | "Human Sciences"
  | "History"
  | "The Arts"
  | "Mathematics"
  | "Language & Literature"
  | "Ethics"
  | "Religious Knowledge";

export type TOKTheme =
  | "Knowledge & the Knower"
  | "Language"
  | "Politics"
  | "Technology"
  | "Religion & Spirituality";

export interface ConceptPathway {
  /** Canonical concept name (case-insensitive match used in scoring) */
  concept: string;
  /** Alternative spellings / synonyms that should map to this entry */
  aliases?: string[];
  /** Primary AOKs this concept connects to, in order of relevance */
  aoks: AOK[];
  /** Primary TOK Themes this concept connects to */
  themes: TOKTheme[];
  /**
   * Exhibition object category prompts — open-ended, student must choose their own object.
   * Labelled "inspiration only" in the UI.
   */
  exhibitionPrompts: string[];
  /**
   * Essay Knowledge Question frames — structural templates the student adapts.
   */
  essayKQFrames: string[];
}

/** Master mapping — 60+ common TOK/IB concepts */
export const TOK_PATHWAYS: ConceptPathway[] = [
  {
    concept: "Truth",
    aliases: ["truths", "true"],
    aoks: ["Natural Sciences", "Ethics", "Mathematics"],
    themes: ["Knowledge & the Knower", "Language"],
    exhibitionPrompts: [
      "An object that represents a claim once considered true but later overturned",
      "An object that embodies the tension between personal truth and shared knowledge",
      "An object used to verify or test the truth of a claim",
    ],
    essayKQFrames: [
      "To what extent is truth dependent on the method used to seek it?",
      "How do we distinguish between truth and belief in [AOK]?",
      "Can there be multiple truths, or is truth always singular?",
    ],
  },
  {
    concept: "Knowledge",
    aliases: ["knowing", "know"],
    aoks: ["Natural Sciences", "Human Sciences", "History"],
    themes: ["Knowledge & the Knower", "Technology"],
    exhibitionPrompts: [
      "An object that represents the limits of what can be known",
      "An object that changed what a community believed it knew",
      "An object that stores or transmits knowledge across generations",
    ],
    essayKQFrames: [
      "What counts as knowledge, and who decides?",
      "How does the source of knowledge affect its reliability?",
      "To what extent is all knowledge provisional?",
    ],
  },
  {
    concept: "Belief",
    aliases: ["beliefs", "believe"],
    aoks: ["Religious Knowledge", "Ethics", "Human Sciences"],
    themes: ["Knowledge & the Knower", "Religion & Spirituality"],
    exhibitionPrompts: [
      "An object associated with a belief system or worldview",
      "An object that represents a belief held without empirical evidence",
      "An object that has changed someone's beliefs",
    ],
    essayKQFrames: [
      "How do we justify beliefs that cannot be empirically verified?",
      "To what extent does belief shape what we are willing to accept as knowledge?",
      "What is the relationship between belief and knowledge in [AOK]?",
    ],
  },
  {
    concept: "Justification",
    aliases: ["justify", "justified"],
    aoks: ["Mathematics", "History", "Natural Sciences"],
    themes: ["Knowledge & the Knower", "Politics"],
    exhibitionPrompts: [
      "An object that represents evidence used to support or challenge a claim",
      "An object associated with a decision that required justification",
      "An object that embodies the standards of proof in a particular field",
    ],
    essayKQFrames: [
      "How much evidence is sufficient to justify a knowledge claim?",
      "To what extent does the standard of justification vary across AOKs?",
      "Can a belief be knowledge without justification?",
    ],
  },
  {
    concept: "Certainty",
    aliases: ["certain", "uncertainty", "uncertain"],
    aoks: ["Mathematics", "Natural Sciences", "Ethics"],
    themes: ["Knowledge & the Knower", "Technology"],
    exhibitionPrompts: [
      "An object that represents something once considered certain but now questioned",
      "An object used to measure or quantify uncertainty",
      "An object that embodies the human desire for certainty",
    ],
    essayKQFrames: [
      "Is certainty ever achievable in [AOK]?",
      "How does the acknowledgement of uncertainty affect the value of knowledge?",
      "To what extent is the pursuit of certainty a driver of knowledge production?",
    ],
  },
  {
    concept: "Perspective",
    aliases: ["perspectives", "viewpoint", "point of view"],
    aoks: ["History", "The Arts", "Human Sciences"],
    themes: ["Knowledge & the Knower", "Politics", "Language"],
    exhibitionPrompts: [
      "An object that looks different depending on who is viewing it",
      "An object that represents a marginalised or overlooked perspective",
      "An object whose meaning has changed across different cultural contexts",
    ],
    essayKQFrames: [
      "How does perspective shape what counts as knowledge?",
      "To what extent is objectivity possible when knowledge is shaped by perspective?",
      "Can multiple perspectives on the same event all be equally valid?",
    ],
  },
  {
    concept: "Bias",
    aliases: ["biases", "biased"],
    aoks: ["History", "Human Sciences", "Natural Sciences"],
    themes: ["Knowledge & the Knower", "Politics", "Language"],
    exhibitionPrompts: [
      "An object that reveals an unconscious bias in its design or use",
      "An object associated with a historical narrative shaped by bias",
      "An object that was created or used to challenge a prevailing bias",
    ],
    essayKQFrames: [
      "To what extent can bias be eliminated from knowledge production?",
      "How does awareness of bias change the way we evaluate knowledge claims?",
      "Is all knowledge inevitably shaped by the biases of its producers?",
    ],
  },
  {
    concept: "Evidence",
    aliases: ["evidential", "proof"],
    aoks: ["Natural Sciences", "History", "Mathematics"],
    themes: ["Knowledge & the Knower", "Technology"],
    exhibitionPrompts: [
      "An object that serves as evidence for a historical or scientific claim",
      "An object whose evidential value has been disputed",
      "An object that represents the process of gathering or testing evidence",
    ],
    essayKQFrames: [
      "What makes evidence convincing in [AOK]?",
      "To what extent does the type of evidence available shape what can be known?",
      "How do we decide when evidence is sufficient to support a knowledge claim?",
    ],
  },
  {
    concept: "Reason",
    aliases: ["reasoning", "rational", "rationality", "logic", "logical"],
    aoks: ["Mathematics", "Natural Sciences", "Ethics"],
    themes: ["Knowledge & the Knower", "Language"],
    exhibitionPrompts: [
      "An object that represents a logical argument or proof",
      "An object associated with a decision made through rational analysis",
      "An object that challenges purely rational approaches to knowledge",
    ],
    essayKQFrames: [
      "To what extent is reason a reliable way of knowing?",
      "How does reason interact with emotion in the production of knowledge?",
      "Can reason alone lead to knowledge, or does it require other ways of knowing?",
    ],
  },
  {
    concept: "Emotion",
    aliases: ["emotions", "emotional", "feeling", "feelings"],
    aoks: ["The Arts", "Ethics", "Human Sciences"],
    themes: ["Knowledge & the Knower", "Religion & Spirituality"],
    exhibitionPrompts: [
      "An object that evokes a strong emotional response",
      "An object that represents the role of emotion in a significant decision",
      "An object that embodies the tension between emotion and reason",
    ],
    essayKQFrames: [
      "To what extent is emotion a reliable way of knowing?",
      "How does emotion influence the production and acceptance of knowledge?",
      "Can emotional knowledge be as valid as rational knowledge?",
    ],
  },
  {
    concept: "Language",
    aliases: ["linguistic", "words", "communication"],
    aoks: ["Language & Literature", "Human Sciences", "History"],
    themes: ["Language", "Knowledge & the Knower"],
    exhibitionPrompts: [
      "An object that represents the power of language to shape reality",
      "An object associated with a language that is endangered or extinct",
      "An object that embodies the limits of what language can express",
    ],
    essayKQFrames: [
      "To what extent does language shape what we can know?",
      "How does the language we use influence the knowledge we produce?",
      "Can knowledge exist independently of language?",
    ],
  },
  {
    concept: "Intuition",
    aliases: ["intuitive", "gut feeling", "instinct"],
    aoks: ["The Arts", "Ethics", "Natural Sciences"],
    themes: ["Knowledge & the Knower", "Religion & Spirituality"],
    exhibitionPrompts: [
      "An object associated with a decision made on intuition rather than analysis",
      "An object that represents a discovery made through an unexpected insight",
      "An object that embodies the tension between intuition and evidence",
    ],
    essayKQFrames: [
      "To what extent can intuition be considered a valid way of knowing?",
      "How does intuition contribute to knowledge in [AOK]?",
      "Is intuition simply pattern recognition, or something more?",
    ],
  },
  {
    concept: "Imagination",
    aliases: ["creative", "creativity", "imagine"],
    aoks: ["The Arts", "Natural Sciences", "Mathematics"],
    themes: ["Knowledge & the Knower", "Technology"],
    exhibitionPrompts: [
      "An object that represents a creative breakthrough or invention",
      "An object that could only have been produced through imaginative thinking",
      "An object that blurs the boundary between imagination and reality",
    ],
    essayKQFrames: [
      "What role does imagination play in the production of knowledge?",
      "To what extent is imagination necessary for progress in [AOK]?",
      "Can imagination be a source of knowledge, or only of belief?",
    ],
  },
  {
    concept: "Memory",
    aliases: ["memories", "remember", "recollection"],
    aoks: ["History", "Human Sciences", "The Arts"],
    themes: ["Knowledge & the Knower", "Language"],
    exhibitionPrompts: [
      "An object that serves as a memory aid or record",
      "An object whose meaning is shaped by collective memory",
      "An object that represents the unreliability of personal memory",
    ],
    essayKQFrames: [
      "To what extent is memory a reliable source of knowledge?",
      "How does collective memory differ from individual memory as a source of knowledge?",
      "What is the relationship between memory and historical knowledge?",
    ],
  },
  {
    concept: "Culture",
    aliases: ["cultural", "society", "social"],
    aoks: ["Human Sciences", "History", "The Arts"],
    themes: ["Knowledge & the Knower", "Politics", "Language"],
    exhibitionPrompts: [
      "An object that represents a cultural practice or tradition",
      "An object whose meaning changes across different cultures",
      "An object that embodies cultural exchange or conflict",
    ],
    essayKQFrames: [
      "To what extent is knowledge shaped by the culture in which it is produced?",
      "How does cultural context affect the interpretation of knowledge claims?",
      "Can knowledge transcend cultural boundaries?",
    ],
  },
  {
    concept: "Power",
    aliases: ["authority", "control", "influence"],
    aoks: ["Human Sciences", "History", "Ethics"],
    themes: ["Politics", "Knowledge & the Knower"],
    exhibitionPrompts: [
      "An object that represents the exercise of power or authority",
      "An object associated with resistance to power",
      "An object that embodies the relationship between knowledge and power",
    ],
    essayKQFrames: [
      "To what extent does power shape what counts as knowledge?",
      "How does the relationship between knowledge and power affect what is studied?",
      "Can knowledge ever be truly independent of power structures?",
    ],
  },
  {
    concept: "Ethics",
    aliases: ["ethical", "moral", "morality", "right", "wrong"],
    aoks: ["Ethics", "Natural Sciences", "Human Sciences"],
    themes: ["Knowledge & the Knower", "Religion & Spirituality", "Politics"],
    exhibitionPrompts: [
      "An object associated with an ethical dilemma or moral controversy",
      "An object that represents a moral principle or value",
      "An object whose production or use raises ethical questions",
    ],
    essayKQFrames: [
      "To what extent should ethical considerations constrain the pursuit of knowledge?",
      "How do we resolve conflicts between different ethical frameworks?",
      "Is ethics a form of knowledge, or something different?",
    ],
  },
  {
    concept: "Identity",
    aliases: ["self", "who we are", "personal identity"],
    aoks: ["Human Sciences", "The Arts", "History"],
    themes: ["Knowledge & the Knower", "Language", "Religion & Spirituality"],
    exhibitionPrompts: [
      "An object that represents personal or cultural identity",
      "An object associated with a transformation of identity",
      "An object that embodies the tension between individual and collective identity",
    ],
    essayKQFrames: [
      "To what extent does identity shape what we are willing to accept as knowledge?",
      "How does the knower's identity influence the knowledge they produce?",
      "Can knowledge exist independently of the identity of the knower?",
    ],
  },
  {
    concept: "Change",
    aliases: ["transformation", "evolution", "progress", "development"],
    aoks: ["History", "Natural Sciences", "Human Sciences"],
    themes: ["Technology", "Politics", "Knowledge & the Knower"],
    exhibitionPrompts: [
      "An object that represents a significant moment of change",
      "An object that has remained unchanged while the world around it transformed",
      "An object that embodies resistance to or acceptance of change",
    ],
    essayKQFrames: [
      "How does knowledge change over time?",
      "To what extent is change in knowledge driven by new evidence or new perspectives?",
      "What is the relationship between change and progress in [AOK]?",
    ],
  },
  {
    concept: "Meaning",
    aliases: ["meaningful", "significance", "purpose"],
    aoks: ["Language & Literature", "The Arts", "Religious Knowledge"],
    themes: ["Language", "Knowledge & the Knower", "Religion & Spirituality"],
    exhibitionPrompts: [
      "An object whose meaning is contested or ambiguous",
      "An object that has acquired new meaning over time",
      "An object that represents the human search for meaning",
    ],
    essayKQFrames: [
      "To what extent is meaning constructed rather than discovered?",
      "How does context shape the meaning of a knowledge claim?",
      "Can meaning exist independently of the interpreter?",
    ],
  },
  {
    concept: "Doubt",
    aliases: ["skepticism", "scepticism", "question", "questioning"],
    aoks: ["Natural Sciences", "Mathematics", "Ethics"],
    themes: ["Knowledge & the Knower", "Religion & Spirituality"],
    exhibitionPrompts: [
      "An object associated with a moment of doubt or questioning",
      "An object that represents the value of scepticism in knowledge production",
      "An object that embodies the tension between doubt and conviction",
    ],
    essayKQFrames: [
      "To what extent is doubt necessary for the production of knowledge?",
      "How does doubt function differently across AOKs?",
      "Is it possible to have knowledge without any doubt?",
    ],
  },
  {
    concept: "Interpretation",
    aliases: ["interpret", "meaning-making", "hermeneutics"],
    aoks: ["The Arts", "History", "Language & Literature"],
    themes: ["Language", "Knowledge & the Knower"],
    exhibitionPrompts: [
      "An object whose interpretation has changed significantly over time",
      "An object that requires specialist knowledge to interpret correctly",
      "An object that has been interpreted differently by different communities",
    ],
    essayKQFrames: [
      "To what extent is all knowledge an act of interpretation?",
      "How do we adjudicate between competing interpretations of the same evidence?",
      "What role does the interpreter play in the production of knowledge?",
    ],
  },
  {
    concept: "Homeostasis",
    aliases: ["balance", "equilibrium", "stability"],
    aoks: ["Natural Sciences", "Human Sciences"],
    themes: ["Technology", "Knowledge & the Knower"],
    exhibitionPrompts: [
      "An object that represents a system maintaining balance or stability",
      "An object associated with the disruption and restoration of equilibrium",
      "An object that embodies the concept of self-regulation",
    ],
    essayKQFrames: [
      "To what extent does knowledge itself tend toward equilibrium?",
      "How do systems of knowledge maintain stability in the face of new evidence?",
      "What happens when the balance between competing knowledge claims is disrupted?",
    ],
  },
  {
    concept: "Motivation",
    aliases: ["drive", "purpose", "goal", "intention"],
    aoks: ["Human Sciences", "Ethics", "The Arts"],
    themes: ["Knowledge & the Knower", "Politics"],
    exhibitionPrompts: [
      "An object that represents a powerful motivating force",
      "An object associated with a person whose motivation shaped history",
      "An object that embodies the tension between intrinsic and extrinsic motivation",
    ],
    essayKQFrames: [
      "To what extent does the motivation of the knower affect the knowledge they produce?",
      "How does motivation shape the questions we choose to investigate?",
      "Can knowledge produced for commercial or political motives be trusted?",
    ],
  },
];

// ─── Stage weight multipliers ────────────────────────────────────────────────
export const STAGE_WEIGHTS: Record<string, number> = {
  history: 0.8,
  concrete: 1.0,
  abstract: 1.4,
  amalgam: 1.3,
  motion: 1.1,
  // Depth-2 combined stages
  foundation: 1.0,         // history + concrete + abstract combined
  application: 1.2,        // amalgam + motion combined
  // Depth-3 combined stages
  analysis: 1.2,           // concrete + abstract combined
  synthesis: 1.2,          // amalgam + motion combined
  // Depth-4 combined stage
  concrete_abstract: 1.2,  // concrete + abstract combined
};

// ─── Types ───────────────────────────────────────────────────────────────────
export interface TermScore {
  term: string;
  weightedScore: number;
  pathway: ConceptPathway | null;
}

export interface AOKScore {
  aok: AOK;
  score: number;
  /** 0–100 normalised percentage */
  pct: number;
}

export interface PathwayRecommendation {
  topTerms: TermScore[];
  aokScores: AOKScore[];
  exhibitionPrompts: Array<{ prompt: string; term: string; aok: AOK }>;
  essayKQFrames: Array<{ frame: string; term: string; aok: AOK }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Case-insensitive fuzzy match: returns the pathway for a given term name */
export function findPathway(term: string): ConceptPathway | null {
  const normalised = term.trim().toLowerCase();
  return (
    TOK_PATHWAYS.find(
      (p) =>
        p.concept.toLowerCase() === normalised ||
        (p.aliases ?? []).some((a) => a.toLowerCase() === normalised)
    ) ?? null
  );
}

/**
 * Compute a weighted score for a single term given its per-stage ratings.
 * `stageRatings` is a map of stageId → rating (1–10 or null).
 */
export function computeTermScore(
  term: string,
  stageRatings: Record<string, number | null>
): TermScore {
  let total = 0;
  let weightSum = 0;

  for (const [stageId, rating] of Object.entries(stageRatings)) {
    if (rating == null) continue;
    const weight = STAGE_WEIGHTS[stageId.toLowerCase()] ?? 1.0;
    total += rating * weight;
    weightSum += weight;
  }

  const weightedScore = weightSum > 0 ? total / weightSum : 0;
  return { term, weightedScore, pathway: findPathway(term) };
}

/**
 * Generate full pathway recommendations from a map of term → stageRatings.
 * Returns top 5 terms, AOK heat map, top 3 Exhibition prompts, top 3 Essay KQ frames.
 */
export function generateRecommendations(
  termRatings: Record<string, Record<string, number | null>>
): PathwayRecommendation {
  // Score all terms
  const scored: TermScore[] = Object.entries(termRatings).map(
    ([term, ratings]) => computeTermScore(term, ratings)
  );
  scored.sort((a, b) => b.weightedScore - a.weightedScore);
  const topTerms = scored.slice(0, 5);

  // Build AOK heat map from top terms
  const aokMap: Partial<Record<AOK, number>> = {};
  for (const ts of topTerms) {
    if (!ts.pathway) continue;
    ts.pathway.aoks.forEach((aok, i) => {
      // First AOK gets full score, subsequent get diminishing contribution
      const contribution = ts.weightedScore * (1 - i * 0.2);
      aokMap[aok] = (aokMap[aok] ?? 0) + Math.max(contribution, 0);
    });
  }
  const maxAOK = Math.max(...Object.values(aokMap).map((v) => v ?? 0), 1);
  const aokScores: AOKScore[] = (Object.entries(aokMap) as [AOK, number][])
    .map(([aok, score]) => ({ aok, score, pct: Math.round((score / maxAOK) * 100) }))
    .sort((a, b) => b.score - a.score);

  // Collect Exhibition prompts from top 3 terms (1 prompt each)
  const exhibitionPrompts: PathwayRecommendation["exhibitionPrompts"] = [];
  for (const ts of topTerms.slice(0, 3)) {
    if (!ts.pathway || ts.pathway.exhibitionPrompts.length === 0) continue;
    exhibitionPrompts.push({
      prompt: ts.pathway.exhibitionPrompts[0],
      term: ts.term,
      aok: ts.pathway.aoks[0],
    });
  }

  // Collect Essay KQ frames from top 3 terms (1 frame each)
  const essayKQFrames: PathwayRecommendation["essayKQFrames"] = [];
  for (const ts of topTerms.slice(0, 3)) {
    if (!ts.pathway || ts.pathway.essayKQFrames.length === 0) continue;
    essayKQFrames.push({
      frame: ts.pathway.essayKQFrames[0].replace("[AOK]", ts.pathway.aoks[0]),
      term: ts.term,
      aok: ts.pathway.aoks[0],
    });
  }

  return { topTerms, aokScores, exhibitionPrompts, essayKQFrames };
}
