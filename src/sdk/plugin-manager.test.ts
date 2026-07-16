import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ElysiumRuntime } from '../engine/elysium-runtime';
import { DebugPanelRegistry } from './debug-panel-registry';
import { PluginManager } from './plugin-manager';
import type { ElysiumPlugin, PluginManifest, GOAPAction, GOAPGoal } from '../engine/types';

function makeMockPlugin(
  name: string,
  options: {
    permissions?: string[];
    dependencies?: string[];
    installImpl?: (ctx: any) => void;
    uninstallImpl?: () => void;
    onTickImpl?: (npcs: any[]) => void;
    onEventImpl?: (event: any) => void;
  } = {},
): ElysiumPlugin {
  const manifest: PluginManifest = {
    name,
    version: '1.0.0',
    author: 'test',
    description: 'Test plugin',
    dependencies: options.dependencies,
    permissions: options.permissions as any,
  };

  return {
    manifest,
    install: options.installImpl ?? vi.fn(),
    uninstall: options.uninstallImpl,
    onTick: options.onTickImpl,
    onEvent: options.onEventImpl,
  };
}

describe('PluginManager', () => {
  let runtime: ElysiumRuntime;
  let debugPanels: DebugPanelRegistry;
  let pm: PluginManager;

  beforeEach(() => {
    runtime = new ElysiumRuntime();
    debugPanels = new DebugPanelRegistry();
    pm = new PluginManager(runtime, debugPanels);
  });

  afterEach(() => {
    runtime.stopAutoSimulation();
  });

  describe('load', () => {
    it('successfully loads a valid plugin and calls install', () => {
      const installFn = vi.fn();
      const plugin = makeMockPlugin('test-plugin', { installImpl: installFn });

      pm.load(plugin);

      expect(installFn).toHaveBeenCalledTimes(1);
      expect(pm.hasPlugin('test-plugin')).toBe(true);
    });

    it('emits PLUGIN_LOADED event', () => {
      const handler = vi.fn();
      runtime.eventBus.subscribe('PLUGIN_LOADED', handler);
      const plugin = makeMockPlugin('test-plugin');

      pm.load(plugin);

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0];
      expect(event.type).toBe('PLUGIN_LOADED');
      expect(event.data.name).toBe('test-plugin');
      expect(event.data.version).toBe('1.0.0');
    });

    it('does not load the same plugin twice', () => {
      const installFn = vi.fn();
      const plugin = makeMockPlugin('test-plugin', { installImpl: installFn });

      pm.load(plugin);
      pm.load(plugin);

      expect(installFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('unload', () => {
    it('calls uninstall and removes plugin', () => {
      const uninstallFn = vi.fn();
      const plugin = makeMockPlugin('test-plugin', { uninstallImpl: uninstallFn });

      pm.load(plugin);
      pm.unload('test-plugin');

      expect(uninstallFn).toHaveBeenCalledTimes(1);
      expect(pm.hasPlugin('test-plugin')).toBe(false);
    });

    it('emits PLUGIN_UNLOADED event', () => {
      const handler = vi.fn();
      runtime.eventBus.subscribe('PLUGIN_UNLOADED', handler);
      const plugin = makeMockPlugin('test-plugin');

      pm.load(plugin);
      pm.unload('test-plugin');

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0];
      expect(event.type).toBe('PLUGIN_UNLOADED');
      expect(event.data.name).toBe('test-plugin');
    });

    it('does nothing for non-existent plugin', () => {
      const handler = vi.fn();
      runtime.eventBus.subscribe('PLUGIN_UNLOADED', handler);

      pm.unload('nonexistent');

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('dependency resolution', () => {
    it('throws when dependency not loaded', () => {
      const plugin = makeMockPlugin('dependent-plugin', {
        dependencies: ['missing-dep'],
      });

      expect(() => pm.load(plugin)).toThrow(
        /unsatisfied dependencies.*missing-dep/,
      );
      expect(pm.hasPlugin('dependent-plugin')).toBe(false);
    });

    it('succeeds when dependency is loaded first', () => {
      const depPlugin = makeMockPlugin('dep-plugin');
      const dependentPlugin = makeMockPlugin('dependent-plugin', {
        dependencies: ['dep-plugin'],
      });

      pm.load(depPlugin);
      expect(() => pm.load(dependentPlugin)).not.toThrow();
      expect(pm.hasPlugin('dependent-plugin')).toBe(true);
    });

    it('throws when multiple dependencies are missing', () => {
      const plugin = makeMockPlugin('multi-dep-plugin', {
        dependencies: ['dep-a', 'dep-b'],
      });

      expect(() => pm.load(plugin)).toThrow(/dep-a.*dep-b|dep-b.*dep-a/);
    });
  });

  describe('permission checking', () => {
    it("plugin without 'register:actions' cannot register actions", () => {
      const plugin = makeMockPlugin('no-actions-plugin', {
        permissions: [],
        installImpl: (ctx) => {
          ctx.registerAction({ name: 'test-action', cost: 1, preconditions: {}, effects: {} });
        },
      });

      pm.load(plugin);

      expect(pm.getRegisteredActions()).toHaveLength(0);
    });

    it("plugin with 'register:actions' can register actions", () => {
      const plugin = makeMockPlugin('actions-plugin', {
        permissions: ['register:actions'],
        installImpl: (ctx) => {
          ctx.registerAction({ name: 'test-action', cost: 1, preconditions: {}, effects: {} });
        },
      });

      pm.load(plugin);

      expect(pm.getRegisteredActions()).toHaveLength(1);
      expect(pm.getRegisteredActions()[0].name).toBe('test-action');
    });

    it("plugin with 'register:goals' can register goals", () => {
      const goal: GOAPGoal = { name: 'test-goal', priority: 5, targetState: {} };
      const plugin = makeMockPlugin('goals-plugin', {
        permissions: ['register:goals'],
        installImpl: (ctx) => {
          ctx.registerGoal(goal);
        },
      });

      pm.load(plugin);

      expect(pm.getRegisteredGoals()).toHaveLength(1);
      expect(pm.getRegisteredGoals()[0].name).toBe('test-goal');
    });

    it("plugin without 'register:goals' cannot register goals", () => {
      const plugin = makeMockPlugin('no-goals-plugin', {
        permissions: [],
        installImpl: (ctx) => {
          ctx.registerGoal({ name: 'test-goal', priority: 5, targetState: {} });
        },
      });

      pm.load(plugin);

      expect(pm.getRegisteredGoals()).toHaveLength(0);
    });
  });

  describe('getLoadedPlugins', () => {
    it('returns loaded plugin names', () => {
      pm.load(makeMockPlugin('plugin-a'));
      pm.load(makeMockPlugin('plugin-b'));

      const names = pm.getLoadedPlugins();

      expect(names).toHaveLength(2);
      expect(names).toContain('plugin-a');
      expect(names).toContain('plugin-b');
    });

    it('returns empty array when no plugins loaded', () => {
      expect(pm.getLoadedPlugins()).toEqual([]);
    });
  });

  describe('tickAll', () => {
    it('calls onTick for loaded plugins', () => {
      const onTickFn = vi.fn();
      const plugin = makeMockPlugin('tick-plugin', { onTickImpl: onTickFn });

      pm.load(plugin);
      pm.tickAll([]);

      expect(onTickFn).toHaveBeenCalledTimes(1);
      expect(onTickFn).toHaveBeenCalledWith([]);
    });

    it('does not call onTick for unloaded plugins', () => {
      const onTickFn = vi.fn();
      const plugin = makeMockPlugin('tick-plugin', { onTickImpl: onTickFn });

      pm.load(plugin);
      pm.unload('tick-plugin');
      pm.tickAll([]);

      expect(onTickFn).not.toHaveBeenCalled();
    });

    it('handles plugins without onTick gracefully', () => {
      const plugin = makeMockPlugin('no-tick-plugin');

      pm.load(plugin);

      expect(() => pm.tickAll([])).not.toThrow();
    });
  });

  describe('handleEvent', () => {
    it('calls onEvent for loaded plugins', () => {
      const onEventFn = vi.fn();
      const plugin = makeMockPlugin('event-plugin', { onEventImpl: onEventFn });

      pm.load(plugin);

      const testEvent = {
        id: 'evt-1',
        type: 'EMOTION_CHANGED' as const,
        timestamp: Date.now(),
        source: 'test',
      };
      pm.handleEvent(testEvent);

      expect(onEventFn).toHaveBeenCalledTimes(1);
      expect(onEventFn).toHaveBeenCalledWith(testEvent);
    });

    it('handles plugins without onEvent gracefully', () => {
      const plugin = makeMockPlugin('no-event-plugin');

      pm.load(plugin);

      expect(() =>
        pm.handleEvent({
          id: 'evt-1',
          type: 'EMOTION_CHANGED',
          timestamp: Date.now(),
          source: 'test',
        }),
      ).not.toThrow();
    });
  });

  describe('plugin install error', () => {
    it('emits PLUGIN_ERROR and does not load when install throws', () => {
      const handler = vi.fn();
      runtime.eventBus.subscribe('PLUGIN_ERROR', handler);

      const plugin = makeMockPlugin('error-plugin', {
        installImpl: () => {
          throw new Error('Install failed');
        },
      });

      pm.load(plugin);

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0];
      expect(event.type).toBe('PLUGIN_ERROR');
      expect(event.data.plugin).toBe('error-plugin');
      expect(event.data.error).toBe('Install failed');
      expect(pm.hasPlugin('error-plugin')).toBe(false);
    });
  });
});
