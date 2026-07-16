import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CognitiveEventBus } from './event-bus';
import { PADEmotionEngine } from './pad-emotion';
import type { CognitiveEvent, NPCCore, PADEmotions, EmotionLabel, MoodLabel } from '../types';

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

describe('PADEmotionEngine', () => {
  let eventBus: CognitiveEventBus;
  let engine: PADEmotionEngine;

  beforeEach(() => {
    eventBus = new CognitiveEventBus();
    engine = new PADEmotionEngine(eventBus);
  });

  describe('processEmotion', () => {
    it('updates PAD values based on event', () => {
      const npc = makeMockNPC('npc-1');

      const event: CognitiveEvent = {
        id: 'evt-1',
        type: 'GOAL_COMPLETED',
        timestamp: Date.now(),
        source: 'test',
        npcId: npc.id,
        data: { intensity: 0.8, valence: 1 },
      };

      const state = engine.processEmotion(npc, event);

      expect(state.pad.pleasure).toBeGreaterThan(0);
      expect(state.pad.arousal).toBeGreaterThan(0);
      expect(state.pad.dominance).toBeGreaterThan(0);
      expect(npc.emotions.pad.pleasure).toBe(state.pad.pleasure);
    });

    it('handles negative events by decreasing pleasure', () => {
      const npc = makeMockNPC('npc-2');

      const event: CognitiveEvent = {
        id: 'evt-2',
        type: 'GOAL_FAILED',
        timestamp: Date.now(),
        source: 'test',
        npcId: npc.id,
        data: { intensity: 0.7, valence: -1 },
      };

      const state = engine.processEmotion(npc, event);

      expect(state.pad.pleasure).toBeLessThan(0);
      expect(state.pad.arousal).toBeGreaterThan(0);
      expect(state.pad.dominance).toBeLessThan(0);
    });

    it('emits EMOTION_CHANGED event', () => {
      const handler = vi.fn();
      eventBus.subscribe('EMOTION_CHANGED', handler);
      const npc = makeMockNPC('npc-3');

      engine.processEmotion(npc, {
        id: 'evt-3',
        type: 'SOCIAL_INTERACTION',
        timestamp: Date.now(),
        source: 'test',
        npcId: npc.id,
        data: { intensity: 0.5, valence: 0.5 },
      });

      expect(handler).toHaveBeenCalledTimes(1);
      const emitted = handler.mock.calls[0][0];
      expect(emitted.type).toBe('EMOTION_CHANGED');
      expect(emitted.npcId).toBe('npc-3');
    });
  });

  describe('decayEmotion', () => {
    it('decays PAD toward 0', () => {
      const npc = makeMockNPC('npc-4');
      npc.emotions.pad = { pleasure: 0.6, arousal: 0.4, dominance: 0.2 };

      const state = engine.decayEmotion(npc, 0.1);

      expect(state.pad.pleasure).toBeLessThan(0.6);
      expect(state.pad.arousal).toBeLessThan(0.4);
      expect(state.pad.dominance).toBeLessThan(0.2);
      expect(state.pad.pleasure).toBeCloseTo(0.5);
      expect(state.pad.arousal).toBeCloseTo(0.3);
      expect(state.pad.dominance).toBeCloseTo(0.1);
    });

    it('decays negative values toward 0', () => {
      const npc = makeMockNPC('npc-5');
      npc.emotions.pad = { pleasure: -0.5, arousal: -0.3, dominance: -0.2 };

      const state = engine.decayEmotion(npc, 0.1);

      expect(state.pad.pleasure).toBeGreaterThan(-0.5);
      expect(state.pad.pleasure).toBeCloseTo(-0.4);
    });

    it('returns 0 when value is smaller than decay rate', () => {
      const npc = makeMockNPC('npc-6');
      npc.emotions.pad = { pleasure: 0.05, arousal: -0.03, dominance: 0.01 };

      const state = engine.decayEmotion(npc, 0.1);

      expect(state.pad.pleasure).toBe(0);
      expect(state.pad.arousal).toBe(0);
      expect(state.pad.dominance).toBe(0);
    });
  });

  describe('getEmotionLabel', () => {
    it('derives 6 emotions from PAD values', () => {
      const pad: PADEmotions = { pleasure: 0.8, arousal: 0.7, dominance: 0.5 };

      const label = engine.getEmotionLabel(pad);

      const emotionKeys = Object.keys(label.emotions);
      expect(emotionKeys).toHaveLength(6);
      expect(emotionKeys).toContain('joy');
      expect(emotionKeys).toContain('sadness');
      expect(emotionKeys).toContain('anger');
      expect(emotionKeys).toContain('fear');
      expect(emotionKeys).toContain('disgust');
      expect(emotionKeys).toContain('surprise');
    });

    it('joy is high for positive pleasure + arousal + dominance', () => {
      const label = engine.getEmotionLabel({ pleasure: 1, arousal: 1, dominance: 1 });
      expect(label.emotions.joy).toBeGreaterThan(50);
    });

    it('sadness is high for negative pleasure', () => {
      const label = engine.getEmotionLabel({ pleasure: -1, arousal: 0, dominance: 0 });
      expect(label.emotions.sadness).toBeGreaterThan(50);
    });
  });

  describe('mood mapping', () => {
    it('returns euphoric for high pleasure + high arousal', () => {
      const label = engine.getEmotionLabel({ pleasure: 0.8, arousal: 0.8, dominance: 0 });
      expect(label.mood).toBe('euphoric');
    });

    it('returns happy for high pleasure + neutral arousal', () => {
      const label = engine.getEmotionLabel({ pleasure: 0.5, arousal: 0, dominance: 0 });
      expect(label.mood).toBe('happy');
    });

    it('returns content for high pleasure + low arousal', () => {
      const label = engine.getEmotionLabel({ pleasure: 0.5, arousal: -0.5, dominance: 0 });
      expect(label.mood).toBe('content');
    });

    it('returns calm for neutral pleasure + low arousal', () => {
      const label = engine.getEmotionLabel({ pleasure: 0, arousal: -0.5, dominance: 0 });
      expect(label.mood).toBe('calm');
    });

    it('returns neutral for all-zero PAD', () => {
      const label = engine.getEmotionLabel({ pleasure: 0, arousal: 0, dominance: 0 });
      expect(label.mood).toBe('neutral');
    });

    it('returns bored for low pleasure + low arousal', () => {
      const label = engine.getEmotionLabel({ pleasure: -0.5, arousal: -0.5, dominance: 0 });
      expect(label.mood).toBe('bored');
    });

    it('returns sad for low pleasure + neutral arousal', () => {
      const label = engine.getEmotionLabel({ pleasure: -0.5, arousal: 0, dominance: 0 });
      expect(label.mood).toBe('sad');
    });

    it('returns anxious for low pleasure + high arousal', () => {
      const label = engine.getEmotionLabel({ pleasure: -0.5, arousal: 0.8, dominance: 0 });
      expect(label.mood).toBe('anxious');
    });

    it('returns angry for neutral pleasure + high arousal', () => {
      const label = engine.getEmotionLabel({ pleasure: 0, arousal: 0.8, dominance: 0 });
      expect(label.mood).toBe('angry');
    });
  });

  describe('value ranges', () => {
    it('emotions are in 0-100 range', () => {
      const testCases: PADEmotions[] = [
        { pleasure: 1, arousal: 1, dominance: 1 },
        { pleasure: -1, arousal: -1, dominance: -1 },
        { pleasure: 0.5, arousal: -0.5, dominance: 0.3 },
        { pleasure: -0.7, arousal: 0.9, dominance: -0.4 },
      ];

      for (const pad of testCases) {
        const label = engine.getEmotionLabel(pad);
        for (const key of Object.keys(label.emotions) as EmotionLabel[]) {
          expect(label.emotions[key]).toBeGreaterThanOrEqual(0);
          expect(label.emotions[key]).toBeLessThanOrEqual(100);
        }
      }
    });

    it('PAD values are in -1 to 1 range after processEmotion', () => {
      const npc = makeMockNPC('npc-7');

      const intenseEvent: CognitiveEvent = {
        id: 'evt-7',
        type: 'GOAL_COMPLETED',
        timestamp: Date.now(),
        source: 'test',
        npcId: npc.id,
        data: { intensity: 2, valence: 1 },
      };

      engine.processEmotion(npc, intenseEvent);

      expect(npc.emotions.pad.pleasure).toBeGreaterThanOrEqual(-1);
      expect(npc.emotions.pad.pleasure).toBeLessThanOrEqual(1);
      expect(npc.emotions.pad.arousal).toBeGreaterThanOrEqual(-1);
      expect(npc.emotions.pad.arousal).toBeLessThanOrEqual(1);
      expect(npc.emotions.pad.dominance).toBeGreaterThanOrEqual(-1);
      expect(npc.emotions.pad.dominance).toBeLessThanOrEqual(1);
    });
  });
});
