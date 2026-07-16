import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CognitiveEventBus } from './event-bus';
import { GOAPPlanner } from './goap-planner';
import type { NPCCore, GOAPGoal, GOAPWorldState, GOAPPlan, GOAPAction } from '../types';

function makeMockNPC(id: string = 'npc-1'): NPCCore {
  return {
    id,
    name: `NPC-${id}`,
    age: 30,
    personality: {
      openness: 50,
      conscientiousness: 50,
      extraversion: 50,
      agreeableness: 50,
      neuroticism: 50,
    },
    emotions: {
      pad: { pleasure: 0, arousal: 0, dominance: 0 },
      emotions: {
        joy: 0, sadness: 0, anger: 0, fear: 0, disgust: 0, surprise: 0,
      },
      mood: 'neutral',
    },
    needs: {
      hunger: 50, thirst: 50, sleep: 50, social: 50,
      safety: 50, esteem: 50, selfActualization: 50,
    },
    memories: {
      working: [], short: [], long: [], semantic: [],
      procedural: [], flashbulb: [], trauma: [],
    },
    relationships: {},
    currentGoal: null,
    currentPlan: null,
    currentAction: null,
    position: { x: 0, y: 0 },
    isAlive: true,
    thoughtHistory: [],
    decisionHistory: [],
    predictions: [],
    reflections: [],
    episodicEvents: [],
    personalityDriftHistory: [],
    wallet: 100,
    schedule: null,
    factionId: null,
    knownFacts: [],
    lastTickMs: 0,
    lodLevel: 'full',
  };
}

