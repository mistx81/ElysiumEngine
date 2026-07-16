import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CognitiveEventBus } from './event-bus';
import { AdvancedMemorySystem, DECAY_RATES } from './advanced-memory';
import type { NPCCore, MemoryType, MemoryRecord } from '../types';

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

describe('AdvancedMemorySystem', () => {
  let eventBus: CognitiveEventBus;
  let memorySystem: AdvancedMemorySystem;

  beforeEach(() => {
    eventBus = new CognitiveEventBus();
    memorySystem = new AdvancedMemorySystem(eventBus);
  });

  describe('formMemory', () => {
    it('creates memory record with correct type, content, importance', () => {
      const npc = makeMockNPC('npc-1');

      const record = memorySystem.formMemory(
        npc,
        'working',
        'Had a conversation with Bob',
        0.7,
        0.5,
        ['bob'],
      );

      expect(record.type).toBe('working');
      expect(record.content).toBe('Had a conversation with Bob');
      expect(record.importance).toBe(0.7);
      expect(record.emotionalWeight).toBe(0.5);
      expect(record.relatedNPCs).toEqual(['bob']);
      expect(record.id).toBeDefined();
      expect(record.timestamp).toBeDefined();
      expect(record.lastAccessed).toBe(record.timestamp);
      expect(record.accessCount).toBe(0);
      expect(record.decayRate).toBe(DECAY_RATES.working);
      expect(record.consolidationTarget).toBe('short');

      expect(npc.memories.working).toHaveLength(1);
      expect(npc.memories.working[0]).toBe(record);
    });

    it('emits MEMORY_FORMED event', () => {
      const handler = vi.fn();
      eventBus.subscribe('MEMORY_FORMED', handler);
      const npc = makeMockNPC('npc-2');

      memorySystem.formMemory(npc, 'short', 'Went to the market', 0.4, 0.2, []);

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0];
      expect(event.type).toBe('MEMORY_FORMED');
      expect(event.npcId).toBe('npc-2');
      expect(event.data.type).toBe('short');
    });

    it('stores memory in the correct type bucket', () => {
      const npc = makeMockNPC('npc-3');

      memorySystem.formMemory(npc, 'long', 'Learned to forge a sword', 0.8, 0.3, []);
      memorySystem.formMemory(npc, 'trauma', 'Lost a close friend', 0.9, 0.9, ['friend']);

      expect(npc.memories.long).toHaveLength(1);
      expect(npc.memories.trauma).toHaveLength(1);
      expect(npc.memories.working).toHaveLength(0);
    });
  });

  describe('decayMemories', () => {
    it('reduces importance over time', () => {
      const npc = makeMockNPC('npc-4');
      const record = memorySystem.formMemory(npc, 'working', 'Test memory', 0.8, 0.5, []);

      record.lastAccessed = Date.now() - 10000;

      memorySystem.decayMemories(npc);

      expect(record.importance).toBeLessThan(0.8);
    });

    it('removes memories with importance below threshold', () => {
      const npc = makeMockNPC('npc-5');
      const record = memorySystem.formMemory(npc, 'working', 'Fading memory', 0.05, 0.1, []);

      record.lastAccessed = Date.now() - 10000;

      memorySystem.decayMemories(npc);

      expect(npc.memories.working).toHaveLength(0);
    });

    it('emits MEMORY_DECAYED when memories are removed', () => {
      const handler = vi.fn();
      eventBus.subscribe('MEMORY_DECAYED', handler);
      const npc = makeMockNPC('npc-6');
      const record = memorySystem.formMemory(npc, 'working', 'Fading', 0.05, 0.1, []);

      record.lastAccessed = Date.now() - 10000;

      memorySystem.decayMemories(npc);

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('consolidateMemories', () => {
    it('moves memories between types', () => {
      const handler = vi.fn();
      eventBus.subscribe('MEMORY_CONSOLIDATED', handler);
      const npc = makeMockNPC('npc-7');

      const record = memorySystem.formMemory(npc, 'working', 'Important event', 0.8, 0.6, []);
      record.timestamp = Date.now() - 6000;

      memorySystem.consolidateMemories(npc);

      expect(npc.memories.working).toHaveLength(0);
      expect(npc.memories.semantic).toHaveLength(1);
      expect(npc.memories.semantic[0].type).toBe('semantic');
      expect(npc.memories.semantic[0].decayRate).toBe(DECAY_RATES.semantic);
      expect(handler).toHaveBeenCalledTimes(3);
    });

    it('does not consolidate memories that are too recent', () => {
      const npc = makeMockNPC('npc-8');
      memorySystem.formMemory(npc, 'working', 'Fresh memory', 0.8, 0.5, []);

      memorySystem.consolidateMemories(npc);

      expect(npc.memories.working).toHaveLength(1);
      expect(npc.memories.short).toHaveLength(0);
    });

    it('does not consolidate memories with low importance', () => {
      const npc = makeMockNPC('npc-9');
      const record = memorySystem.formMemory(npc, 'working', 'Low importance', 0.1, 0.1, []);
      record.timestamp = Date.now() - 6000;

      memorySystem.consolidateMemories(npc);

      expect(npc.memories.working).toHaveLength(1);
      expect(npc.memories.short).toHaveLength(0);
    });

    it('short memories consolidate to long', () => {
      const npc = makeMockNPC('npc-10');
      const record = memorySystem.formMemory(npc, 'short', 'Consolidating', 0.5, 0.3, []);
      record.timestamp = Date.now() - 6000;

      memorySystem.consolidateMemories(npc);

      expect(npc.memories.short).toHaveLength(0);
      expect(npc.memories.semantic).toHaveLength(1);
      expect(npc.memories.semantic[0].type).toBe('semantic');
    });
  });

  describe('recallMemories', () => {
    it('returns memories matching query', () => {
      const npc = makeMockNPC('npc-11');
      memorySystem.formMemory(npc, 'long', 'Visited the market yesterday', 0.7, 0.3, []);
      memorySystem.formMemory(npc, 'long', 'Talked to the blacksmith', 0.5, 0.2, []);
      memorySystem.formMemory(npc, 'short', 'Bought food at the market', 0.4, 0.1, []);

      const results = memorySystem.recallMemories(npc, 'market');

      expect(results).toHaveLength(2);
      expect(results.every((m) => m.content.toLowerCase().includes('market'))).toBe(true);
    });

    it('sorts results by importance descending', () => {
      const npc = makeMockNPC('npc-12');
      memorySystem.formMemory(npc, 'long', 'Important market visit', 0.3, 0.1, []);
      memorySystem.formMemory(npc, 'long', 'Critical market event', 0.9, 0.5, []);
      memorySystem.formMemory(npc, 'long', 'Minor market trip', 0.5, 0.2, []);

      const results = memorySystem.recallMemories(npc, 'market');

      expect(results[0].importance).toBe(0.9);
      expect(results[1].importance).toBe(0.5);
      expect(results[2].importance).toBe(0.3);
    });

    it('increments access count and updates lastAccessed', () => {
      const npc = makeMockNPC('npc-13');
      memorySystem.formMemory(npc, 'long', 'A market memory', 0.5, 0.2, []);

      const results = memorySystem.recallMemories(npc, 'market');

      expect(results[0].accessCount).toBe(1);
      expect(results[0].lastAccessed).toBeGreaterThanOrEqual(results[0].timestamp);
    });

    it('respects limit parameter', () => {
      const npc = makeMockNPC('npc-14');
      for (let i = 0; i < 5; i++) {
        memorySystem.formMemory(npc, 'long', `market event ${i}`, 0.5, 0.2, []);
      }

      const results = memorySystem.recallMemories(npc, 'market', 2);
      expect(results).toHaveLength(2);
    });

    it('emits MEMORY_RECALLED when matches found', () => {
      const handler = vi.fn();
      eventBus.subscribe('MEMORY_RECALLED', handler);
      const npc = makeMockNPC('npc-15');
      memorySystem.formMemory(npc, 'long', 'A market memory', 0.5, 0.2, []);

      memorySystem.recallMemories(npc, 'market');

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('does not emit MEMORY_RECALLED when no matches', () => {
      const handler = vi.fn();
      eventBus.subscribe('MEMORY_RECALLED', handler);
      const npc = makeMockNPC('npc-16');
      memorySystem.formMemory(npc, 'long', 'A market memory', 0.5, 0.2, []);

      memorySystem.recallMemories(npc, 'nonexistent');

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('getMemoryStats', () => {
    it('returns counts and avg importance per type', () => {
      const npc = makeMockNPC('npc-17');
      memorySystem.formMemory(npc, 'long', 'Memory A', 0.6, 0.3, []);
      memorySystem.formMemory(npc, 'long', 'Memory B', 0.4, 0.2, []);
      memorySystem.formMemory(npc, 'short', 'Memory C', 0.5, 0.1, []);

      const stats = memorySystem.getMemoryStats(npc);

      expect(stats.long.count).toBe(2);
      expect(stats.long.avgImportance).toBeCloseTo(0.5);
      expect(stats.short.count).toBe(1);
      expect(stats.short.avgImportance).toBeCloseTo(0.5);
      expect(stats.working.count).toBe(0);
      expect(stats.working.avgImportance).toBe(0);
    });

    it('returns stats for all 7 types', () => {
      const npc = makeMockNPC('npc-18');
      const stats = memorySystem.getMemoryStats(npc);

      const types = Object.keys(stats) as MemoryType[];
      expect(types).toHaveLength(7);
      expect(types).toContain('working');
      expect(types).toContain('short');
      expect(types).toContain('long');
      expect(types).toContain('semantic');
      expect(types).toContain('procedural');
      expect(types).toContain('flashbulb');
      expect(types).toContain('trauma');
    });
  });

  describe('decay rates', () => {
    it('7 memory types each have correct decay rates', () => {
      expect(DECAY_RATES.working).toBe(0.1);
      expect(DECAY_RATES.short).toBe(0.05);
      expect(DECAY_RATES.long).toBe(0.01);
      expect(DECAY_RATES.semantic).toBe(0.005);
      expect(DECAY_RATES.procedural).toBe(0.005);
      expect(DECAY_RATES.flashbulb).toBe(0.001);
      expect(DECAY_RATES.trauma).toBe(0.002);
    });

    it('working memory decays faster than long memory', () => {
      expect(DECAY_RATES.working).toBeGreaterThan(DECAY_RATES.long);
    });

    it('flashbulb memory decays slowest', () => {
      const rates = Object.values(DECAY_RATES);
      expect(DECAY_RATES.flashbulb).toBe(Math.min(...rates));
    });

    it('assigned decayRate matches DECAY_RATES for each type', () => {
      const npc = makeMockNPC('npc-19');
      const types: MemoryType[] = [
        'working', 'short', 'long', 'semantic',
        'procedural', 'flashbulb', 'trauma',
      ];

      for (const type of types) {
        const record = memorySystem.formMemory(npc, type, `test ${type}`, 0.5, 0.3, []);
        expect(record.decayRate).toBe(DECAY_RATES[type]);
      }
    });
  });
});
