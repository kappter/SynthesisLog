/**
 * Variable-depth reflection system
 * Allows users to choose between 2, 3, 4, or 5-step models
 */

export type ReflectionDepth = 2 | 3 | 4 | 5;

export interface StageConfig {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  placeholder: string;
  combinedStages?: string[]; // For stages that combine multiple reflection types
}

/**
 * Stage configurations for each reflection depth
 */
export const DEPTH_CONFIGS: Record<ReflectionDepth, StageConfig[]> = {
  // 2-Step Model: Quick Synthesis
  2: [
    {
      id: "foundation",
      label: "Foundation",
      shortLabel: "History + Analysis",
      description: "Historical context and concrete/abstract analysis",
      placeholder: "Tell the story of this term — where it came from, who championed it, what it looks like in action. Then zoom out: what is the abstract principle underneath?",
      combinedStages: ["history", "concrete", "abstract"],
    },
    {
      id: "application",
      label: "Application",
      shortLabel: "Synthesis + Motion",
      description: "Amalgamation with other concepts and proposed actions",
      placeholder: "What new idea emerges when today\u2019s terms are placed in conversation? Identify one tension, one harmony — then propose a concrete project, experiment, or practice that brings these ideas to life.",
      combinedStages: ["amalgam", "motion"],
    },
  ],

  // 3-Step Model: Balanced
  3: [
    {
      id: "history",
      label: "History",
      shortLabel: "Context",
      description: "Historical context and background associations",
      placeholder: "Tell me a story about this term. Where did it come from, who championed it, and what problem was it solving? What surprised you most about its origins?",
    },
    {
      id: "analysis",
      label: "Analysis",
      shortLabel: "Concrete + Abstract",
      description: "Observable facts and theoretical frameworks",
      placeholder: "Paint me a picture. What does this term look like in action? Give me a specific, observable example — then zoom out. What theoretical framework or underlying principle does it reveal?",
      combinedStages: ["concrete", "abstract"],
    },
    {
      id: "synthesis",
      label: "Synthesis",
      shortLabel: "Amalgam + Motion",
      description: "Connections with other terms and proposed actions",
      placeholder: "What new understanding emerges when today\u2019s terms are placed in conversation? Identify one tension and one surprising harmony — then propose a concrete project, experiment, or practice that brings these ideas to life.",
      combinedStages: ["amalgam", "motion"],
    },
  ],

  // 4-Step Model: Deep Dive (Current)
  4: [
    {
      id: "history",
      label: "History",
      shortLabel: "Context",
      description: "Historical context and background associations",
      placeholder: "Tell me a story about this term. Where did it come from, who championed it, and what problem was it solving? What surprised you most about its origins?",
    },
    {
      id: "concrete_abstract",
      label: "Concrete / Abstract",
      shortLabel: "Analysis",
      description: "Observable facts and theoretical frameworks",
      placeholder: "Paint me a picture. What does this term look like in action? Give me a specific example I could observe — then zoom out. What\u2019s the abstract principle underneath?",
      combinedStages: ["concrete", "abstract"],
    },
    {
      id: "amalgam",
      label: "Amalgamation",
      shortLabel: "Synthesis",
      description: "Connections and synthesis with other terms",
      placeholder: "Imagine today\u2019s terms at a dinner table. What unexpected connections emerge? Where do they clash, where do they harmonize, and what new idea appears only when they\u2019re in the same room?",
    },
    {
      id: "motion",
      label: "Motion",
      shortLabel: "Action",
      description: "Proposed actions or applications",
      placeholder: "If these terms were ingredients in a recipe, what would you create? Propose a concrete project, experiment, or practice. Be specific — name the output, the audience, and the first step.",
    },
  ],

  // 5-Step Model: Maximum Depth
  5: [
    {
      id: "history",
      label: "History",
      shortLabel: "Context",
      description: "Historical context and background associations",
      placeholder: "Tell me a story about this term. Where did it come from, who championed it, and what problem was it solving? What surprised you most about its origins?",
    },
    {
      id: "concrete",
      label: "Concrete",
      shortLabel: "Observable",
      description: "Observable facts, patterns, and empirical data",
      placeholder: "Paint me a picture. What does this term look like in action? Give me a specific, observable example you could point to in the real world — something you could photograph, measure, or demonstrate.",
    },
    {
      id: "abstract",
      label: "Abstract",
      shortLabel: "Theoretical",
      description: "Theoretical frameworks, principles, and concepts",
      placeholder: "Now zoom out. What is the underlying principle or theoretical framework? If you had to explain the big idea to someone who\u2019s never encountered this term, what metaphor or analogy would you use?",
    },
    {
      id: "amalgam",
      label: "Amalgamation",
      shortLabel: "Synthesis",
      description: "Connections and synthesis with other terms",
      placeholder: "Imagine today\u2019s terms at a dinner table. What unexpected connections emerge? Where do they clash, where do they harmonize, and what new idea appears only when they\u2019re in the same room?",
    },
    {
      id: "motion",
      label: "Motion",
      shortLabel: "Action",
      description: "Proposed actions or applications",
      placeholder: "If these terms were ingredients in a recipe, what would you create? Propose a concrete project, experiment, or practice. Be specific — name the output, the audience, and the first step.",
    },
  ],
};

/**
 * Get the number of ramp-up days for a given depth
 */
export function getRampUpDays(depth: ReflectionDepth): number {
  return depth - 1;
}

/**
 * Get the total days for a term list at a given depth
 */
export function getTotalDays(termCount: number, depth: ReflectionDepth): number {
  return termCount + getRampUpDays(depth);
}

/**
 * Get the transition zone day (when to prompt for next list)
 */
export function getTransitionDay(totalDays: number, depth: ReflectionDepth): number {
  return totalDays - (depth - 1);
}

/**
 * Get stage configuration for a specific depth
 */
export function getStageConfig(depth: ReflectionDepth): StageConfig[] {
  return DEPTH_CONFIGS[depth];
}

/**
 * Get depth description for UI
 */
export const DEPTH_DESCRIPTIONS: Record<ReflectionDepth, string> = {
  2: "Quick Synthesis - Fast-paced learning for reviews and familiar material",
  3: "Balanced - Standard learning pace for most subject areas",
  4: "Deep Dive - Extended reflection for complex topics",
  5: "Maximum Depth - Research-level analysis with concrete/abstract separation",
};

/**
 * Get depth name for UI
 */
export const DEPTH_NAMES: Record<ReflectionDepth, string> = {
  2: "2-Step (Quick)",
  3: "3-Step (Balanced)",
  4: "4-Step (Deep)",
  5: "5-Step (Maximum)",
};