describe('GOAPPlanner', () => {
  let eventBus: CognitiveEventBus;
  let planner: GOAPPlanner;

  beforeEach(() => {
    eventBus = new CognitiveEventBus();
    planner = new GOAPPlanner(eventBus);
  });

  describe('plan', () => {
    it('finds a valid plan for a simple goal', () => {
      const npc = makeMockNPC('npc-1');
      const goal: GOAPGoal = {
        name: 'getRested',
        priority: 5,
        targetState: { rested: true },
      };
      const worldState: GOAPWorldState = {
        isSafe: true,
      };

      const plan = planner.plan(npc, goal, worldState);

      expect(plan.found).toBe(true);
      expect(plan.actions.length).toBeGreaterThan(0);
      expect(plan.totalCost).toBeGreaterThan(0);
      expect(plan.goal).toBe(goal);
      const finalState = plan.actions.reduce(
        (state, action) => ({ ...state, ...action.effects }),
        { ...worldState },
      );
      expect(finalState.rested).toBe(true);
    });

    it('returns GOAPPlan with found=true when solvable', () => {
      const npc = makeMockNPC('npc-2');
      const goal: GOAPGoal = {
        name: 'getFood',
        priority: 10,
        targetState: { hunger: true },
      };
      const worldState: GOAPWorldState = {
        hasFood: true,
      };

      const plan = planner.plan(npc, goal, worldState);

      expect(plan.found).toBe(true);
      expect(plan.actions.length).toBeGreaterThan(0);
    });

    it('returns found=false when unsolvable', () => {
      const npc = makeMockNPC('npc-3');
      const goal: GOAPGoal = {
        name: 'impossibleGoal',
        priority: 10,
        targetState: { impossibleFlag: true },
      };
      const worldState: GOAPWorldState = {};

      const plan = planner.plan(npc, goal, worldState);

      expect(plan.found).toBe(false);
      expect(plan.actions).toHaveLength(0);
    });

    it('emits GOAP_PLAN_REQUESTED and GOAP_PLAN_FOUND events', () => {
      const requestedHandler = vi.fn();
      const foundHandler = vi.fn();
      eventBus.subscribe('GOAP_PLAN_REQUESTED', requestedHandler);
      eventBus.subscribe('GOAP_PLAN_FOUND', foundHandler);
      const npc = makeMockNPC('npc-4');
      const goal: GOAPGoal = {
        name: 'getRested',
        priority: 5,
        targetState: { rested: true },
      };

      planner.plan(npc, goal, { isSafe: true });

      expect(requestedHandler).toHaveBeenCalledTimes(1);
      expect(foundHandler).toHaveBeenCalledTimes(1);
    });

    it('emits GOAP_PLAN_FAILED when unsolvable', () => {
      const failedHandler = vi.fn();
      eventBus.subscribe('GOAP_PLAN_FAILED', failedHandler);
      const npc = makeMockNPC('npc-5');
      const goal: GOAPGoal = {
        name: 'impossible',
        priority: 1,
        targetState: { impossibleFlag: true },
      };

      planner.plan(npc, goal, {});

      expect(failedHandler).toHaveBeenCalledTimes(1);
    });

    it('can chain multiple actions to reach goal', () => {
      const npc = makeMockNPC('npc-6');
      const goal: GOAPGoal = {
        name: 'craftItem',
        priority: 5,
        targetState: { crafted: true },
      };
      const worldState: GOAPWorldState = {};

      const plan = planner.plan(npc, goal, worldState);

      expect(plan.found).toBe(true);
      const hasGather = plan.actions.some((a) => a.name === 'gather');
      const hasCraft = plan.actions.some((a) => a.name === 'craft');
      expect(hasGather).toBe(true);
      expect(hasCraft).toBe(true);
    });
  });

  describe('getCachedPlan', () => {
    it('returns cached plan after initial plan', () => {
      const npc = makeMockNPC('npc-7');
      const goal: GOAPGoal = {
        name: 'getRested',
        priority: 5,
        targetState: { rested: true },
      };
      const worldState: GOAPWorldState = { isSafe: true };

      const originalPlan = planner.plan(npc, goal, worldState);
      expect(originalPlan.cached).toBe(false);

      const secondPlan = planner.plan(npc, goal, worldState);
      expect(secondPlan.cached).toBe(true);
      expect(secondPlan.found).toBe(true);
      expect(secondPlan.actions).toEqual(originalPlan.actions);
    });

    it('returns null for non-existent cache key', () => {
      const result = planner.getCachedPlan('nonexistent-key');
      expect(result).toBeNull();
    });
  });

  describe('getActionLibrary', () => {
    it('returns 18 actions', () => {
      const actions = planner.getActionLibrary();

      expect(actions).toHaveLength(18);
    });

    it('returns a copy (mutating does not affect internal library)', () => {
      const actions = planner.getActionLibrary();
      actions.push({ name: 'injected', cost: 1, preconditions: {}, effects: {} });

      expect(planner.getActionLibrary()).toHaveLength(18);
    });

    it('all actions have name, cost, preconditions, and effects', () => {
      const actions = planner.getActionLibrary();

      for (const action of actions) {
        expect(action.name).toBeDefined();
        expect(typeof action.name).toBe('string');
        expect(action.cost).toBeDefined();
        expect(typeof action.cost).toBe('number');
        expect(action.preconditions).toBeDefined();
        expect(typeof action.preconditions).toBe('object');
        expect(action.effects).toBeDefined();
        expect(typeof action.effects).toBe('object');
      }
    });
  });

  describe('repairPlan', () => {
    it('attempts to fix invalid plan', () => {
      const npc = makeMockNPC('npc-8');
      const goal: GOAPGoal = {
        name: 'getRested',
        priority: 5,
        targetState: { rested: true },
      };
      const invalidPlan: GOAPPlan = {
        goal,
        actions: [
          { name: 'sleep', cost: 3, preconditions: { isSafe: true }, effects: { rested: true } },
        ],
        totalCost: 3,
        found: true,
        cached: false,
      };

      const repaired = planner.repairPlan(npc, invalidPlan, { isSafe: false });

      expect(repaired).toBeDefined();
      expect(repaired.goal).toBe(goal);
    });

    it('keeps valid actions and replaces invalid ones', () => {
      const npc = makeMockNPC('npc-9');
      const goal: GOAPGoal = {
        name: 'getRested',
        priority: 5,
        targetState: { rested: true },
      };
      const plan: GOAPPlan = {
        goal,
        actions: [
          { name: 'sleep', cost: 3, preconditions: { isSafe: true }, effects: { rested: true } },
        ],
        totalCost: 3,
        found: true,
        cached: false,
      };

      const repaired = planner.repairPlan(npc, plan, { isSafe: true });

      expect(repaired.actions.length).toBeGreaterThan(0);
      expect(repaired.found).toBe(true);
    });

    it('emits GOAP_PLAN_REPAIRED event', () => {
      const handler = vi.fn();
      eventBus.subscribe('GOAP_PLAN_REPAIRED', handler);
      const npc = makeMockNPC('npc-10');
      const goal: GOAPGoal = {
        name: 'getRested',
        priority: 5,
        targetState: { rested: true },
      };
      const plan: GOAPPlan = {
        goal,
        actions: [
          { name: 'sleep', cost: 3, preconditions: { isSafe: true }, effects: { rested: true } },
        ],
        totalCost: 3,
        found: true,
        cached: false,
      };

      planner.repairPlan(npc, plan, { isSafe: false });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('recomputes plan when goal not met after repair', () => {
      const npc = makeMockNPC('npc-11');
      const goal: GOAPGoal = {
        name: 'getRested',
        priority: 5,
        targetState: { rested: true },
      };
      const brokenPlan: GOAPPlan = {
        goal,
        actions: [
          { name: 'explore', cost: 4, preconditions: {}, effects: { explored: true } },
        ],
        totalCost: 4,
        found: true,
        cached: false,
      };

      const repaired = planner.repairPlan(npc, brokenPlan, {});

      expect(repaired.found).toBe(true);
      const finalState = repaired.actions.reduce(
        (state, action) => ({ ...state, ...action.effects }),
        {} as Record<string, any>,
      );
      expect(finalState.rested).toBe(true);
    });
  });
});
