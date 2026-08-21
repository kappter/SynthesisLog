import { describe, expect, it } from "vitest";
import {
  getStageConfig,
  getRampUpDays,
  getTotalDays,
  getTransitionDay,
  DEPTH_NAMES,
  DEPTH_DESCRIPTIONS,
  type ReflectionDepth,
} from "../shared/reflectionDepth";
import {
  getStagesForDay,
  getTotalDays as getQueueTotalDays,
  type QueuedTerm,
} from "../shared/spiralQueue";

describe("Variable-Depth Reflection System", () => {
  describe("Stage Configuration", () => {
    it("should return correct stage count for each depth", () => {
      expect(getStageConfig(2)).toHaveLength(2);
      expect(getStageConfig(3)).toHaveLength(3);
      expect(getStageConfig(4)).toHaveLength(4);
      expect(getStageConfig(5)).toHaveLength(5);
    });

    it("should have unique stage IDs for each depth", () => {
      const depths: ReflectionDepth[] = [2, 3, 4, 5];
      
      depths.forEach((depth) => {
        const stages = getStageConfig(depth);
        const ids = stages.map((s) => s.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(stages.length);
      });
    });

    it("should have all required properties for each stage", () => {
      const depths: ReflectionDepth[] = [2, 3, 4, 5];
      
      depths.forEach((depth) => {
        const stages = getStageConfig(depth);
        stages.forEach((stage) => {
          expect(stage.id).toBeDefined();
          expect(stage.label).toBeDefined();
          expect(stage.shortLabel).toBeDefined();
          expect(stage.description).toBeDefined();
          expect(stage.placeholder).toBeDefined();
        });
      });
    });
  });

  describe("Ramp-Up Days", () => {
    it("should calculate correct ramp-up days for each depth", () => {
      expect(getRampUpDays(2)).toBe(1);
      expect(getRampUpDays(3)).toBe(2);
      expect(getRampUpDays(4)).toBe(3);
      expect(getRampUpDays(5)).toBe(4);
    });
  });

  describe("Total Days Calculation", () => {
    it("should calculate correct total days for 15-term list", () => {
      expect(getTotalDays(15, 2)).toBe(16); // 15 + 1
      expect(getTotalDays(15, 3)).toBe(17); // 15 + 2
      expect(getTotalDays(15, 4)).toBe(18); // 15 + 3
      expect(getTotalDays(15, 5)).toBe(19); // 15 + 4
    });

    it("should match spiral queue total days calculation", () => {
      const depths: ReflectionDepth[] = [2, 3, 4, 5];
      
      depths.forEach((depth) => {
        expect(getTotalDays(15, depth)).toBe(getQueueTotalDays(15, depth));
      });
    });
  });

  describe("Transition Day Calculation", () => {
    it("should calculate correct transition day for each depth", () => {
      const totalDays15Terms2Step = 16;
      const totalDays15Terms3Step = 17;
      const totalDays15Terms4Step = 18;
      const totalDays15Terms5Step = 19;

      expect(getTransitionDay(totalDays15Terms2Step, 2)).toBe(15); // Day 15 of 16
      expect(getTransitionDay(totalDays15Terms3Step, 3)).toBe(15); // Day 15 of 17
      expect(getTransitionDay(totalDays15Terms4Step, 4)).toBe(15); // Day 15 of 18
      expect(getTransitionDay(totalDays15Terms5Step, 5)).toBe(15); // Day 15 of 19
    });
  });

  describe("Stage Assignments by Day", () => {
    const createMockTerms = (count: number): QueuedTerm[] => {
      return Array.from({ length: count }, (_, i) => ({
        term: `Term ${i + 1}`,
        listId: "test-list",
        listHue: 35,
        originalIndex: i,
      }));
    };

    describe("2-Step Model", () => {
      it("should have 1 stage on day 1 (ramp-up)", () => {
        const terms = createMockTerms(15);
        const stages = getStagesForDay(terms, 1, 2);
        const activeStages = Object.values(stages).filter((s) => s !== null);
        expect(activeStages).toHaveLength(1);
      });

      it("should have 2 stages on day 2+ (full rotation)", () => {
        const terms = createMockTerms(15);
        const stages = getStagesForDay(terms, 2, 2);
        const activeStages = Object.values(stages).filter((s) => s !== null);
        expect(activeStages).toHaveLength(2);
      });
    });

    describe("3-Step Model", () => {
      it("should have 1 stage on day 1", () => {
        const terms = createMockTerms(15);
        const stages = getStagesForDay(terms, 1, 3);
        const activeStages = Object.values(stages).filter((s) => s !== null);
        expect(activeStages).toHaveLength(1);
      });

      it("should have 2 stages on day 2", () => {
        const terms = createMockTerms(15);
        const stages = getStagesForDay(terms, 2, 3);
        const activeStages = Object.values(stages).filter((s) => s !== null);
        expect(activeStages).toHaveLength(2);
      });

      it("should have 3 stages on day 3+ (full rotation)", () => {
        const terms = createMockTerms(15);
        const stages = getStagesForDay(terms, 3, 3);
        const activeStages = Object.values(stages).filter((s) => s !== null);
        expect(activeStages).toHaveLength(3);
      });
    });

    describe("4-Step Model", () => {
      it("should have 1 stage on day 1", () => {
        const terms = createMockTerms(15);
        const stages = getStagesForDay(terms, 1, 4);
        const activeStages = Object.values(stages).filter((s) => s !== null);
        expect(activeStages).toHaveLength(1);
      });

      it("should have 4 stages on day 4+ (full rotation)", () => {
        const terms = createMockTerms(15);
        const stages = getStagesForDay(terms, 4, 4);
        const activeStages = Object.values(stages).filter((s) => s !== null);
        expect(activeStages).toHaveLength(4);
      });
    });

    describe("5-Step Model", () => {
      it("should have 1 stage on day 1", () => {
        const terms = createMockTerms(15);
        const stages = getStagesForDay(terms, 1, 5);
        const activeStages = Object.values(stages).filter((s) => s !== null);
        expect(activeStages).toHaveLength(1);
      });

      it("should have 5 stages on day 5+ (full rotation)", () => {
        const terms = createMockTerms(15);
        const stages = getStagesForDay(terms, 5, 5);
        const activeStages = Object.values(stages).filter((s) => s !== null);
        expect(activeStages).toHaveLength(5);
      });
    });
  });

  describe("Depth Names and Descriptions", () => {
    it("should have names for all depths", () => {
      expect(DEPTH_NAMES[2]).toBeDefined();
      expect(DEPTH_NAMES[3]).toBeDefined();
      expect(DEPTH_NAMES[4]).toBeDefined();
      expect(DEPTH_NAMES[5]).toBeDefined();
    });

    it("should have descriptions for all depths", () => {
      expect(DEPTH_DESCRIPTIONS[2]).toBeDefined();
      expect(DEPTH_DESCRIPTIONS[3]).toBeDefined();
      expect(DEPTH_DESCRIPTIONS[4]).toBeDefined();
      expect(DEPTH_DESCRIPTIONS[5]).toBeDefined();
    });
  });
});
