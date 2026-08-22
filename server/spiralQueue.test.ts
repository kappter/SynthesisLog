import { describe, expect, it } from "vitest";
import {
  getQueueForDay,
  getStagesForDay,
  getTotalDays,
  isInTransitionZone,
  buildSpiralQueue,
  calculateSegments,
  shuffleArray,
} from "../shared/spiralQueue";

describe("Spiral Queue Logic", () => {
  const sampleTerms = [
    { term: "Term1", listId: "test", listHue: 55, originalIndex: 0 },
    { term: "Term2", listId: "test", listHue: 55, originalIndex: 1 },
    { term: "Term3", listId: "test", listHue: 55, originalIndex: 2 },
    { term: "Term4", listId: "test", listHue: 55, originalIndex: 3 },
    { term: "Term5", listId: "test", listHue: 55, originalIndex: 4 },
  ];

  describe("getTotalDays", () => {
    it("calculates total days as term count + 3", () => {
      expect(getTotalDays(5)).toBe(8);
      expect(getTotalDays(10)).toBe(13);
      expect(getTotalDays(1)).toBe(4);
    });
  });

  describe("getQueueForDay", () => {
    it("returns 1 term on day 1 (ramp-up)", () => {
      const queue = getQueueForDay(sampleTerms, 1);
      expect(queue).toHaveLength(1);
      expect(queue[0].term).toBe("Term1");
    });

    it("returns 2 terms on day 2 (ramp-up)", () => {
      const queue = getQueueForDay(sampleTerms, 2);
      expect(queue).toHaveLength(2);
      expect(queue.map(t => t.term)).toEqual(["Term1", "Term2"]);
    });

    it("returns 3 terms on day 3 (ramp-up)", () => {
      const queue = getQueueForDay(sampleTerms, 3);
      expect(queue).toHaveLength(3);
      expect(queue.map(t => t.term)).toEqual(["Term1", "Term2", "Term3"]);
    });

    it("returns 4 terms on day 4 (full queue)", () => {
      const queue = getQueueForDay(sampleTerms, 4);
      expect(queue).toHaveLength(4);
      expect(queue.map(t => t.term)).toEqual(["Term1", "Term2", "Term3", "Term4"]);
    });

    it("returns 4 terms on day 5 (sliding window)", () => {
      const queue = getQueueForDay(sampleTerms, 5);
      expect(queue).toHaveLength(4);
      expect(queue.map(t => t.term)).toEqual(["Term2", "Term3", "Term4", "Term5"]);
    });

    it("returns 3 terms on day 6 (wind-down)", () => {
      const queue = getQueueForDay(sampleTerms, 6);
      expect(queue).toHaveLength(3);
      expect(queue.map(t => t.term)).toEqual(["Term3", "Term4", "Term5"]);
    });

    it("returns 2 terms on day 7 (wind-down)", () => {
      const queue = getQueueForDay(sampleTerms, 7);
      expect(queue).toHaveLength(2);
      expect(queue.map(t => t.term)).toEqual(["Term4", "Term5"]);
    });

    it("returns 1 term on day 8 (final day)", () => {
      const queue = getQueueForDay(sampleTerms, 8);
      expect(queue).toHaveLength(1);
      expect(queue[0].term).toBe("Term5");
    });
  });

  describe("getStagesForDay", () => {
    it("assigns newest term to history on day 1", () => {
      const stages = getStagesForDay(sampleTerms, 1, 4);
      expect(stages.history?.term).toBe("Term1");
      expect(stages.concrete_abstract).toBeNull();
      expect(stages.amalgam).toBeNull();
      expect(stages.motion).toBeNull();
    });

    it("assigns correct stages on day 4 (full queue)", () => {
      const stages = getStagesForDay(sampleTerms, 4, 4);
      expect(stages.history?.term).toBe("Term4");
      expect(stages.concrete_abstract?.term).toBe("Term3");
      expect(stages.amalgam?.term).toBe("Term2");
      expect(stages.motion?.term).toBe("Term1");
    });

    it("assigns correct stages during wind-down", () => {
      const stages = getStagesForDay(sampleTerms, 6, 4);
      // After the final term enters, each earlier term continues advancing
      // through its stage position instead of remaining locked in its entry slot.
      expect(stages.history).toBeNull();
      expect(stages.concrete_abstract?.term).toBe("Term5");
      expect(stages.amalgam?.term).toBe("Term4");
      expect(stages.motion?.term).toBe("Term3");
    });
  });

  describe("isInTransitionZone", () => {
    it("returns false when not near end", () => {
      expect(isInTransitionZone(1, 5, 1)).toBe(false);
      expect(isInTransitionZone(3, 5, 1)).toBe(false);
    });

    it("returns true when 2 days from end", () => {
      // For 5 terms starting at day 1, end day is 1 + 5 + 2 = 8
      // Transition zone is days 6, 7, 8
      expect(isInTransitionZone(6, 5, 1)).toBe(true);
      expect(isInTransitionZone(7, 5, 1)).toBe(true);
    });
  });

  describe("buildSpiralQueue", () => {
    it("combines multiple segments into single queue", () => {
      const segments = [
        { listId: "a", listName: "List A", listHue: 55, terms: ["A1", "A2"] },
        { listId: "b", listName: "List B", listHue: 180, terms: ["B1", "B2"] },
      ];
      const queue = buildSpiralQueue(segments, "sequential");
      expect(queue).toHaveLength(4);
      expect(queue[0].term).toBe("A1");
      expect(queue[0].listId).toBe("a");
      expect(queue[2].term).toBe("B1");
      expect(queue[2].listId).toBe("b");
    });
  });

  describe("calculateSegments", () => {
    it("calculates segment boundaries correctly", () => {
      const segments = [
        { listId: "a", listName: "List A", listHue: 55, terms: ["A1", "A2", "A3"] },
        { listId: "b", listName: "List B", listHue: 180, terms: ["B1", "B2"] },
      ];
      const result = calculateSegments(segments);
      
      expect(result).toHaveLength(2);
      expect(result[0].startDay).toBe(1);
      expect(result[0].endDay).toBe(3);
      expect(result[0].termCount).toBe(3);
      expect(result[1].startDay).toBe(4);
      expect(result[1].endDay).toBe(5);
      expect(result[1].termCount).toBe(2);
    });
  });

  describe("shuffleArray", () => {
    it("returns array of same length", () => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray(arr);
      expect(shuffled).toHaveLength(5);
    });

    it("contains all original elements", () => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray(arr);
      expect(shuffled.sort()).toEqual(arr.sort());
    });

    it("does not modify original array", () => {
      const arr = [1, 2, 3, 4, 5];
      const original = [...arr];
      shuffleArray(arr);
      expect(arr).toEqual(original);
    });
  });
});

