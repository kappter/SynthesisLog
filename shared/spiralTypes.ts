/**
 * Spiral-specific types for the Synthesis Log application
 */

export type SpiralMode = "sequential" | "shuffled" | "blended";

export const SPIRAL_MODE_LABELS: Record<SpiralMode, string> = {
  sequential: "Sequential",
  shuffled: "Shuffled",
  blended: "Blended",
};

export const SPIRAL_MODE_DESCRIPTIONS: Record<SpiralMode, string> = {
  sequential: "Terms appear in their original list order",
  shuffled: "Terms randomized within each list separately",
  blended: "All selected lists shuffled together for maximum amalgamation",
};
