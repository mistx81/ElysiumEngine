import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CognitiveEventBus } from './event-bus';
import { RelationshipGraph, RIPPLE_DECAY_FACTOR } from './relationship-graph';
import type { RelationshipType } from '../types';

describe('RelationshipGraph', () => {
  let eventBus: CognitiveEventBus;
  let graph: RelationshipGraph;

  beforeEach(() => {
    eventBus = new CognitiveEventBus();
    graph = new RelationshipGraph(eventBus);
  });

  describe('addRelationship', () => {
    it('creates relationship', () => {
      graph.addRelationship('npc-1', 'npc-2', 'friend', 20);

      const rel = graph.getRelationship('npc-1', 'npc-2');
      expect(rel).not.toBeNull();
      expect(rel!.npcId).toBe('npc-2');
      expect(rel!.type).toBe('friend');
      expect(rel!.trust).toBe(20);
      expect(rel!.affinity).toBe(0);
      expect(rel!.familiarity).toBe(0);
      expect(rel!.history).toEqual([]);
    });

    it('emits RELATIONSHIP_CHANGED event on add', () => {
      const handler = vi.fn();
      eventBus.subscribe('RELATIONSHIP_CHANGED', handler);

      graph.addRelationship('npc-1', 'npc-2', 'rival', -10);

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0];
      expect(event.type).toBe('RELATIONSHIP_CHANGED');
      expect(event.npcId).toBe('npc-1');
      expect(event.data.targetId).toBe('npc-2');
      expect(event.data.action).toBe('added');
    });

    it('does not overwrite existing relationship', () => {
      graph.addRelationship('npc-1', 'npc-2', 'friend', 30);
      graph.addRelationship('npc-1', 'npc-2', 'enemy', -50);

      const rel = graph.getRelationship('npc-1', 'npc-2');
      expect(rel!.type).toBe('friend');
      expect(rel!.trust).toBe(30);
    });

    it('clamps initial trust to valid range', () => {
      graph.addRelationship('npc-1', 'npc-2', 'friend', 200);

      const rel = graph.getRelationship('npc-1', 'npc-2');
      expect(rel!.trust).toBe(100);
    });

    it('clamps negative initial trust', () => {
      graph.addRelationship('npc-1', 'npc-2', 'enemy', -200);

      const rel = graph.getRelationship('npc-1', 'npc-2');
      expect(rel!.trust).toBe(-100);
    });
  });

  describe('updateRelationship', () => {
    it('modifies trust and affinity', () => {
      graph.addRelationship('npc-1', 'npc-2', 'friend', 20);

      graph.updateRelationship('npc-1', 'npc-2', 15, 10);

      const rel = graph.getRelationship('npc-1', 'npc-2');
      expect(rel!.trust).toBe(35);
      expect(rel!.affinity).toBe(10);
      expect(rel!.familiarity).toBe(1);
    });

    it('returns null for non-existent relationship', () => {
      const result = graph.updateRelationship('npc-1', 'npc-2', 10, 5);
      expect(result).toBeNull();
    });

    it('records history event', () => {
      graph.addRelationship('npc-1', 'npc-2', 'friend', 20);

      graph.updateRelationship('npc-1', 'npc-2', 10, 5);

      const rel = graph.getRelationship('npc-1', 'npc-2');
      expect(rel!.history).toHaveLength(1);
      expect(rel!.history[0].type).toBe('update');
      expect(rel!.history[0].delta).toBe(10);
    });

    it('emits RELATIONSHIP_CHANGED event on update', () => {
      const handler = vi.fn();
      eventBus.subscribe('RELATIONSHIP_CHANGED', handler);
      graph.addRelationship('npc-1', 'npc-2', 'friend', 20);

      graph.updateRelationship('npc-1', 'npc-2', 10, 5);

      expect(handler).toHaveBeenCalledTimes(2);
      const updateEvent = handler.mock.calls[1][0];
      expect(updateEvent.data.action).toBe('updated');
      expect(updateEvent.data.trustDelta).toBe(10);
      expect(updateEvent.data.affinityDelta).toBe(5);
    });

    it('clamps trust to max 100', () => {
      graph.addRelationship('npc-1', 'npc-2', 'friend', 90);
      graph.updateRelationship('npc-1', 'npc-2', 50, 0);

      const rel = graph.getRelationship('npc-1', 'npc-2');
      expect(rel!.trust).toBe(100);
    });

    it('clamps trust to min -100', () => {
      graph.addRelationship('npc-1', 'npc-2', 'enemy', -90);
      graph.updateRelationship('npc-1', 'npc-2', -50, 0);

      const rel = graph.getRelationship('npc-1', 'npc-2');
      expect(rel!.trust).toBe(-100);
    });

    it('increments familiarity on each update', () => {
      graph.addRelationship('npc-1', 'npc-2', 'friend', 20);

      graph.updateRelationship('npc-1', 'npc-2', 1, 0);
      graph.updateRelationship('npc-1', 'npc-2', 1, 0);
      graph.updateRelationship('npc-1', 'npc-2', 1, 0);

      const rel = graph.getRelationship('npc-1', 'npc-2');
      expect(rel!.familiarity).toBe(3);
    });
  });

  describe('getRelationship', () => {
    it('returns relationship', () => {
      graph.addRelationship('npc-1', 'npc-2', 'family', 50);

      const rel = graph.getRelationship('npc-1', 'npc-2');
      expect(rel).not.toBeNull();
      expect(rel!.type).toBe('family');
    });

    it('returns null for non-existent npc', () => {
      const rel = graph.getRelationship('npc-999', 'npc-2');
      expect(rel).toBeNull();
    });

    it('returns null for non-existent target', () => {
      graph.addRelationship('npc-1', 'npc-2', 'friend', 20);
      const rel = graph.getRelationship('npc-1', 'npc-999');
      expect(rel).toBeNull();
    });
  });

  describe('getAllRelationships', () => {
    it('returns all relationships for an NPC', () => {
      graph.addRelationship('npc-1', 'npc-2', 'friend', 20);
      graph.addRelationship('npc-1', 'npc-3', 'rival', -10);
      graph.addRelationship('npc-1', 'npc-4', 'acquaintance', 5);

      const all = graph.getAllRelationships('npc-1');
      expect(Object.keys(all)).toHaveLength(3);
      expect(all['npc-2']).toBeDefined();
      expect(all['npc-3']).toBeDefined();
      expect(all['npc-4']).toBeDefined();
    });

    it('returns empty object for NPC with no relationships', () => {
      const all = graph.getAllRelationships('npc-999');
      expect(all).toEqual({});
    });
  });

  describe('propagateRipple', () => {
    it('propagates 20% of trust delta to connected NPCs', () => {
      graph.addRelationship('npc-1', 'npc-2', 'friend', 50);
      graph.addRelationship('npc-2', 'npc-3', 'friend', 50);

      graph.propagateRipple('npc-1', 100);

      const rel12 = graph.getRelationship('npc-1', 'npc-2');
      expect(rel12!.trust).toBeGreaterThan(50);
      const expectedDelta = 100 * RIPPLE_DECAY_FACTOR;
      expect(rel12!.trust).toBeCloseTo(50 + expectedDelta, 1);
    });

    it('does not propagate back to source', () => {
      graph.addRelationship('npc-1', 'npc-2', 'friend', 50);
      graph.addRelationship('npc-2', 'npc-1', 'friend', 50);

      graph.propagateRipple('npc-1', 100);

      const rel21 = graph.getRelationship('npc-2', 'npc-1');
      expect(rel21!.trust).toBe(50);
    });

    it('emits RELATIONSHIP_RIPPLE events', () => {
      const handler = vi.fn();
      eventBus.subscribe('RELATIONSHIP_RIPPLE', handler);
      graph.addRelationship('npc-1', 'npc-2', 'friend', 50);

      graph.propagateRipple('npc-1', 50);

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0];
      expect(event.type).toBe('RELATIONSHIP_RIPPLE');
      expect(event.data.originalDelta).toBe(50);
    });

    it('respects max ripple depth of 3', () => {
      graph.addRelationship('npc-1', 'npc-2', 'friend', 50);
      graph.addRelationship('npc-2', 'npc-3', 'friend', 50);
      graph.addRelationship('npc-3', 'npc-4', 'friend', 50);
      graph.addRelationship('npc-4', 'npc-5', 'friend', 50);

      graph.propagateRipple('npc-1', 100);

      const rel45 = graph.getRelationship('npc-4', 'npc-5');
      expect(rel45!.trust).toBe(50);
    });
  });

  describe('getGraphStats', () => {
    it('returns aggregate stats', () => {
      graph.addRelationship('npc-1', 'npc-2', 'friend', 40);
      graph.addRelationship('npc-1', 'npc-3', 'rival', -20);
      graph.addRelationship('npc-2', 'npc-3', 'friend', 30);

      const stats = graph.getGraphStats();

      expect(stats.totalRelationships).toBe(3);
      expect(stats.avgTrust).toBeCloseTo((40 + (-20) + 30) / 3, 1);
      expect(stats.avgAffinity).toBe(0);
    });

    it('returns zeros for empty graph', () => {
      const stats = graph.getGraphStats();

      expect(stats.totalRelationships).toBe(0);
      expect(stats.avgTrust).toBe(0);
      expect(stats.avgAffinity).toBe(0);
    });

    it('includes affinity in average', () => {
      graph.addRelationship('npc-1', 'npc-2', 'friend', 40);
      graph.updateRelationship('npc-1', 'npc-2', 0, 20);
      graph.addRelationship('npc-1', 'npc-3', 'friend', 40);
      graph.updateRelationship('npc-1', 'npc-3', 0, 40);

      const stats = graph.getGraphStats();

      expect(stats.totalRelationships).toBe(2);
      expect(stats.avgAffinity).toBeCloseTo(30, 1);
    });
  });
});