describe("Debug Stage Assignments", () => {
  it("should show stage assignments for 4-step model day 4", () => {
    const terms = [
      { term: "Term1", listId: "test", listHue: 35, originalIndex: 0 },
      { term: "Term2", listId: "test", listHue: 35, originalIndex: 1 },
      { term: "Term3", listId: "test", listHue: 35, originalIndex: 2 },
      { term: "Term4", listId: "test", listHue: 35, originalIndex: 3 },
    ];
    
    const stages = getStagesForDay(terms, 4, 4);
    console.log("4-step day 4 stages:", JSON.stringify(stages, null, 2));
    
    // Check all stages exist
    expect(stages.history).toBeDefined();
    expect(stages.concrete_abstract).toBeDefined();
    expect(stages.amalgam).toBeDefined();
    expect(stages.motion).toBeDefined();
  });

  it("should show stage assignments for 5-step model day 5", () => {
    const terms = [
      { term: "Term1", listId: "test", listHue: 35, originalIndex: 0 },
      { term: "Term2", listId: "test", listHue: 35, originalIndex: 1 },
      { term: "Term3", listId: "test", listHue: 35, originalIndex: 2 },
      { term: "Term4", listId: "test", listHue: 35, originalIndex: 3 },
      { term: "Term5", listId: "test", listHue: 35, originalIndex: 4 },
    ];
    
    const stages = getStagesForDay(terms, 5, 5);
    console.log("5-step day 5 stages:", JSON.stringify(stages, null, 2));
    
    // Check all 5 stages exist
    expect(stages.history).toBeDefined();
    expect(stages.concrete).toBeDefined();
    expect(stages.abstract).toBeDefined();
    expect(stages.amalgam).toBeDefined();
    expect(stages.motion).toBeDefined();
  });
});
