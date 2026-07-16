import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ElysiumAPI } from './public-api';
import type { GOAPGoal, NPCCore } from '../engine/types';

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

describe('ElysiumAPI', () => {
  let api: ElysiumAPI;

  beforeEach(() => {
    api = new ElysiumAPI();
  });

  afterEach(() => {
    api.stop();
  });

  describe('createNPC', () => {
    it('creates and registers NPC with defaults', () => {
      const npc = api.createNPC({ id: 'test-npc-1' });

      expect(npc).toBeDefined();
      expect(npc.id).toBe('test-npc-1');
      expect(npc.name).toBeDefined();
      expect(npc.age).toBe(30);
      expect(npc.personality).toBeDefined();
      expect(npc.emotions).toBeDefined();
      expect(npc.needs).toBeDefined();
      expect(npc.memories).toBeDefined();
      expect(npc.isAlive).toBe(true);
      expect(npc.wallet).toBe(100);
      expect(api.getNPC('test-npc-1')).toBeDefined();
    });

    it('uses provided partial values', () => {
      const npc = api.createNPC({ id: 'custom-npc', name: 'Aldric', age: 45 });

      expect(npc.name).toBe('Aldric');
      expect(npc.age).toBe(45);
    });

    it('generates a random id when not provided', () => {
      const npc = api.createNPC({});

      expect(npc.id).toBeDefined();
      expect(npc.id.length).toBeGreaterThan(0);
    });
  });

  describe('removeNPC', () => {
    it('removes NPC', () => {
      api.createNPC({ id: 'remove-me' });

      api.removeNPC('remove-me');

      expect(api.getNPC('remove-me')).toBeUndefined();
    });

    it('does nothing for non-existent NPC', () => {
      expect(() => api.removeNPC('nonexistent')).not.toThrow();
    });
  });

  describe('getNPC', () => {
    it('returns NPC by id', () => {
      api.createNPC({ id: 'find-me', name: 'Findable' });

      const npc = api.getNPC('find-me');

      expect(npc).toBeDefined();
      expect(npc!.name).toBe('Findable');
    });

    it('returns undefined for non-existent NPC', () => {
      expect(api.getNPC('nonexistent')).toBeUndefined();
    });
  });

  describe('getAllNPCs', () => {
    it('returns all NPCs', () => {
      api.createNPC({ id: 'npc-a' });
      api.createNPC({ id: 'npc-b' });
      api.createNPC({ id: 'npc-c' });

      const all = api.getAllNPCs();

      expect(all).toHaveLength(3);
      const ids = all.map((n) => n.id);
      expect(ids).toContain('npc-a');
      expect(ids).toContain('npc-b');
      expect(ids).toContain('npc-c');
    });

    it('returns empty array when no NPCs exist', () => {
      expect(api.getAllNPCs()).toEqual([]);
    });
  });

  describe('setGoal', () => {
    it('sets goal on NPC', () => {
      api.createNPC({ id: 'goal-npc' });
      const goal: GOAPGoal = {
        name: 'getRested',
        priority: 5,
        targetState: { rested: true },
      };

      api.setGoal('goal-npc', goal);

      const npc = api.getNPC('goal-npc');
      expect(npc!.currentGoal).toEqual(goal);
    });

    it('does nothing for non-existent NPC', () => {
      const goal: GOAPGoal = { name: 'test', priority: 1, targetState: {} };

      expect(() => api.setGoal('nonexistent', goal)).not.toThrow();
    });
  });

  describe('emit', () => {
    it('emits event through event bus', () => {
      const handler = vi.fn();
      api.subscribe('EMOTION_CHANGED', handler);

      api.emit({ type: 'EMOTION_CHANGED', source: 'test', data: { value: 1 } });

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0];
      expect(event.type).toBe('EMOTION_CHANGED');
      expect(event.source).toBe('test');
      expect(event.id).toBeDefined();
      expect(event.timestamp).toBeDefined();
    });
  });

  describe('subscribe', () => {
    it('receives events', () => {
      const handler = vi.fn();
      const subId = api.subscribe('MEMORY_FORMED', handler);

      expect(typeof subId).toBe('string');

      api.emit({ type: 'MEMORY_FORMED', source: 'test' });
      api.emit({ type: 'MEMORY_FORMED', source: 'test2' });

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('supports wildcard subscription', () => {
      const handler = vi.fn();
      api.subscribe('*', handler);

      api.emit({ type: 'EMOTION_CHANGED', source: 'test' });
      api.emit({ type: 'MEMORY_FORMED', source: 'test' });

      const types = handler.mock.calls.map((c: any[]) => c[0].type);
      expect(types).toContain('EMOTION_CHANGED');
      expect(types).toContain('MEMORY_FORMED');
      expect(handler.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getStats', () => {
    it('returns SDK stats with apiCalls > 0 after operations', () => {
      api.createNPC({ id: 'stat-npc' });
      api.getNPC('stat-npc');
      api.getAllNPCs();

      const stats = api.getStats();

      expect(stats).toBeDefined();
      expect(stats.apiCalls).toBeGreaterThan(0);
      expect(stats.uptime).toBeGreaterThanOrEqual(0);
      expect(stats.registeredPlugins).toBe(0);
      expect(stats.registeredActions).toBe(0);
      expect(stats.registeredGoals).toBe(0);
      expect(stats.registeredDebugPanels).toBe(0);
    });

    it('apiCalls increases with each operation', () => {
      const stats1 = api.getStats();
      const calls1 = stats1.apiCalls;

      api.createNPC({ id: 'track-npc' });
      api.getNPC('track-npc');

      const stats2 = api.getStats();
      expect(stats2.apiCalls).toBeGreaterThan(calls1);
    });
  });

  describe('exportState / importState', () => {
    it('round-trip serialization', () => {
      api.createNPC({ id: 'export-npc-1', name: 'Alice' });
      api.createNPC({ id: 'export-npc-2', name: 'Bob' });

      const json = api.exportState();

      expect(typeof json).toBe('string');
      expect(json.length).toBeGreaterThan(0);

      const api2 = new ElysiumAPI();
      api2.importState(json);

      const npcs = api2.getAllNPCs();
      expect(npcs).toHaveLength(2);
      const ids = npcs.map((n) => n.id);
      expect(ids).toContain('export-npc-1');
      expect(ids).toContain('export-npc-2');

      const alice = api2.getNPC('export-npc-1');
      expect(alice!.name).toBe('Alice');

      api2.stop();
    });

    it('exportState returns valid JSON', () => {
      api.createNPC({ id: 'json-npc' });

      const json = api.exportState();

      expect(() => JSON.parse(json)).not.toThrow();
      const parsed = JSON.parse(json);
      expect(parsed.version).toBeDefined();
      expect(parsed.npcs).toBeDefined();
      expect(Array.isArray(parsed.npcs)).toBe(true);
      expect(parsed.events).toBeDefined();
      expect(Array.isArray(parsed.events)).toBe(true);
    });
  });

  describe('start / stop', () => {
    it('starts auto simulation', () => {
      api.start();

      expect(api.getRuntime().isAutoRunning()).toBe(true);
    });

    it('stops auto simulation', () => {
      api.start();
      expect(api.getRuntime().isAutoRunning()).toBe(true);

      api.stop();
      expect(api.getRuntime().isAutoRunning()).toBe(false);
    });

    it('start with custom tick interval', () => {
      api = new ElysiumAPI({ autoStart: false, tickIntervalMs: 500 });
      api.start();

      expect(api.getRuntime().isAutoRunning()).toBe(true);

      api.stop();
      expect(api.getRuntime().isAutoRunning()).toBe(false);
    });

    it('autoStart config starts simulation automatically', () => {
      const autoApi = new ElysiumAPI({ autoStart: true, tickIntervalMs: 60000 });

      expect(autoApi.getRuntime().isAutoRunning()).toBe(true);

      autoApi.stop();
      expect(autoApi.getRuntime().isAutoRunning()).toBe(false);
    });
  });
});
