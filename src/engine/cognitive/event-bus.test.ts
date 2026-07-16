import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CognitiveEventBus } from './event-bus';
import type { CognitiveEvent } from '../types';

describe('CognitiveEventBus', () => {
  let bus: CognitiveEventBus;

  beforeEach(() => {
    bus = new CognitiveEventBus();
  });

  describe('subscribe and emit', () => {
    it('handler receives event with auto-generated id and timestamp', () => {
      const handler = vi.fn();
      bus.subscribe('EMOTION_CHANGED', handler);

      bus.emit({
        type: 'EMOTION_CHANGED',
        source: 'test',
        npcId: 'npc-1',
        data: { value: 42 },
      });

      expect(handler).toHaveBeenCalledTimes(1);
      const event: CognitiveEvent = handler.mock.calls[0][0];
      expect(event.id).toBeDefined();
      expect(typeof event.id).toBe('string');
      expect(event.id.length).toBeGreaterThan(0);
      expect(event.timestamp).toBeDefined();
      expect(typeof event.timestamp).toBe('number');
      expect(event.type).toBe('EMOTION_CHANGED');
      expect(event.source).toBe('test');
      expect(event.npcId).toBe('npc-1');
      expect(event.data).toEqual({ value: 42 });
    });
  });

  describe('unsubscribe', () => {
    it('handler stops receiving events', () => {
      const handler = vi.fn();
      const subId = bus.subscribe('MEMORY_FORMED', handler);

      bus.emit({ type: 'MEMORY_FORMED', source: 'test' });
      expect(handler).toHaveBeenCalledTimes(1);

      bus.unsubscribe(subId);

      bus.emit({ type: 'MEMORY_FORMED', source: 'test' });
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("wildcard '*' subscription", () => {
    it('receives all event types', () => {
      const handler = vi.fn();
      bus.subscribe('*', handler);

      bus.emit({ type: 'EMOTION_CHANGED', source: 'test' });
      bus.emit({ type: 'MEMORY_FORMED', source: 'test' });
      bus.emit({ type: 'GOAL_COMPLETED', source: 'test' });

      expect(handler).toHaveBeenCalledTimes(3);
      expect(handler.mock.calls[0][0].type).toBe('EMOTION_CHANGED');
      expect(handler.mock.calls[1][0].type).toBe('MEMORY_FORMED');
      expect(handler.mock.calls[2][0].type).toBe('GOAL_COMPLETED');
    });
  });

  describe('getHistory', () => {
    it('returns emitted events', () => {
      bus.emit({ type: 'EMOTION_CHANGED', source: 'test' });
      bus.emit({ type: 'MEMORY_FORMED', source: 'test' });

      const history = bus.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].type).toBe('EMOTION_CHANGED');
      expect(history[1].type).toBe('MEMORY_FORMED');
    });

    it('returns a copy (mutating result does not affect internal state)', () => {
      bus.emit({ type: 'EMOTION_CHANGED', source: 'test' });
      const history = bus.getHistory();
      history.pop();
      expect(bus.getHistory()).toHaveLength(1);
    });

    it('caps at 500 events (circular buffer)', () => {
      for (let i = 0; i < 600; i++) {
        bus.emit({ type: 'NEED_CHANGED', source: 'test', data: { i } });
      }

      const history = bus.getHistory();
      expect(history).toHaveLength(500);
      expect(history[0].data).toEqual({ i: 100 });
      expect(history[499].data).toEqual({ i: 599 });
    });
  });

  describe('getHistoryByType', () => {
    it('filters by type', () => {
      bus.emit({ type: 'EMOTION_CHANGED', source: 'test' });
      bus.emit({ type: 'MEMORY_FORMED', source: 'test' });
      bus.emit({ type: 'EMOTION_CHANGED', source: 'test' });
      bus.emit({ type: 'GOAL_COMPLETED', source: 'test' });

      const filtered = bus.getHistoryByType('EMOTION_CHANGED');
      expect(filtered).toHaveLength(2);
      expect(filtered.every((e) => e.type === 'EMOTION_CHANGED')).toBe(true);
    });

    it('returns empty array when no events match', () => {
      bus.emit({ type: 'EMOTION_CHANGED', source: 'test' });
      const filtered = bus.getHistoryByType('GOAL_FAILED');
      expect(filtered).toHaveLength(0);
    });
  });

  describe('clearHistory', () => {
    it('clears history', () => {
      bus.emit({ type: 'EMOTION_CHANGED', source: 'test' });
      bus.emit({ type: 'MEMORY_FORMED', source: 'test' });
      expect(bus.getHistory()).toHaveLength(2);

      bus.clearHistory();

      expect(bus.getHistory()).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    it('returns total events and per-type counts', () => {
      bus.emit({ type: 'EMOTION_CHANGED', source: 'test' });
      bus.emit({ type: 'EMOTION_CHANGED', source: 'test' });
      bus.emit({ type: 'MEMORY_FORMED', source: 'test' });

      const stats = bus.getStats();
      expect(stats.totalEvents).toBe(3);
      expect(stats.eventsByType['EMOTION_CHANGED']).toBe(2);
      expect(stats.eventsByType['MEMORY_FORMED']).toBe(1);
    });

    it('stats persist after clearHistory (totalEvents is cumulative)', () => {
      bus.emit({ type: 'EMOTION_CHANGED', source: 'test' });
      bus.clearHistory();
      bus.emit({ type: 'MEMORY_FORMED', source: 'test' });

      const stats = bus.getStats();
      expect(stats.totalEvents).toBe(2);
      expect(stats.eventsByType['EMOTION_CHANGED']).toBe(1);
      expect(stats.eventsByType['MEMORY_FORMED']).toBe(1);
    });
  });

  describe('circular buffer', () => {
    it('after 500+ events, oldest are removed', () => {
      for (let i = 0; i < 501; i++) {
        bus.emit({ type: 'NEED_CHANGED', source: 'test', data: { i } });
      }

      const history = bus.getHistory();
      expect(history).toHaveLength(500);
      expect(history[0].data).toEqual({ i: 1 });
      expect(history[499].data).toEqual({ i: 500 });
    });
  });
});
