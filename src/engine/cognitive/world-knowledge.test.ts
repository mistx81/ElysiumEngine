import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CognitiveEventBus } from './event-bus';
import { WorldKnowledge, DEFAULT_LOCATIONS, SEASON_LENGTH_DAYS, TICK_MS } from './world-knowledge';
import type { WorldEventType } from '../types';

describe('WorldKnowledge', () => {
  let eventBus: CognitiveEventBus;
  let world: WorldKnowledge;

  beforeEach(() => {
    eventBus = new CognitiveEventBus();
    world = new WorldKnowledge(eventBus);
  });

  describe('tick', () => {
    it('advances time and returns world state', () => {
      const result = world.tick(1000);

      expect(result).toBeDefined();
      expect(result.day).toBeDefined();
      expect(result.hour).toBeDefined();
      expect(result.season).toBeDefined();
      expect(result.weather).toBeDefined();
    });

    it('first tick initializes lastTickMs and returns initial state', () => {
      const state = world.tick(1000);

      expect(state.day).toBe(0);
      expect(state.hour).toBe(0);
      expect(state.season).toBe('spring');
    });

    it('advances hour when enough time passes', () => {
      world.tick(1000);
      world.tick(1000 + TICK_MS);

      expect(world.getWorldState().hour).toBe(1);
    });

    it('advances day when 24 hours pass', () => {
      world.tick(1000);
      world.tick(1000 + TICK_MS * 24);

      const state = world.getWorldState();
      expect(state.day).toBe(1);
      expect(state.hour).toBe(0);
    });

    it('emits WORLD_TIME_CHANGED when time advances', () => {
      const handler = vi.fn();
      eventBus.subscribe('WORLD_TIME_CHANGED', handler);
      world.tick(1000);

      world.tick(1000 + TICK_MS);

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('getWorldState', () => {
    it('returns current state with day, hour, season, weather', () => {
      const state = world.getWorldState();

      expect(state.day).toBe(0);
      expect(state.hour).toBe(0);
      expect(state.season).toBe('spring');
      expect(state.weather).toBeDefined();
      expect(typeof state.weather).toBe('string');
    });

    it('returns locations in state', () => {
      const state = world.getWorldState();

      expect(state.locations).toBeDefined();
      expect(Object.keys(state.locations).length).toBeGreaterThan(0);
    });

    it('returns facts in state', () => {
      const state = world.getWorldState();

      expect(state.facts).toBeDefined();
      expect(Array.isArray(state.facts)).toBe(true);
      expect(state.facts.length).toBeGreaterThan(0);
    });

    it('returns activeEvents in state', () => {
      const state = world.getWorldState();

      expect(state.activeEvents).toBeDefined();
      expect(Array.isArray(state.activeEvents)).toBe(true);
    });

    it('returns a copy (mutating does not affect internal state)', () => {
      const state = world.getWorldState();
      state.day = 999;

      expect(world.getWorldState().day).toBe(0);
    });
  });

  describe('addFact', () => {
    it('creates world fact', () => {
      const fact = world.addFact('A new dragon was sighted.', 'danger', ['npc-1']);

      expect(fact).toBeDefined();
      expect(fact.id).toBeDefined();
      expect(fact.content).toBe('A new dragon was sighted.');
      expect(fact.category).toBe('danger');
      expect(fact.knownBy).toEqual(['npc-1']);
      expect(fact.timestamp).toBeDefined();
    });

    it('adds fact to world state', () => {
      const initialCount = world.getFacts().length;
      world.addFact('Test fact', 'test', []);

      expect(world.getFacts().length).toBe(initialCount + 1);
    });

    it('emits WORLD_FACT_LEARNED for each NPC in knownBy', () => {
      const handler = vi.fn();
      eventBus.subscribe('WORLD_FACT_LEARNED', handler);

      world.addFact('Shared fact', 'test', ['npc-1', 'npc-2']);

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('does not emit when knownBy is empty', () => {
      const handler = vi.fn();
      eventBus.subscribe('WORLD_FACT_LEARNED', handler);

      world.addFact('Unknown fact', 'test', []);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('learnFact', () => {
    it('marks fact as known by NPC', () => {
      const fact = world.addFact('A secret was discovered.', 'mystery', []);

      world.learnFact('npc-1', fact.id);

      const facts = world.getFactsForNPC('npc-1');
      expect(facts).toHaveLength(1);
      expect(facts[0].id).toBe(fact.id);
    });

    it('emits WORLD_FACT_LEARNED event', () => {
      const handler = vi.fn();
      eventBus.subscribe('WORLD_FACT_LEARNED', handler);
      const fact = world.addFact('A secret.', 'mystery', []);

      world.learnFact('npc-1', fact.id);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('does not add NPC twice', () => {
      const fact = world.addFact('A secret.', 'mystery', []);

      world.learnFact('npc-1', fact.id);
      world.learnFact('npc-1', fact.id);

      const facts = world.getFactsForNPC('npc-1');
      expect(facts).toHaveLength(1);
    });

    it('does nothing for non-existent fact', () => {
      const handler = vi.fn();
      eventBus.subscribe('WORLD_FACT_LEARNED', handler);

      world.learnFact('npc-1', 'nonexistent-fact-id');

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('triggerEvent', () => {
    it('creates world event', () => {
      const event = world.triggerEvent('storm');

      expect(event).toBeDefined();
      expect(event.id).toBeDefined();
      expect(event.type).toBe('storm');
      expect(event.description).toBeDefined();
      expect(event.timestamp).toBeDefined();
      expect(event.duration).toBeDefined();
      expect(event.affectedLocations).toBeDefined();
      expect(event.economicImpact).toBeDefined();
    });

    it('adds event to activeEvents', () => {
      const initialCount = world.getActiveEvents().length;

      world.triggerEvent('festival');

      expect(world.getActiveEvents().length).toBe(initialCount + 1);
    });

    it('emits WORLD_EVENT event', () => {
      const handler = vi.fn();
      eventBus.subscribe('WORLD_EVENT', handler);

      world.triggerEvent('invasion');

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0];
      expect(event.type).toBe('WORLD_EVENT');
      expect(event.data.type).toBe('invasion');
    });

    it('sets weather to storm when storm event triggered', () => {
      world.triggerEvent('storm');

      expect(world.getWorldState().weather).toBe('storm');
    });

    it('populates economic impact for event type', () => {
      const event = world.triggerEvent('drought');

      expect(event.economicImpact.food).toBeLessThan(0);
      expect(event.economicImpact.water).toBeLessThan(0);
    });
  });

  describe('locations', () => {
    it('8 locations initialized', () => {
      expect(DEFAULT_LOCATIONS).toHaveLength(8);
    });

    it('all locations have id, name, type, x, y, capacity', () => {
      for (const loc of DEFAULT_LOCATIONS) {
        expect(loc.id).toBeDefined();
        expect(loc.name).toBeDefined();
        expect(loc.type).toBeDefined();
        expect(loc.x).toBeDefined();
        expect(loc.y).toBeDefined();
        expect(loc.capacity).toBeDefined();
        expect(loc.capacity).toBeGreaterThan(0);
      }
    });

    it('getLocations returns all 8 locations', () => {
      const locations = world.getLocations();

      expect(locations).toHaveLength(8);
    });

    it('locations are accessible via getWorldState', () => {
      const state = world.getWorldState();
      expect(Object.keys(state.locations)).toHaveLength(8);
    });
  });

  describe('season changes', () => {
    it('season changes every 30 days', () => {
      expect(SEASON_LENGTH_DAYS).toBe(30);
    });

    it('starts in spring', () => {
      expect(world.getWorldState().season).toBe('spring');
    });

    it('changes to summer after 30 days', () => {
      world.tick(1000);
      world.tick(1000 + TICK_MS * 24 * 30);

      expect(world.getWorldState().season).toBe('summer');
    });

    it('changes to autumn after 60 days', () => {
      world.tick(1000);
      world.tick(1000 + TICK_MS * 24 * 60);

      expect(world.getWorldState().season).toBe('autumn');
    });

    it('changes to winter after 90 days', () => {
      world.tick(1000);
      world.tick(1000 + TICK_MS * 24 * 90);

      expect(world.getWorldState().season).toBe('winter');
    });

    it('wraps back to spring after 120 days', () => {
      world.tick(1000);
      world.tick(1000 + TICK_MS * 24 * 120);

      expect(world.getWorldState().season).toBe('spring');
    });
  });
});
