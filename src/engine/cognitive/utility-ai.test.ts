import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CognitiveEventBus } from './event-bus';
import { UtilityAIEngine } from './utility-ai';
import type { NPCCore, UtilityDecision } from '../types';

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

describe('UtilityAIEngine', () => {
  let eventBus: CognitiveEventBus;
  let engine: UtilityAIEngine;

  beforeEach(() => {
    eventBus = new CognitiveEventBus();
    engine = new UtilityAIEngine(eventBus);
  });

  describe('scoreActions', () => {
    it('returns top decision with action name and score', () => {
      const npc = makeMockNPC('npc-1');

      const decision = engine.scoreActions(npc);

      expect(decision).toBeDefined();
      expect(typeof decision.action).toBe('string');
      expect(decision.action.length).toBeGreaterThan(0);
      expect(typeof decision.score).toBe('number');
      expect(decision.score).toBeGreaterThan(0);
      expect(decision.timestamp).toBeDefined();
      expect(decision.factors).toBeDefined();
      expect(typeof decision.factors).toBe('object');
    });

    it('sets npc.currentAction to the top action', () => {
      const npc = makeMockNPC('npc-2');

      const decision = engine.scoreActions(npc);

      expect(npc.currentAction).toBe(decision.action);
    });

    it('adds decision to npc.decisionHistory', () => {
      const npc = makeMockNPC('npc-3');

      engine.scoreActions(npc);

      expect(npc.decisionHistory).toHaveLength(1);
      expect(npc.decisionHistory[0].action).toBeDefined();
    });

    it('emits DECISION_MADE event', () => {
      const handler = vi.fn();
      eventBus.subscribe('DECISION_MADE', handler);
      const npc = makeMockNPC('npc-4');

      engine.scoreActions(npc);

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0];
      expect(event.type).toBe('DECISION_MADE');
      expect(event.npcId).toBe('npc-4');
      expect(event.data.action).toBeDefined();
      expect(event.data.score).toBeDefined();
    });

    it('emits UTILITY_SCORED event', () => {
      const handler = vi.fn();
      eventBus.subscribe('UTILITY_SCORED', handler);
      const npc = makeMockNPC('npc-5');

      engine.scoreActions(npc);

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTopActions', () => {
    it('returns N sorted decisions', () => {
      const npc = makeMockNPC('npc-6');

      const top3 = engine.getTopActions(npc, 3);

      expect(top3).toHaveLength(3);
      expect(top3[0].score).toBeGreaterThanOrEqual(top3[1].score);
      expect(top3[1].score).toBeGreaterThanOrEqual(top3[2].score);
    });

    it('returns all when N exceeds available actions', () => {
      const npc = makeMockNPC('npc-7');

      const top = engine.getTopActions(npc, 50);

      expect(top.length).toBe(12);
    });

    it('returns 1 when N is 1', () => {
      const npc = makeMockNPC('npc-8');

      const top = engine.getTopActions(npc, 1);

      expect(top).toHaveLength(1);
    });
  });

  describe('getActionScores', () => {
    it('returns scores for all 12 actions', () => {
      const npc = makeMockNPC('npc-9');

      const scores = engine.getActionScores(npc);

      expect(Object.keys(scores)).toHaveLength(12);
    });

    it('returns action names as keys', () => {
      const npc = makeMockNPC('npc-10');

      const scores = engine.getActionScores(npc);

      const expectedActions = [
        'idle', 'seek_food', 'seek_water', 'seek_sleep',
        'seek_social', 'seek_safety', 'work', 'explore',
        'trade', 'fight', 'flee', 'play',
      ];
      for (const action of expectedActions) {
        expect(scores).toHaveProperty(action);
      }
    });

    it('returns numeric scores', () => {
      const npc = makeMockNPC('npc-11');

      const scores = engine.getActionScores(npc);

      for (const value of Object.values(scores)) {
        expect(typeof value).toBe('number');
      }
    });
  });

  describe('critical need override', () => {
    it('when hunger is below 20, seek_food gets boosted by 1.5x', () => {
      const npc = makeMockNPC('npc-12');
      npc.needs.hunger = 10;

      const scores = engine.getActionScores(npc);
      const top = engine.getTopActions(npc, 12);
      const seekFood = top.find((d) => d.action === 'seek_food')!;

      const baseScore = 5 + (10 / 100) * 0.8 * 100;
      const expectedBoosted = baseScore * 1.5;

      expect(seekFood.isCriticalOverride).toBe(true);
      expect(scores.seek_food).toBeCloseTo(expectedBoosted, 1);
    });

    it('sets isCriticalOverride on critical need action', () => {
      const npc = makeMockNPC('npc-14');
      npc.needs.thirst = 15;

      const top = engine.getTopActions(npc, 12);
      const seekWater = top.find((d) => d.action === 'seek_water');

      expect(seekWater).toBeDefined();
      expect(seekWater!.isCriticalOverride).toBe(true);
    });

    it('does not set isCriticalOverride when need is above threshold', () => {
      const npc = makeMockNPC('npc-15');
      npc.needs.thirst = 50;

      const top = engine.getTopActions(npc, 12);
      const seekWater = top.find((d) => d.action === 'seek_water');

      expect(seekWater!.isCriticalOverride).toBe(false);
    });

    it('critical override applies to multiple needs', () => {
      const npc = makeMockNPC('npc-16');
      npc.needs.hunger = 10;
      npc.needs.thirst = 10;
      npc.needs.sleep = 10;

      const top = engine.getTopActions(npc, 12);
      const seekFood = top.find((d) => d.action === 'seek_food');
      const seekWater = top.find((d) => d.action === 'seek_water');
      const seekSleep = top.find((d) => d.action === 'seek_sleep');

      expect(seekFood!.isCriticalOverride).toBe(true);
      expect(seekWater!.isCriticalOverride).toBe(true);
      expect(seekSleep!.isCriticalOverride).toBe(true);
    });
  });

  describe('score ranges', () => {
    it('scores are in 0-1 range after normalization', () => {
      const npc = makeMockNPC('npc-17');
      npc.needs.hunger = 100;
      npc.needs.thirst = 100;
      npc.needs.sleep = 0;
      npc.needs.social = 0;
      npc.needs.safety = 0;

      const scores = engine.getActionScores(npc);

      for (const value of Object.values(scores)) {
        expect(value).toBeGreaterThanOrEqual(0);
      }
    });

    it('all decisions have valid score values', () => {
      const npc = makeMockNPC('npc-18');

      const top = engine.getTopActions(npc, 12);

      for (const decision of top) {
        expect(decision.score).toBeGreaterThanOrEqual(0);
        expect(typeof decision.score).toBe('number');
        expect(Number.isFinite(decision.score)).toBe(true);
      }
    });

    it('top decision has the highest score', () => {
      const npc = makeMockNPC('npc-19');

      const all = engine.getTopActions(npc, 12);
      const maxScore = Math.max(...all.map((d) => d.score));

      expect(all[0].score).toBe(maxScore);
    });
  });
});
